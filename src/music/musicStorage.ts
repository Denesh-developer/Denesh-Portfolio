/**
 * Namespaced localStorage for the music player — METADATA ONLY (no audio files;
 * only track metadata + a preview URL string). Every read is corruption-safe:
 * a bad/absent value falls back to a default instead of throwing.
 */
import type { Song } from './musicTypes'

const NS = 'denesh.music.'
const KEY = {
  recent: NS + 'recent',
  favorites: NS + 'favorites',
  queue: NS + 'queue',
  volume: NS + 'volume',
  muted: NS + 'muted',
  last: NS + 'last',
} as const

const RECENT_MAX = 20

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode — ignore */
  }
}

/** Keep only the fields we persist (strip anything unexpected). */
function slim(s: Song): Song {
  return {
    id: s.id,
    title: s.title,
    artists: s.artists ?? [],
    album: s.album,
    artwork: s.artwork,
    duration: s.duration,
    language: s.language,
    year: s.year,
    streamUrl: s.streamUrl,
    source: s.source,
    sourceUrl: s.sourceUrl,
  }
}
function asSongs(v: unknown): Song[] {
  return Array.isArray(v) ? v.filter((s) => s && typeof s.id === 'string') : []
}

// ---- recent ---------------------------------------------------------------
export const loadRecent = (): Song[] => asSongs(read(KEY.recent, []))
export function pushRecent(song: Song): Song[] {
  const next = [slim(song), ...loadRecent().filter((s) => s.id !== song.id)].slice(0, RECENT_MAX)
  write(KEY.recent, next)
  return next
}

// ---- favorites ------------------------------------------------------------
export const loadFavorites = (): Song[] => asSongs(read(KEY.favorites, []))
export function toggleFavorite(song: Song): Song[] {
  const cur = loadFavorites()
  const exists = cur.some((s) => s.id === song.id)
  const next = exists ? cur.filter((s) => s.id !== song.id) : [slim(song), ...cur]
  write(KEY.favorites, next)
  return next
}

// ---- queue ----------------------------------------------------------------
export const loadQueue = (): Song[] => asSongs(read(KEY.queue, []))
export const saveQueue = (q: Song[]) => write(KEY.queue, q.map(slim))

// ---- volume / muted -------------------------------------------------------
export function loadVolume(): number {
  const v = read<number>(KEY.volume, 0.85)
  return typeof v === 'number' && v >= 0 && v <= 1 ? v : 0.85
}
export const saveVolume = (v: number) => write(KEY.volume, v)
export const loadMuted = (): boolean => read<boolean>(KEY.muted, false) === true
export const saveMuted = (m: boolean) => write(KEY.muted, m)

// ---- last track (for restoring the now-playing card, not autoplay) --------
export const loadLast = (): Song | null => {
  const v = read<Song | null>(KEY.last, null)
  return v && typeof v.id === 'string' ? v : null
}
export const saveLast = (s: Song | null) => write(KEY.last, s ? slim(s) : null)
