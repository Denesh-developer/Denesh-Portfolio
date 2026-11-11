import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Contact / social modal — opened from the mailbox icon in the dock.
 *
 * EDIT ME: fill in the real handles below. `href` is what the link opens;
 * `handle` is the text shown. Email uses a `mailto:` link. Anything left as
 * '#' is a placeholder — swap it for the real URL (or delete the row).
 */
type Contact = {
  id: string
  label: string
  handle: string
  href: string
  icon: 'mail' | 'github' | 'linkedin' | 'phone' | 'x' | 'instagram'
}

const CONTACTS: Contact[] = [
  { id: 'email', label: 'Email', handle: 'deneshraja235@gmail.com', href: 'mailto:deneshraja235@gmail.com', icon: 'mail' },
  { id: 'github', label: 'GitHub', handle: '@Denesh-developer', href: 'https://github.com/Denesh-developer', icon: 'github' },
  { id: 'linkedin', label: 'LinkedIn', handle: 'Deneshraja N', href: 'https://www.linkedin.com/in/deneshraja-n-a28666304', icon: 'linkedin' },
  { id: 'phone', label: 'Phone', handle: '+91 93423 72731', href: 'tel:+919342372731', icon: 'phone' },
]

const ICONS: Record<Contact['icon'], JSX.Element> = {
  mail: (
    <path d="M3 5h18v14H3V5zm2 2v.4l7 4.6 7-4.6V7H5zm14 2.8-7 4.6-7-4.6V17h14V9.8z" />
  ),
  github: (
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
  ),
  linkedin: (
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm6 0h3.8v1.64h.05c.53-1 1.83-2.05 3.76-2.05C20.6 8.59 22 10.28 22 13.6V21h-4v-6.56c0-1.56-.03-3.57-2.18-3.57-2.18 0-2.51 1.7-2.51 3.46V21H9V9z" />
  ),
  phone: (
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  ),
  x: (
    <path d="M17.53 3H21l-7.19 8.21L22 21h-6.56l-5.14-6.72L4.4 21H1l7.69-8.78L2 3h6.72l4.65 6.15L17.53 3zm-1.15 16h1.84L7.7 4.9H5.72l10.66 14.1z" />
  ),
  instagram: (
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.24a6.6 6.6 0 1 0 0 13.2 6.6 6.6 0 0 0 0-13.2zm0 10.88a4.28 4.28 0 1 1 0-8.56 4.28 4.28 0 0 1 0 8.56zm6.85-11.14a1.54 1.54 0 1 1-3.08 0 1.54 1.54 0 0 1 3.08 0z" />
  ),  
}

export function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement
      const t = window.setTimeout(
        () => dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus(),
        40,
      )
      return () => window.clearTimeout(t)
    }
    lastFocused.current?.focus?.()
  }, [open])

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
            className="relative w-[min(440px,100%)] max-h-[86vh] overflow-auto bg-white rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-[640px]:w-full max-[640px]:max-h-[90vh] max-[640px]:rounded-[18px_18px_0_0]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <button
              className="absolute top-[12px] right-[12px] w-[34px] h-[34px] rounded-full border-0 bg-white/92 text-[#111] flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.2)] z-[2] focus-visible:[outline:2px_solid_#7aa88d] focus-visible:[outline-offset:2px]"
              data-autofocus
              onClick={onClose}
              aria-label="Close dialog"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="pt-[26px] px-[24px] pb-[24px]">
              <p className="uppercase tracking-[1.5px] text-[11px] font-bold text-brand">Get in touch</p>
              <h2 id="contact-title" className="font-aeonik font-bold text-[28px] mt-[4px] mb-[2px]">
                Let&rsquo;s connect
              </h2>
              <p className="text-[#666] text-[14px] mb-[18px]">
                Reach out for work, collaborations, or just to say hi.
              </p>

              <ul className="list-none p-0 m-0 flex flex-col gap-[10px]">
                {CONTACTS.map((c) => {
                  const disabled = c.href === '#'
                  return (
                    <li key={c.id}>
                      <a
                        href={c.href}
                        target={c.href.startsWith('http') ? '_blank' : undefined}
                        rel={c.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                        aria-disabled={disabled || undefined}
                        onClick={(e) => disabled && e.preventDefault()}
                        className={`flex items-center gap-[14px] py-[11px] px-[14px] rounded-[12px] border border-solid border-black/8 bg-[#faf9f7] text-[#111] no-underline transition-[background,transform] duration-150 ease-[ease] focus-visible:[outline:2px_solid_#7aa88d] focus-visible:[outline-offset:2px] ${
                          disabled ? 'opacity-55 cursor-default' : 'hover:bg-[#f1efeb] hover:-translate-y-[1px] cursor-pointer'
                        }`}
                      >
                        <span className="shrink-0 w-[38px] h-[38px] rounded-[10px] bg-[#111] text-white flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            {ICONS[c.icon]}
                          </svg>
                        </span>
                        <span className="flex flex-col min-w-0">
                          <span className="text-[13px] font-semibold text-[#0f0a16] leading-tight">{c.label}</span>
                          <span className="text-[13px] text-[#666] truncate">{c.handle}</span>
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ContactModal
