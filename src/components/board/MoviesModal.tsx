import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { movies, OTT_BADGES, type Movie } from '../../data/movies'

type Props = {
  open: boolean
  onClose: () => void
  triggerRef?: React.MutableRefObject<HTMLElement | null>
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const badgeOf = (m: Movie) => OTT_BADGES[m.ott] ?? { label: m.ott, bg: '#333', fg: '#fff' }

/** Crossfades its child whenever `id` changes (title / copy swaps). */
function Swap({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={id}
        className={className}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * The streaming-service tag: the real logo on a small white label (falls back to
 * a coloured text chip for services without a logo). Sized to sit on a frame edge.
 */
function OttTag({ m, className = '' }: { m: Movie; className?: string }) {
  const badge = badgeOf(m)
  return badge.logo ? (
    <span
      className={`inline-flex items-center rounded-full border border-black/[0.07] bg-white px-[18px] py-[7px] shadow-[0_6px_16px_-4px_rgba(0,0,0,0.28),0_1px_3px_rgba(0,0,0,0.1)] ${className}`}
      role="img"
      aria-label={`On ${badge.label}`}
    >
      <img src={badge.logo} alt="" draggable={false} className="h-[18px] w-auto max-w-[94px] object-contain [-webkit-user-drag:none]" />
    </span>
  ) : (
    <span
      className={`inline-flex items-center rounded-full px-[11px] py-[7px] font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[1.2px] shadow-[0_6px_16px_-4px_rgba(0,0,0,0.28)] ${className}`}
      style={{ background: badge.bg, color: badge.fg }}
    >
      {badge.label}
    </span>
  )
}

/**
 * A poster (2:3) with a graceful fallback when the image is missing: a dark
 * card with the title set in the serif (just its initial when `mini`, for the
 * shelf).
 */
function Poster({ m, mini = false, className = '' }: { m: Movie; mini?: boolean; className?: string }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-[6px] bg-[#17131c] ${className}`}>
      {!broken && m.poster ? (
        <img
          src={m.poster}
          alt=""
          draggable={false}
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover [-webkit-user-drag:none]"
        />
      ) : (
        <div
          className={`absolute inset-0 flex bg-[linear-gradient(160deg,#2b2233,#17131c_58%,#0d0912)] ${
            mini ? 'items-center justify-center' : 'items-end p-[8%]'
          }`}
        >
          <span className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_60%_at_50%_0%,rgba(255,255,255,0.10),transparent_60%)]" />
          {mini ? (
            <span className="font-instrument text-[26px] italic leading-none text-white/85">{m.title.charAt(0)}</span>
          ) : (
            <span className="font-instrument text-[clamp(22px,2.4vw,38px)] italic leading-[1.05] text-white/90">{m.title}</span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * "From my watchlist." — a full-page spotlight on the crime & thriller titles I
 * keep recommending (same cream, serif + mono language as the tic-tac-toe and
 * "On repeat." pages). One title is featured at a time — poster on the left, the
 * personal "why" on the right — and a shelf of every poster along the bottom
 * switches between them (click, or ← →). Content is JSON-driven (data/movies.json).
 */
export function MoviesModal({ open, onClose, triggerRef }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  const count = movies.length
  const m = movies[Math.min(index, Math.max(0, count - 1))]
  const badge = m ? badgeOf(m) : null

  const go = useCallback((d: number) => setIndex((i) => (count ? (i + d + count) % count : 0)), [count])

  // Focus into the page on open; back to the sticker on close.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => dialogRef.current?.focus(), 60)
      return () => window.clearTimeout(t)
    }
    triggerRef?.current?.focus?.()
  }, [open, triggerRef])

  // Esc closes · ← → switch titles · Tab is trapped inside.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Tab') {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        )
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
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, go])

  const arrowBtn =
    'flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#d6d6d6] text-[#555] transition-colors hover:border-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]'

  return (
    <AnimatePresence>
      {open && m && badge && (
        <motion.div
          className="fixed inset-0 z-[3000] overflow-y-auto bg-[#f9f8f4]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="From my watchlist — crime and thriller recommendations"
            tabIndex={-1}
            className="relative flex min-h-full flex-col px-[5%] pb-[40px] pt-[28px] outline-none md:h-full md:overflow-hidden md:pb-[150px] md:pt-[128px]"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* ---- heading ---- */}
            <div className="z-[10] pr-[56px] md:absolute md:left-[5%] md:top-[16px] md:pr-0">
              <h2 className="font-instrument text-[clamp(40px,5vw,72px)] font-normal leading-none tracking-[-0.02em] text-[#111]">
                From <em className="italic">my watchlist.</em>
              </h2>
              <p className="mt-[10px] max-w-[520px] font-satoshi text-[15px] leading-[1.5] text-[#5c5c5c] md:text-[16px]">
                Crime &amp; thrillers I keep recommending &mdash; pick one for tonight.
              </p>
            </div>

            {/* ---- close ---- */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close the watchlist and return to the board"
              className="fixed right-[20px] top-[18px] z-[20] flex h-[40px] w-[40px] items-center justify-center rounded-full border border-black/10 bg-white/80 text-[#2b2a28] shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* ---- spotlight: poster + the why ---- */}
            <div className="flex flex-1 items-center justify-center pt-[44px] md:pt-0">
              <div className="flex w-full max-w-[980px] flex-col items-center gap-[36px] md:flex-row md:items-center md:justify-center md:gap-[72px]">
                {/* featured poster in a paper frame */}
                <div className="relative w-[min(300px,60vw)] shrink-0 md:w-[min(300px,36vh)]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={m.id}
                      className="relative rotate-[-2deg] bg-[#f4f0e7] p-[10px] shadow-[0_24px_48px_-14px_rgba(0,0,0,0.38),0_2px_6px_rgba(0,0,0,0.12)]"
                      initial={reducedMotion ? false : { opacity: 0, y: 18, rotate: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, rotate: -2, scale: 1 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, rotate: 1, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <Poster m={m} />
                      <OttTag m={m} className="absolute left-[-20px] top-0 -translate-y-1/2" />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* copy */}
                <div className="w-full max-w-[460px] text-center md:text-left">
                  <p className="font-mono text-[11.5px] uppercase tracking-[2.6px] text-[#444]" aria-live="polite">
                    <span className="tabular-nums">
                      {pad2(index + 1)} / {pad2(count)}
                    </span>
                    <span className="mx-[8px] text-[#c4c4c4]">·</span>
                    {badge.label}
                    <span className="mx-[8px] text-[#c4c4c4]">·</span>
                    {m.year}
                  </p>

                  <Swap id={`${m.id}-title`} className="mt-[14px]">
                    <h3 className="font-instrument text-[clamp(38px,4.2vw,60px)] font-normal leading-[1.02] tracking-[-0.02em] text-[#111]">
                      {m.title}
                    </h3>
                    <p className="mt-[10px] font-mono text-[10.5px] uppercase tracking-[2.2px] text-[#8a8a8a]">{m.tag}</p>
                  </Swap>

                  <Swap id={`${m.id}-why`} className="mt-[22px]">
                    <p className="font-satoshi text-[16px] leading-[1.65] text-[#3a3a3a] md:text-[17px]">
                      <em className="font-instrument text-[21px] italic text-[#111]">Why I keep recommending it &mdash; </em>
                      {m.why}
                    </p>
                  </Swap>

                  <div className="mt-[28px] flex items-center justify-center gap-[12px] md:justify-start">
                    {m.url ? (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-[8px] rounded-full border border-[#cdcdcd] px-[22px] py-[11px] font-satoshi text-[15px] font-medium text-[#444] transition-colors hover:border-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]"
                      >
                        Watch on{' '}
                        {badge.logo ? (
                          <img src={badge.logo} alt={badge.label} draggable={false} className="h-[15px] w-auto object-contain [-webkit-user-drag:none]" />
                        ) : (
                          badge.label
                        )}{' '}
                        <span aria-hidden>&#8599;</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-[10px] rounded-full border border-[#e2e2e2] px-[18px] py-[9px] font-mono text-[10.5px] uppercase tracking-[1.8px] text-[#666]">
                        streaming on
                        {badge.logo ? (
                          <img src={badge.logo} alt={badge.label} draggable={false} className="h-[12px] w-auto max-w-[80px] object-contain [-webkit-user-drag:none]" />
                        ) : (
                          <span className="text-[#333]">{badge.label}</span>
                        )}
                      </span>
                    )}
                    <div className="ml-[6px] flex items-center gap-[8px]">
                      <button type="button" onClick={() => go(-1)} aria-label="Previous title" className={arrowBtn}>
                        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => go(1)} aria-label="Next title" className={arrowBtn}>
                        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                          <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- the shelf: every title, click to feature ---- */}
            <div className="mt-[44px] md:absolute md:inset-x-0 md:bottom-[26px] md:mt-0">
              <div
                className="mx-auto flex w-fit max-w-full items-end gap-[14px] overflow-x-auto px-[16px] pb-[14px] pt-[12px] scrollbar-hidden md:gap-[18px]"
                role="tablist"
                aria-label="All titles"
              >
                {movies.map((x, i) => {
                  const selected = i === index
                  return (
                    <button
                      key={x.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-label={`${x.title} (${x.year})`}
                      onClick={() => setIndex(i)}
                      className={`group relative shrink-0 rounded-[6px] outline-none transition-[transform,opacity] duration-300 ease-out focus-visible:[box-shadow:0_0_0_3px_#7aa88d] ${
                        selected ? '-translate-y-[8px] opacity-100' : 'opacity-55 hover:-translate-y-[4px] hover:opacity-90'
                      }`}
                    >
                      <Poster
                        m={x}
                        mini
                        className={`w-[58px] shadow-[0_10px_22px_-8px_rgba(0,0,0,0.4)] md:w-[68px] ${selected ? 'ring-2 ring-[#111] ring-offset-2 ring-offset-[#f9f8f4]' : ''}`}
                      />
                      <span className="mt-[8px] block text-center font-mono text-[9.5px] tabular-nums tracking-[1.5px] text-[#8a8a8a]">
                        {pad2(i + 1)}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-[2px] hidden text-center font-mono text-[9.5px] uppercase tracking-[2px] text-[#b3b3b3] md:block">
                ← → to browse · esc to close
              </p>
            </div>

            <p className="sr-only">
              A curated list of crime and thriller films and series with a personal note on each and where
              to stream it. Part of a Full-Stack Developer portfolio.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MoviesModal
