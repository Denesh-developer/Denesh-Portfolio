import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMusic } from '../MusicContext'
import { OWNER, REPEAT_SONGS, REPEAT_TRACKS, toSeconds, type RepeatTrack } from './onRepeatTracks'
import { Vinyl } from './Vinyl'
import { Tonearm } from './Tonearm'
import { RecordCard } from './RecordCard'

const fmt = (s: number) => {
  const t = Math.max(0, Math.floor(s))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

/** HH:MM in the owner's time zone (falls back to the visitor's if the zone is invalid). */
function useClock(timeZone: string) {
  const [time, setTime] = useState('')
  useEffect(() => {
    let f: Intl.DateTimeFormat
    try {
      f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone })
    } catch {
      f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    const tick = () => setTime(f.format(new Date()))
    tick()
    const id = window.setInterval(tick, 15_000)
    return () => window.clearInterval(id)
  }, [timeZone])
  return time
}

const iconBtn =
  'flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#444] transition-colors hover:bg-black/[0.06] hover:text-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]'

/**
 * "On repeat." — the music player as a full-page wall of records (replaces the
 * boxed DJ booth UI; playback state still lives in MusicContext, so the DJ
 * sticker keeps dancing while a record spins). Fixed layer above the board.
 *
 * The turntable shows the current record (or the first sleeve when nothing has
 * been played yet). Tap a sleeve to put it on; tap the disc, press Space, or use
 * the transport to play/pause; ← → skip. Closing pauses (see MusicContext).
 */
