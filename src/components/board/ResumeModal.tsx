import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

const RESUME_URL = '/assets/Deneshraja_N_FrontendDeveloper.pdf'
const RESUME_FILE = 'Deneshraja_N_FrontendDeveloper.pdf'

/**
 * Full-screen résumé viewer. Renders the real PDF in the browser's native viewer
 * (an <iframe>, so zoom / scroll / page controls come for free) with explicit
 * Download and Open-in-new-tab actions. Rendered in a portal on document.body so
 * it's viewport-fixed and never affected by the board's pan/zoom transform.
 *
 * Inline PDF preview is unreliable on mobile (esp. iOS Safari), so coarse-pointer
 * devices get a clean "open / download" panel instead of a blank frame.
 */
export function ResumeModal({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean
  onClose: () => void
  triggerRef?: React.MutableRefObject<HTMLElement | null>
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const isTouch =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches

  // Focus the close button on open; restore focus to the launcher on close.
  useEffect(() => {
    if (!open) return
    const restoreTo = triggerRef?.current ?? (document.activeElement as HTMLElement | null)
    const t = window.setTimeout(() => closeRef.current?.focus(), 60)
    return () => {
      window.clearTimeout(t)
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

  const pill =
    'inline-flex items-center gap-[6px] rounded-[9px] px-[13px] py-[7px] font-satoshi text-[13px] font-semibold cursor-pointer transition-colors focus-visible:[outline:2px_solid_#7aa88d] focus-visible:[outline-offset:2px]'

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-[rgba(20,19,17,0.62)] p-[14px] [backdrop-filter:blur(4px)] sm:p-[22px]"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Deneshraja's résumé"
            onClick={(e) => e.stopPropagation()}
            className="flex h-[min(96vh,100%)] w-[min(960px,100%)] flex-col overflow-hidden rounded-[16px] border border-black/10 bg-[#f6f1e7] shadow-[0_28px_80px_rgba(0,0,0,0.5)]"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* header */}
            <div className="flex shrink-0 items-center justify-between gap-[10px] border-b border-black/10 px-[16px] py-[11px] sm:px-[18px]">
              <div className="min-w-0">
                <h2 className="font-aeonik text-[16px] font-bold leading-none text-[#2b2a28] sm:text-[18px]">
                  Resume
                </h2>
                <p className="mt-[4px] truncate font-satoshi text-[11px] text-[#8a8375]">
                  Deneshraja N · Full-Stack &amp; Android Developer
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-[8px]">
                <a
                  href={RESUME_URL}
                  download={RESUME_FILE}
                  className={`${pill} bg-[#2b2a28] text-[#f6f1e7] hover:bg-[#3d3a36]`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 3a1 1 0 0 1 1 1v9.59l2.3-2.3a1 1 0 0 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1zM5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z" />
                  </svg>
                  <span className="max-[420px]:hidden">Download</span>
                </a>
                <a
                  href={RESUME_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${pill} border border-solid border-[#2b2a28]/30 bg-transparent text-[#2b2a28] hover:bg-black/5`}
                  aria-label="Open résumé in a new tab"
                >
                  <span className="max-[560px]:hidden">Open</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M14 5h5v5M19 5l-8 8M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close résumé"
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-solid border-black/10 bg-white/80 text-[#2b2a28] shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-colors hover:bg-white focus-visible:[outline:2px_solid_#7aa88d] focus-visible:[outline-offset:2px]"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* body */}
            {isTouch ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-[16px] px-[24px] py-[32px] text-center">
                <div className="flex h-[68px] w-[68px] items-center justify-center rounded-[16px] bg-[#2b2a28] text-[30px] text-[#f6f1e7]">
                  📄
                </div>
                <p className="max-w-[300px] font-satoshi text-[14px] leading-[1.55] text-[#5f594e]">
                  Open the full résumé (PDF) to view, zoom, and download it.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-[10px]">
                  <a
                    href={RESUME_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${pill} bg-[#2b2a28] text-[#f6f1e7] hover:bg-[#3d3a36]`}
                  >
                    Open résumé ↗
                  </a>
                  <a
                    href={RESUME_URL}
                    download={RESUME_FILE}
                    className={`${pill} border border-solid border-[#2b2a28]/30 bg-transparent text-[#2b2a28] hover:bg-black/5`}
                  >
                    Download
                  </a>
                </div>
              </div>
            ) : (
              <iframe
                src={`${RESUME_URL}#view=FitH`}
                title="Deneshraja Nedunchezhian résumé"
                className="w-full flex-1 border-0 bg-[#525659]"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default ResumeModal
