import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { AboutHeader } from './AboutHeader'
import { AboutProfile } from './AboutProfile'
import { AboutJourney } from './AboutJourney'
import { AboutInterests } from './AboutInterests'
import { AboutPrevious } from './AboutPrevious'

export type AboutModalProps = {
  open: boolean
  onClose: () => void
  triggerRef?: React.RefObject<HTMLButtonElement>
}

// Short, soft spring for the card; a light stagger reveals the blocks in turn.
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
const block: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 32 } },
}

/**
 * Accessible About dialog rendered in a portal on document.body, so it lives
 * outside the zoom/pan board and never scales or moves with it. While open, the
 * rest of the app (#root) is made `inert` so background pointer + screen-reader
 * interaction is blocked; focus is trapped and restored to the trigger on close.
 * The board transform is never touched, so its pan/zoom is preserved verbatim.
 */
export default function AboutModal({ open, onClose, triggerRef }: AboutModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Freeze the background + restore focus to the dock avatar on close.
  useEffect(() => {
    if (!open) return
    const root = document.getElementById('root')
    const restoreTo = triggerRef?.current ?? (document.activeElement as HTMLElement | null)
    root?.setAttribute('inert', '')
    root?.setAttribute('aria-hidden', 'true')
    const t = window.setTimeout(() => closeRef.current?.focus(), 60)
    return () => {
      window.clearTimeout(t)
      root?.removeAttribute('inert')
      root?.removeAttribute('aria-hidden')
      restoreTo?.focus?.()
    }
  }, [open, triggerRef])

  // Escape closes; Tab is trapped inside the dialog.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, a[href], [tabindex]:not([tabindex="-1"])',
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
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="about-overlay fixed inset-0 z-[3000] flex items-center justify-center p-[24px] bg-white/25 backdrop-blur-[5px] max-[640px]:items-end max-[640px]:p-0 max-[640px]:backdrop-blur-[3px]"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={dialogRef}
            className="relative w-[min(948px,94vw)] max-[640px]:w-full"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            aria-describedby="about-intro"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.9 }}
          >
            <button
              ref={closeRef}
              type="button"
              className="absolute top-[-66px] left-1/2 -translate-x-1/2 w-[55px] h-[55px] flex items-center justify-center border border-solid border-black bg-transparent rounded-full  text-[#2c2c2c] cursor-pointer shadow-[0_6px_18px_rgba(0,0,0,0.16)] transition duration-150 ease-[ease] hover:bg-[#f4f4f2] hover:scale-[1.06] focus-visible:[outline:2px_solid_#2c2c2c] focus-visible:[outline-offset:3px] motion-reduce:transition-none max-[640px]:top-[14px] max-[640px]:right-[16px] max-[640px]:left-auto max-[640px]:translate-x-0 max-[640px]:w-[44px] max-[640px]:h-[44px]"
              onClick={onClose}
              aria-label="Close About Me"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <motion.div
              className="relative max-h-[min(1158px,calc(100vh_-_160px))] overflow-y-auto overflow-x-hidden pt-[34px] px-[36px] pb-[44px] bg-brand border border-solid border-white rounded-[45px] shadow-[0_26px_64px_rgba(0,0,0,0.28),0_0_20px_3px_rgba(0,0,0,0.1)] [-webkit-overflow-scrolling:touch] scrollbar-hidden max-[900px]:pt-[30px] max-[900px]:px-[28px] max-[900px]:pb-[40px] max-[900px]:rounded-[36px] max-[640px]:max-h-[92vh] max-[640px]:pt-[58px] max-[640px]:px-[20px] max-[640px]:pb-[32px] max-[640px]:rounded-[26px_26px_0_0]"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={block}>
                <AboutHeader />
              </motion.div>
              <motion.div variants={block}>
                <AboutProfile />
              </motion.div>
              <motion.div variants={block}>
                <AboutJourney />
              </motion.div>
              <motion.div variants={block}>
                <AboutInterests />
              </motion.div>
              <motion.div variants={block}>
                <AboutPrevious />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
