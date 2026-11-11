/**
 * Music state for "Kesavan's DJ Booth". Lives ABOVE the board (in App) so all
 * METADATA — current track, queue, recently played, favourites, volume — persists
 * across opening/closing the booth. Owns the single AudioEngine, search, queue,
 * and Media Session wiring.
 *
 * Closing the booth PAUSES playback (see closeMusic) but keeps that metadata, so
 * reopening resumes exactly where you left off (paused, never auto-playing). The
 * overlay UI is a pure consumer of this context.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AudioEngine } from './musicAudio'
import { DISCOVERY_QUERY, provider } from './musicProvider'
import { resolveStream } from './streamResolver'
import type { PlayContext, PlayerStatus, Song } from './musicTypes'
import {
  loadFavorites,
  loadMuted,
  loadQueue,
  loadRecent,
  loadVolume,
  pushRecent,
  saveMuted,
  saveQueue,
  saveVolume,
  saveLast,
  toggleFavorite as storageToggleFavorite,
} from './musicStorage'

interface MusicContextValue {
  previewOnly: boolean
  /** Kind of the CURRENT track's stream — drives the FULL / PREVIEW badge. */
  currentKind: 'full' | 'preview' | null
  // playback
  status: PlayerStatus
  current: Song | null
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  playbackError: string | null
  // search + discovery
  query: string
  results: Song[]
  searching: boolean
  searchError: string | null
  picks: Song[]
  picksLoading: boolean
  // library
  queue: Song[]
  recent: Song[]
  favorites: Song[]
  // overlay
  open: boolean
  launcherRef: React.MutableRefObject<HTMLElement | null>
  engine: AudioEngine
  // actions
  openMusic: (launcher: HTMLElement | null) => void
  closeMusic: () => void
  runSearch: (q: string) => void
  setQuery: (q: string) => void
  playSong: (song: Song, list?: Song[], index?: number) => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  seekTo: (t: number) => void
  seekBy: (d: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  enqueue: (song: Song) => void
  playNext: (song: Song) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  toggleFavorite: (song: Song) => void
  isFavorite: (id: string) => boolean
}

/**
 * One audio engine for the whole app lifetime. A module singleton (rather than a
 * per-mount instance) means it survives React StrictMode's dev double-mount — a
 * per-mount engine would be torn down by the first cleanup, killing playback.
 * HMR disposal is handled below so dev reloads don't leak an element.
 */
let sharedEngine: AudioEngine | null = null
function getSharedEngine(): AudioEngine {
  if (!sharedEngine) sharedEngine = new AudioEngine(provider.corsAudio)
  return sharedEngine
}
const hot = (import.meta as unknown as { hot?: { dispose: (cb: () => void) => void } }).hot
if (hot) hot.dispose(() => {
  sharedEngine?.dispose()
  sharedEngine = null
})

const MusicContext = createContext<MusicContextValue | null>(null)

export function useMusic() {
  const ctx = useContext(MusicContext)
  if (!ctx) throw new Error('useMusic must be used within <MusicProvider>')
  return ctx
}

/**
 * Lightweight slice for the board (DJ sticker + overlay mount). It changes only
 * on play/pause and open/close — NEVER on the 4×/s playhead — so consuming it
 * from board components never re-renders the board during playback.
 */