export default function OnRepeatOverlay() {
  const {
    status,
    current,
    currentTime,
    duration,
    playbackError,
    playSong,
    togglePlay,
    next,
    prev,
    seekTo,
    closeMusic,
    launcherRef,
  } = useMusic()

  const [visible, setVisible] = useState(true) // drives the enter/exit animation
  const [listOpen, setListOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const time = useClock(OWNER.timeZone)

  const isOurs = !!current && REPEAT_TRACKS.some((t) => t.id === current.id)
  const onDeck = REPEAT_TRACKS.find((t) => t.id === current?.id) ?? REPEAT_TRACKS[0]
  const spinning = isOurs && status === 'playing'
  const armDown = isOurs && (status === 'playing' || status === 'loading')
  const progress = isOurs && duration > 0 ? currentTime / duration : 0

  // Favourite stretches of the record on the deck, resolved to seconds and
  // clamped to the (now known) duration. A point highlight gets a 1.5% width.
  const marks =
    isOurs && duration > 0
      ? (onDeck.highlights ?? [])
          .map((h) => {
            const from = Math.min(Math.max(0, toSeconds(h.from)), duration)
            const to = h.to != null ? Math.min(Math.max(from, toSeconds(h.to)), duration) : null
            return { from, to, note: h.note }
          })
          .filter((h) => h.to === null || h.to > h.from)
      : []
  const inside = marks.find((m) => currentTime >= m.from && currentTime <= (m.to ?? m.from + 2))

  const pick = useCallback(
    (t: RepeatTrack) => {
      if (current?.id === t.id) {
        togglePlay()
        return
      }
      const idx = REPEAT_TRACKS.findIndex((x) => x.id === t.id)
      playSong(REPEAT_SONGS[idx], REPEAT_SONGS, idx)
    },
    [current, playSong, togglePlay],
  )
  const toggle = useCallback(() => (isOurs ? togglePlay() : pick(onDeck)), [isOurs, togglePlay, pick, onDeck])
  const skipNext = useCallback(() => (isOurs ? next() : pick(REPEAT_TRACKS[1 % REPEAT_TRACKS.length])), [isOurs, next, pick])
  const skipPrev = useCallback(() => (isOurs ? prev() : pick(REPEAT_TRACKS[REPEAT_TRACKS.length - 1])), [isOurs, prev, pick])

  const close = useCallback(() => setVisible(false), [])

  // ---- focus: into the dialog on open; back to the DJ sticker on unmount ----
  useEffect(() => {
    const t = window.setTimeout(() => dialogRef.current?.focus(), 60)
    return () => window.clearTimeout(t)
  }, [])
  useEffect(() => () => launcherRef.current?.focus?.(), [launcherRef])

  // ---- keys: Space play/pause · ← → skip · Esc close (capture, so the board's
  // space-to-pan never sees it). Space is left alone when a button has focus so
  // it doesn't fire twice. ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (listOpen) setListOpen(false)
        else close()
        return
      }
      if (e.code === 'Space') {
        e.stopImmediatePropagation()
        if (document.activeElement?.tagName === 'BUTTON') return
        e.preventDefault()
        toggle()
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        skipNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        skipPrev()
      } else if (e.key === 'Tab') {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])')
        if (!nodes || nodes.length === 0) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [close, toggle, skipNext, skipPrev, listOpen])

  // Close the tracklist on an outside press.
  useEffect(() => {
    if (!listOpen) return
    const onDown = (e: PointerEvent) => {
      if (!pillRef.current?.contains(e.target as Node)) setListOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [listOpen])

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isOurs || duration <= 0) return
    const r = e.currentTarget.getBoundingClientRect()
    seekTo(((e.clientX - r.left) / r.width) * duration)
  }

  const pillLine2 = isOurs
    ? `${status === 'playing' ? 'now playing' : status === 'loading' ? 'cueing' : 'paused'} · ${onDeck.title}`
    : `on the wall · ${REPEAT_TRACKS.length} records`

  return (
    <AnimatePresence onExitComplete={closeMusic}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[3000] overflow-y-auto overflow-x-hidden bg-[#f9f8f4]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="On repeat — the records I keep spinning"
            tabIndex={-1}
            className="relative min-h-full outline-none md:h-full md:overflow-hidden"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* ---- heading ---- */}
            <h2 className="absolute left-[5%] top-[92px] z-[10] font-instrument text-[clamp(44px,5vw,74px)] font-normal leading-none tracking-[-0.02em] text-[#111] md:top-[16px]">
              On <em className="italic">repeat.</em>
            </h2>

            {/* ---- owner pill + tracklist ---- */}
            <div ref={pillRef} className="fixed left-[16px] top-[14px] z-[20] w-[calc(100vw-92px)] md:left-1/2 md:w-[min(400px,calc(100vw-96px))] md:-translate-x-1/2">
              <button
                type="button"
                onClick={() => setListOpen((o) => !o)}
                aria-expanded={listOpen}
                aria-controls="or-tracklist"
                className="flex w-full items-center gap-[12px] rounded-full bg-[#1c1c1c] py-[8px] pl-[8px] pr-[16px] text-left shadow-[0_12px_32px_rgba(0,0,0,0.28)] outline-none transition-colors hover:bg-[#262626] focus-visible:[box-shadow:0_0_0_3px_#7aa88d]"
              >
                <img src={OWNER.avatar} alt="" className="h-[40px] w-[40px] shrink-0 rounded-full object-cover" draggable={false} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-[8px] overflow-hidden whitespace-nowrap">
                    <span className="font-satoshi text-[15px] font-bold leading-none text-white">{OWNER.name}</span>
                    <span className="truncate font-mono text-[10.5px] uppercase tracking-[1.8px] text-[#9d9d9d]">
                      · {OWNER.place} · {time} {OWNER.tzLabel}
                    </span>
                  </span>
                  <span className="mt-[5px] block truncate font-mono text-[10.5px] uppercase tracking-[1.8px] text-[#9d9d9d]" aria-live="polite">
                    {pillLine2}
                  </span>
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  aria-hidden
                  className={`shrink-0 text-[#cfcfcf] transition-transform duration-300 ${listOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <AnimatePresence>
                {listOpen && (
                  <motion.ul
                    id="or-tracklist"
                    className="absolute left-0 right-0 top-full mt-[8px] list-none rounded-[18px] bg-[#1c1c1c] p-[6px] shadow-[0_18px_44px_rgba(0,0,0,0.32)]"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    {REPEAT_TRACKS.map((t) => {
                      const isCur = t.id === current?.id
                      return (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => {
                              pick(t)
                              setListOpen(false)
                            }}
                            aria-current={isCur || undefined}
                            className={`flex w-full items-center gap-[12px] rounded-[12px] px-[8px] py-[7px] text-left outline-none transition-colors hover:bg-white/[0.08] focus-visible:bg-white/[0.08] ${
                              isCur ? 'bg-white/[0.1]' : ''
                            }`}
                          >
                            <img src={t.artwork} alt="" className="h-[36px] w-[36px] shrink-0 rounded-[6px] object-cover" draggable={false} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-satoshi text-[13px] font-medium leading-tight text-white">{t.title}</span>
                              <span className="block truncate font-mono text-[10px] uppercase tracking-[1.4px] text-[#9d9d9d]">{t.artists.join(', ')}</span>
                            </span>
                            {isCur && spinning ? (
                              <span className="flex h-[12px] items-end gap-[2px]" aria-label="Playing">
                                {[0, 1, 2].map((i) => (
                                  <span
                                    key={i}
                                    className="block w-[2.5px] origin-bottom rounded-[1px] bg-[#7aa88d] animate-[dj-eq_0.9s_ease-in-out_infinite] motion-reduce:[animation:none]"
                                    style={{ height: 12, animationDelay: `${i * 0.15}s` }}
                                  />
                                ))}
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-[#6f6f6f]">{isCur ? 'paused' : 'play'}</span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* ---- close ---- */}
            <button
              type="button"
              onClick={close}
              aria-label="Close the player and return to the board"
              className="fixed right-[20px] top-[18px] z-[20] flex h-[40px] w-[40px] items-center justify-center rounded-full border border-black/10 bg-white/80 text-[#2b2a28] shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* ---- turntable + caption + transport ---- */}
            <div className="relative z-[2] mx-auto flex w-fit flex-col items-center pt-[190px] md:absolute md:left-1/2 md:top-[57%] md:-translate-x-1/2 md:-translate-y-1/2 md:pt-0">
              <div
                className="relative [--d:min(66vw,320px)] md:[--d:clamp(240px,min(27vw,50vh),440px)]"
                style={{ width: 'var(--d)', height: 'var(--d)' }}
              >
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={spinning ? `Pause ${onDeck.title}` : `Play ${onDeck.title}`}
                  className="absolute inset-0 cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none focus-visible:[box-shadow:0_0_0_4px_#f9f8f4,0_0_0_7px_#7aa88d]"
                >
                  <Vinyl artwork={onDeck.artwork} spinning={spinning} className="relative h-full w-full" />
                </button>
                <Tonearm playing={armDown} progress={progress} />
              </div>

              <p className="mt-[34px] max-w-[min(90vw,560px)] text-center font-mono text-[12px] uppercase tracking-[3px] text-[#555]" aria-live="polite">
                {onDeck.title} <span className="text-[#b5b5b5]">·</span> {onDeck.artists.join(' & ')}
              </p>

              <div className="mt-[14px] flex items-center gap-[6px] font-mono text-[11px] text-[#777]">
                <button type="button" onClick={skipPrev} aria-label="Previous record" className={iconBtn}>
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                    <path d="M3 2v10M11 2L5 7l6 5V2z" fill="currentColor" />
                  </svg>
                </button>
                <button type="button" onClick={toggle} aria-label={spinning ? 'Pause' : 'Play'} className={iconBtn}>
                  {spinning ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                      <path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                      <path d="M4 2l8 5-8 5V2z" fill="currentColor" />
                    </svg>
                  )}
                </button>
                <button type="button" onClick={skipNext} aria-label="Next record" className={iconBtn}>
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                    <path d="M11 2v10M3 2l6 5-6 5V2z" fill="currentColor" />
                  </svg>
                </button>
                <span className="ml-[8px] w-[36px] text-right tabular-nums">{fmt(isOurs ? currentTime : 0)}</span>
                <div
                  className="relative h-[18px] w-[140px] cursor-pointer sm:w-[220px]"
                  onClick={onSeek}
                  role="progressbar"
                  aria-label="Track position"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                >
                  <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-black/10" />
                  <div className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#111]" style={{ width: `${progress * 100}%` }} />
                  {/* ♥ favourite stretches — click to jump there, hover for the note */}
                  {marks.map((m, i) => {
                    const left = (m.from / duration) * 100
                    const width = m.to === null ? 1.5 : ((m.to - m.from) / duration) * 100
                    const active = inside === m
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          seekTo(m.from)
                        }}
                        aria-label={`Jump to favourite part at ${fmt(m.from)}${m.note ? `: ${m.note}` : ''}`}
                        className="group/mark absolute top-0 h-full min-w-[6px] cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:[box-shadow:0_0_0_2px_#7aa88d]"
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <span
                          className={`absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full transition-colors ${
                            active ? 'bg-[#5f9274]' : 'bg-[#7aa88d] group-hover/mark:bg-[#5f9274]'
                          }`}
                        />
                        <span
                          className={`absolute -top-[3px] left-1/2 -translate-x-1/2 text-[9px] leading-none text-[#7aa88d] transition-transform ${
                            active ? 'scale-125' : 'group-hover/mark:scale-125'
                          }`}
                          aria-hidden
                        >
                          ♥
                        </span>
                        {m.note && (
                          <span className="pointer-events-none absolute bottom-full left-1/2 mb-[8px] -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[#1c1c1c] px-[8px] py-[4px] font-mono text-[9.5px] uppercase tracking-[1.4px] text-white opacity-0 shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-opacity group-hover/mark:opacity-100 group-focus-visible/mark:opacity-100">
                            ♥ {m.note} · {fmt(m.from)}
                            {m.to !== null && `–${fmt(m.to)}`}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <span className="w-[36px] tabular-nums">{fmt(isOurs ? duration : 0)}</span>
              </div>

              {playbackError && isOurs ? (
                <p className="mt-[12px] font-mono text-[10.5px] uppercase tracking-[1.6px] text-[#b3261e]">
                  couldn&rsquo;t play this record · is the file in /public/music?
                </p>
              ) : inside ? (
                <p className="mt-[12px] font-mono text-[10.5px] uppercase tracking-[1.6px] text-[#5f9274]" aria-live="polite">
                  ♥ {inside.note ?? 'my favourite part'}
                </p>
              ) : (
                !isOurs && (
                  <p className="mt-[12px] font-mono text-[10.5px] uppercase tracking-[1.6px] text-[#a3a3a3]">tap the record to play</p>
                )
              )}
            </div>

            {/* ---- the wall of sleeves ---- */}
            <div className="relative z-[1] mt-[64px] grid grid-cols-2 gap-x-[12vw] gap-y-[60px] px-[9vw] pb-[72px] md:absolute md:inset-0 md:m-0 md:block md:p-0">
              {REPEAT_TRACKS.map((t) => (
                <RecordCard key={t.id} track={t} current={isOurs && t.id === current?.id} playing={spinning} onPick={pick} />
              ))}
            </div>

            <p className="sr-only">
              Music player with four records. Pick a sleeve to play it, or use the play, previous and next
              buttons. Part of a Full-Stack Developer portfolio.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
