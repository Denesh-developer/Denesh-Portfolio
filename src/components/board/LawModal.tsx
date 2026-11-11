import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type Props = {
  open: boolean
  onClose: () => void
  triggerRef?: React.MutableRefObject<HTMLElement | null>
}

/**
 * A small "other side of me" modal opened from the law-student sticker.
 * Deliberately brief — the law journey is early (LLB, 2nd year); this is a
 * placeholder-friendly spot to grow as there's more to share.
 */
export function LawModal({ open, onClose, triggerRef }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(
        () => dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus(),
        40,
      )
      return () => window.clearTimeout(t)
    }
    triggerRef?.current?.focus?.()
  }, [open, triggerRef])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Tab') {
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
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2000] bg-[rgba(20,20,20,0.5)] backdrop-blur-[2px] flex items-center justify-center p-[24px] max-[640px]:items-end max-[640px]:p-0"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={dialogRef}
            className="relative w-[min(560px,100%)] max-h-[88vh] overflow-auto bg-white rounded-[18px] shadow-[0_24px_64px_rgba(0,0,0,0.32)] max-[640px]:w-full max-[640px]:max-h-[92vh] max-[640px]:rounded-[18px_18px_0_0]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="law-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <button
              className="absolute top-[14px] right-[14px] w-[36px] h-[36px] rounded-full border-0 bg-white/90 text-[#111] flex items-center justify-center cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.18)] z-[3] focus-visible:[outline:2px_solid_#111] focus-visible:[outline-offset:2px] hover:bg-white"
              data-autofocus
              onClick={onClose}
              aria-label="Close dialog"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="flex gap-[26px] p-[30px] max-[560px]:flex-col max-[560px]:gap-[18px] max-[640px]:p-[22px]">
              <img
                src="/assets/denesh.svg"
                alt=""
                draggable={false}
                className="w-[132px] h-auto self-start object-contain shrink-0 [-webkit-user-drag:none] drop-shadow-[0_6px_14px_rgba(0,0,0,0.15)] max-[560px]:w-[110px] max-[560px]:self-center"
              />
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[1.6px] text-brand">Tech &amp; Infrastructure</p>
                <h2 id="law-title" className="font-aeonik font-bold text-[27px] max-[640px]:text-[23px] leading-[1.1] mt-[5px] mb-[3px] text-[#0f0a16]">
                  System Administrator
                </h2>
                <p className="text-[15px] leading-[1.7] text-[#3a3a3a] mt-[10px]">
                  At Voltech Engineers, I manage enterprise system operations, server reliability, workstation provisioning, and network workflows. Operating on the infrastructure side gives me practical, real-world perspective on security, stability, and production deployment for the web and mobile apps I engineer.
                </p>

                <div className="mt-[18px] flex flex-col gap-[12px]">
                  <div className="flex items-start gap-[11px]">
                    <span className="mt-[3px] shrink-0 w-[16px] h-[16px] rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center" aria-hidden>🖥</span>
                    <div>
                      <p className="text-[14px] font-semibold text-[#0f0a16] leading-tight">Voltech Engineers Private Limited</p>
                      <p className="text-[13px] text-[#666] mt-[1px]">System Administrator &middot; Chennai, India</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-[11px]">
                    <span className="mt-[3px] shrink-0 w-[16px] h-[16px] rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center" aria-hidden>🎓</span>
                    <div>
                      <p className="text-[14px] font-semibold text-[#0f0a16] leading-tight">Bachelor of Computer Applications (BCA)</p>
                      <p className="text-[13px] text-[#666] mt-[1px]">Adhiparasakthi College of Arts &amp; Science (76%)</p>
                    </div>
                  </div>
                </div>

                <p className="mt-[18px] text-[13px] leading-[1.6] text-[#8a8a8a] italic">
                  Passionate about combining robust infrastructure with clean, modern code.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LawModal
