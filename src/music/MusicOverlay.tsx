import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMusic } from './MusicContext'
import { MusicSearch } from './MusicSearch'
import { MusicLibrary } from './MusicLibrary'
import { MusicQueue } from './MusicQueue'
import { MusicPlayer } from './MusicPlayer'

type Tab = 'search' | 'picks' | 'recent' | 'favorites'
const TABS: { id: Tab; label: string }[] = [
  { id: 'search', label: 'Search' },
  { id: 'picks', label: 'Tamil Picks' },
  { id: 'recent', label: 'Recent' },
  { id: 'favorites', label: 'Favourites' },
]

/**
 * "Kesavan's DJ Booth" — a viewport-fixed overlay above the Figma board (never
 * inside the zoom/pan transform, so it stays normal size at any board zoom). The
 * board stays mounted, untouched, underneath. Closing only hides the booth; the
 * track keeps playing (state lives in MusicContext).
 */
export default function MusicOverlay() {
  const { closeMusic, launcherRef, togglePlay, seekBy, toggleMute, favorites, queue } = useMusic()

  const [visible, setVisible] = useState(true) // drives the enter/exit animation
  const [tab, setTab] = useState<Tab>('search')
  const [queueOpen, setQueueOpen] = useState(false) // mobile drawer
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  )
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  const dialogRef = useRef<HTMLDivElement>(null)

  const close = () => setVisible(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // body scroll lock
  useEffect(() => {
    const b = document.body
    const prev = b.style.overflow
    const prevO = b.style.overscrollBehavior
    b.style.overflow = 'hidden'
    b.style.overscrollBehavior = 'none'
    return () => {
      b.style.overflow = prev
      b.style.overscrollBehavior = prevO
    }
  }, [])

  // focus in on mount, restore to the DJ sticker on unmount
  useEffect(() => {
    const t = window.setTimeout(() => {
      const el = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? dialogRef.current
      el?.focus()
    }, 80)
    return () => window.clearTimeout(t)
  }, [])
  useEffect(() => () => launcherRef.current?.focus?.(), [launcherRef])

  // keyboard shortcuts (capture phase → beats the board's space-pan). Never
  // intercept while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (typing) (t as HTMLElement).blur()
        else if (queueOpen) setQueueOpen(false)
        else close()
        return
      }
      if (typing) return
      let consumed = true
      if (e.code === 'Space') togglePlay()
      else if (e.code === 'ArrowLeft') seekBy(-5)
      else if (e.code === 'ArrowRight') seekBy(5)
      else if (e.code === 'KeyM') toggleMute()
      else consumed = false
      if (consumed) {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [togglePlay, seekBy, toggleMute, queueOpen])

  // Tab focus trap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, a[href], input, [tabindex]:not([tabindex="-1"])',
      )
      if (!nodes || !nodes.length) return
      const list = Array.from(nodes).filter((n) => !n.hasAttribute('disabled'))
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const enter = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.97, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: 8 },
      }

  const leftPanel = (
    <section className="flex min-h-0 min-w-0 flex-col gap-[10px]">
      <div className="flex shrink-0 flex-wrap gap-[6px]">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            aria-pressed={tab === tb.id}
            className={`rounded-full px-[12px] py-[6px] font-satoshi text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#7aa88d] ${
              tab === tb.id ? 'bg-[#2b2a28] text-[#f6f1e7]' : 'bg-black/[0.05] text-[#5f594e] hover:bg-black/10'
            }`}
          >
            {tb.label}
            {tb.id === 'favorites' && favorites.length > 0 ? ` (${favorites.length})` : ''}
          </button>
        ))}
      </div>
      {tab === 'search' ? <MusicSearch /> : <MusicLibrary tab={tab} />}
    </section>
  )

  return (
    <AnimatePresence onExitComplete={closeMusic}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-[rgba(24,22,19,0.66)] p-[14px] [backdrop-filter:blur(4px)] sm:p-[20px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={close}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Denesh's DJ Booth — music player"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-[min(1040px,96vw)] flex-col overflow-hidden rounded-[18px] border border-black/10 bg-[#f6f1e7] shadow-[0_28px_80px_rgba(0,0,0,0.5)] outline-none"
            {...enter}
            transition={{ duration: reducedMotion ? 0.18 : 0.3, ease: 'easeOut' }}
          >
            {/* header */}
            <div className="flex shrink-0 items-center justify-between gap-[12px] border-b border-black/10 px-[18px] py-[14px]">
              <div className="min-w-0">
                <h2 className="font-aeonik text-[18px] font-bold uppercase leading-none tracking-[1px] text-[#2b2a28] sm:text-[21px]">
                  Denesh&rsquo;s DJ Booth
                </h2>
                <p className="mt-[5px] truncate font-satoshi text-[11px] text-[#8a8375]">
                  Tamil · Hindi · English & more — 30-second previews via Apple Music
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-[8px]">
                <button
                  type="button"
                  onClick={() => setQueueOpen(true)}
                  className="flex h-[34px] items-center gap-[6px] rounded-full border border-black/10 bg-white/80 px-[12px] font-satoshi text-[12px] font-semibold text-[#2b2a28] shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7aa88d] lg:hidden"
                >
                  Queue{queue.length ? ` (${queue.length})` : ''}
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close the DJ booth"
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-black/10 bg-white/80 text-[#2b2a28] shadow-[0_2px_6px_rgba(0,0,0,0.12)] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* body */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-[16px] sm:p-[18px]">
              {isDesktop ? (
                <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] grid-rows-1 gap-[18px]">
                  {leftPanel}
                  <aside className="flex min-h-0 min-w-0 flex-col gap-[14px] border-l border-black/10 pl-[18px]">
                    <div className="shrink-0">
                      <MusicPlayer reducedMotion={reducedMotion} />
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col border-t border-black/10 pt-[12px]">
                      <MusicQueue />
                    </div>
                  </aside>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-[12px]">
                  <div className="shrink-0">
                    <MusicPlayer reducedMotion={reducedMotion} />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col">{leftPanel}</div>
                </div>
              )}
            </div>
          </motion.div>

          {/* mobile queue drawer */}
          {queueOpen && !isDesktop && (
            <div className="fixed inset-0 z-[3100] lg:hidden" onClick={() => setQueueOpen(false)}>
              <div className="absolute inset-0 bg-black/45" />
              <motion.div
                initial={reducedMotion ? { opacity: 0 } : { y: '100%' }}
                animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-x-0 bottom-0 flex max-h-[72vh] flex-col rounded-t-[18px] border-t border-black/10 bg-[#f6f1e7] p-[16px] shadow-[0_-10px_40px_rgba(0,0,0,0.4)]"
              >
                <div className="mx-auto mb-[10px] h-[4px] w-[40px] shrink-0 rounded-full bg-black/15" />
                <MusicQueue />
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