interface MusicDeckValue {
  playing: boolean
  open: boolean
  openMusic: (launcher: HTMLElement | null) => void
}
const MusicDeckContext = createContext<MusicDeckValue | null>(null)
export function useMusicDeck() {
  const ctx = useContext(MusicDeckContext)
  if (!ctx) throw new Error('useMusicDeck must be used within <MusicProvider>')
  return ctx
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const engine = getSharedEngine()

  const [status, setStatus] = useState<PlayerStatus>('idle')
  const [current, setCurrent] = useState<Song | null>(null)
  const [currentKind, setCurrentKind] = useState<'full' | 'preview' | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(loadVolume)
  const [muted, setMuted] = useState(loadMuted)
  const [playbackError, setPlaybackError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Song[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [picks, setPicks] = useState<Song[]>([])
  const [picksLoading, setPicksLoading] = useState(false)

  const [queue, setQueue] = useState<Song[]>(loadQueue)
  const [recent, setRecent] = useState<Song[]>(loadRecent)
  const [favorites, setFavorites] = useState<Song[]>(loadFavorites)

  const [open, setOpen] = useState(false)
  const launcherRef = useRef<HTMLElement | null>(null)

  const playlistRef = useRef<PlayContext>({ list: [], index: -1 })
  const searchAbort = useRef<AbortController | null>(null)
  const playToken = useRef(0)
  const nextRef = useRef<() => void>(() => {})
  // Latest current track + stream kind for the (once-bound) engine error handler.
  const currentRef = useRef<Song | null>(null)
  currentRef.current = current
  const currentKindRef = useRef<'full' | 'preview' | null>(null)
  currentKindRef.current = currentKind

  // ---- init engine settings + events (once) ----
  useEffect(() => {
    engine.setVolume(volume)
    engine.setMuted(muted)
    engine.setEvents({
      onStatus: (s) => {
        setStatus(s)
        if (s === 'playing') setPlaybackError(null)
      },
      onTime: (c, d) => {
        setCurrentTime(c)
        if (d) setDuration(d)
      },
      onEnded: () => nextRef.current(),
      onError: () => {
        // If a FULL stream failed (e.g. an expired/blocked URL), silently fall back
        // to the iTunes preview so the track keeps playing rather than dying.
        const song = currentRef.current
        if (currentKindRef.current === 'full' && song?.streamUrl) {
          setCurrentKind('preview')
          engine.load(song.streamUrl, true)
          return
        }
        setPlaybackError("Couldn't play this track. Try another result.")
      },
    })
    // No dispose on unmount: the engine is an app-lifetime singleton (see above),
    // which keeps one audio element and stays alive across StrictMode remounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- media session ----
  const setMediaMetadata = useCallback((song: Song) => {
    if (!('mediaSession' in navigator)) return
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artists.join(', '),
        album: song.album ?? '',
        artwork: song.artwork ? [{ src: song.artwork, sizes: '300x300', type: 'image/jpeg' }] : [],
      })
    } catch {
      /* ignore */
    }
  }, [])

  // ---- core playback ----
  const playSong = useCallback(
    (song: Song, list?: Song[], index?: number) => {
      setPlaybackError(null)
      setCurrent(song)
      saveLast(song)
      setRecent(pushRecent(song))
      playlistRef.current = list
        ? { list, index: index ?? list.findIndex((s) => s.id === song.id) }
        : { list: [song], index: 0 }
      setStatus('loading')
      setCurrentTime(0)
      setCurrentKind(null)
      setMediaMetadata(song)
      const token = ++playToken.current
      // Prefer a full stream when configured; always fall back to iTunes preview.
      void resolveStream(song).then((res) => {
        if (token !== playToken.current) return // superseded by a newer play
        if (!res) {
          setPlaybackError("Couldn't play this track. Try another result.")
          setStatus('error')
          return
        }
        setCurrentKind(res.kind)
        engine.load(res.url, true)
      })
    },
    [engine, setMediaMetadata],
  )

  const next = useCallback(() => {
    if (queue.length > 0) {
      const [head, ...rest] = queue
      setQueue(rest)
      saveQueue(rest)
      playSong(head, [head], 0)
      return
    }
    const { list, index } = playlistRef.current
    if (list.length && index >= 0) {
      // Loop back to the first record at the end — the wall is "on repeat".
      const n = (index + 1) % list.length
      playSong(list[n], list, n)
    } else {
      engine.pause()
      setStatus('paused')
    }
  }, [queue, playSong, engine])

  const prev = useCallback(() => {
    if (engine.el.currentTime > 3) {
      engine.seek(0)
      return
    }
    const { list, index } = playlistRef.current
    if (list.length && index > 0) playSong(list[index - 1], list, index - 1)
    else engine.seek(0)
  }, [playSong, engine])

  useEffect(() => {
    nextRef.current = next
  }, [next])

  const togglePlay = useCallback(() => {
    if (!current) return
    engine.toggle()
  }, [current, engine])
  const seekTo = useCallback((t: number) => engine.seek(t), [engine])
  const seekBy = useCallback((d: number) => engine.seekBy(d), [engine])

  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(v)
      engine.setVolume(v)
      saveVolume(v)
      if (v > 0 && muted) {
        setMuted(false)
        engine.setMuted(false)
        saveMuted(false)
      }
    },
    [engine, muted],
  )
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const nextMuted = !m
      engine.setMuted(nextMuted)
      saveMuted(nextMuted)
      return nextMuted
    })
  }, [engine])

  // ---- media session actions (once status/handlers are available) ----
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    const set = (a: MediaSessionAction, h: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(a, h)
      } catch {
        /* unsupported action — ignore */
      }
    }
    set('play', () => engine.play())
    set('pause', () => engine.pause())
    set('nexttrack', () => nextRef.current())
    set('previoustrack', () => prev())
    set('seekbackward', () => engine.seekBy(-5))
    set('seekforward', () => engine.seekBy(5))
    return () => {
      for (const a of ['play', 'pause', 'nexttrack', 'previoustrack', 'seekbackward', 'seekforward'] as const)
        set(a, null)
    }
  }, [engine, prev])

  // ---- search ----
  const runSearch = useCallback((q: string) => {
    setQuery(q)
    searchAbort.current?.abort()
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      setSearching(false)
      setSearchError(null)
      return
    }
    const ctrl = new AbortController()
    searchAbort.current = ctrl
    setSearching(true)
    setSearchError(null)
    provider
      .search(trimmed, ctrl.signal)
      .then((r) => {
        if (ctrl.signal.aborted) return
        setResults(r)
        setSearching(false)
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setSearching(false)
        setSearchError("Couldn't reach the music service. Check your connection and try again.")
      })
  }, [])

  const loadPicks = useCallback(() => {
    if (picks.length || picksLoading) return
    setPicksLoading(true)
    provider
      .search(DISCOVERY_QUERY)
      .then((r) => setPicks(r))
      .catch(() => setPicks([]))
      .finally(() => setPicksLoading(false))
  }, [picks.length, picksLoading])

  // ---- library ----
  const enqueue = useCallback((song: Song) => {
    setQueue((q) => {
      if (q.some((s) => s.id === song.id)) return q
      const n = [...q, song]
      saveQueue(n)
      return n
    })
  }, [])
  const playNext = useCallback((song: Song) => {
    setQueue((q) => {
      const n = [song, ...q.filter((s) => s.id !== song.id)]
      saveQueue(n)
      return n
    })
  }, [])
  const removeFromQueue = useCallback((index: number) => {
    setQueue((q) => {
      const n = q.filter((_, i) => i !== index)
      saveQueue(n)
      return n
    })
  }, [])
  const clearQueue = useCallback(() => {
    setQueue([])
    saveQueue([])
  }, [])

  const toggleFavorite = useCallback((song: Song) => setFavorites(storageToggleFavorite(song)), [])
  const favIds = useMemo(() => new Set(favorites.map((s) => s.id)), [favorites])
  const isFavorite = useCallback((id: string) => favIds.has(id), [favIds])

  // ---- overlay ----
  const openMusic = useCallback(
    (launcher: HTMLElement | null) => {
      launcherRef.current = launcher
      setOpen(true)
      loadPicks()
    },
    [loadPicks],
  )
  const closeMusic = useCallback(() => {
    // Closing the booth STOPS playback (the DJ goes idle), but keeps all metadata
    // — current track, queue, recent, favourites, volume — so reopening resumes
    // exactly where you left off (paused, never auto-playing).
    engine.pause()
    setOpen(false)
  }, [engine])

  const value = useMemo<MusicContextValue>(
    () => ({
      previewOnly: provider.previewOnly,
      currentKind,
      status,
      current,
      currentTime,
      duration,
      volume,
      muted,
      playbackError,
      query,
      results,
      searching,
      searchError,
      picks,
      picksLoading,
      queue,
      recent,
      favorites,
      open,
      launcherRef,
      engine,
      openMusic,
      closeMusic,
      runSearch,
      setQuery,
      playSong,
      togglePlay,
      next,
      prev,
      seekTo,
      seekBy,
      setVolume,
      toggleMute,
      enqueue,
      playNext,
      removeFromQueue,
      clearQueue,
      toggleFavorite,
      isFavorite,
    }),
    [
      status, current, currentKind, currentTime, duration, volume, muted, playbackError,
      query, results, searching, searchError, picks, picksLoading,
      queue, recent, favorites, open, engine,
      openMusic, closeMusic, runSearch, playSong, togglePlay, next, prev,
      seekTo, seekBy, setVolume, toggleMute, enqueue, playNext,
      removeFromQueue, clearQueue, toggleFavorite, isFavorite,
    ],
  )

  // Dev-only snapshot for automated tests (tree-shaken from production builds).
  useEffect(() => {
    const dev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV
    if (!dev) return
    ;(window as unknown as { __deneshMusic?: unknown }).__deneshMusic = {
      status,
      open,
      title: current?.title ?? null,
      kind: currentKind,
      currentTime: Number(currentTime.toFixed(2)),
      duration: Number(duration.toFixed(2)),
      results: results.length,
      queue: queue.length,
      engine: engine.debug(),
    }
  })

  const deckValue = useMemo<MusicDeckValue>(
    () => ({ playing: status === 'playing', open, openMusic }),
    [status, open, openMusic],
  )

  return (
    <MusicDeckContext.Provider value={deckValue}>
      <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
    </MusicDeckContext.Provider>
  )
}
