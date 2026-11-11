import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { experienceRoles, type ExperienceRole } from '../../data/experience'

type Props = {
  open: boolean
  onClose: () => void
  triggerRef?: React.MutableRefObject<HTMLElement | null>
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const isPresent = (r: ExperienceRole) => /present/i.test(r.period)
const mono = 'font-mono uppercase tracking-[2px]'

/** Crossfades its child whenever `id` changes. */
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

/** Company mark on a white label (or the name when there's no logo). */
function CompanyTag({ r }: { r: ExperienceRole }) {
  return r.logo ? (
    <span className="inline-flex items-center   ">
      <img src={r.logo} alt={r.company} draggable={false} className="h-[42px] w-auto max-w-[150px] object-contain [-webkit-user-drag:none]" />
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-black/[0.07] bg-white px-[14px] py-[9px] font-satoshi text-[14px] font-bold text-[#111]">
      {r.company}
    </span>
  )
}

function Bullets({ r, size = 'md' }: { r: ExperienceRole; size?: 'md' | 'sm' }) {
  return (
    <ul className={`m-0 list-none p-0 ${size === 'md' ? 'mt-[22px] space-y-[12px]' : 'mt-[14px] space-y-[8px]'}`}>
      {r.bullets.map((b, i) => (
        <li key={i} className={`flex gap-[14px] font-satoshi leading-[1.6] text-[#3a3a3a] ${size === 'md' ? 'text-[16px]' : 'text-[14.5px]'}`}>
          <span className="mt-[13px] h-[2px] w-[16px] shrink-0 rounded-full bg-[#e0607a]" aria-hidden />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  )
}

function Tags({ r }: { r: ExperienceRole }) {
  if (!r.tags?.length) return null
  return (
    <div className="mt-[22px] flex flex-wrap gap-[8px]">
      {r.tags.map((t) => (
        <span key={t} className="rounded-full border border-black/[0.1] px-[11px] py-[5px] font-mono text-[10px] uppercase tracking-[1.4px] text-[#555]">
          {t}
        </span>
      ))}
    </div>
  )
}

/**
 * Experience — a full-page career timeline in the shared cream / serif / mono
 * language. Desktop: a rail of roles on the left (newest first; hover previews,
 * click locks, ↑ ↓ browse) with the selected role spotlighted on the right.
 * Small screens: every role as a stacked card. Content lives in experience.json.
 */
export function ExperienceModal({ open, onClose, triggerRef }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const roles = experienceRoles
  const defaultIdx = Math.max(0, roles.findIndex(isPresent))
  const [index, setIndex] = useState(defaultIdx)
  const [preview, setPreview] = useState<number | null>(null)
  const shown = roles[preview ?? index]

  const go = useCallback((d: number) => setIndex((i) => (roles.length ? (i + d + roles.length) % roles.length : 0)), [roles.length])

  useEffect(() => {
    if (open) {
      setIndex(defaultIdx)
      const t = window.setTimeout(() => dialogRef.current?.focus(), 60)
      return () => window.clearTimeout(t)
    }
    triggerRef?.current?.focus?.()
  }, [open, triggerRef, defaultIdx])

  // Esc closes · ↑ ↓ (and ← →) browse roles · Tab is trapped.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Tab') {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
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
      {open && shown && (
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
            aria-label="Experience — where I've worked"
            tabIndex={-1}
            className="relative flex min-h-full flex-col px-[5%] pb-[80px] pt-[28px] outline-none md:pb-[60px] md:pt-[40px]"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close and return to the board"
              className="fixed right-[20px] top-[18px] z-[20] flex h-[40px] w-[40px] items-center justify-center rounded-full border border-black/10 bg-white/80 text-[#2b2a28] shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="mx-auto w-full max-w-[1120px] md:my-auto">
              {/* ---- heading ---- */}
              <header className="max-w-[720px] pr-[56px]">
                <p className={`text-[11.5px] ${mono} text-[#444]`}>experience · {pad2(roles.length)} roles</p>
                <h2 className="mt-[12px] font-instrument text-[clamp(44px,5vw,72px)] font-normal leading-none tracking-[-0.02em] text-[#111]">
                  Where I&rsquo;ve <em className="italic">worked.</em>
                </h2>
                <p className="mt-[14px] max-w-[520px] font-satoshi text-[16px] leading-[1.5] text-[#5c5c5c] md:text-[17px]">
                  {roles.length} roles across full-stack, frontend and freelance work &mdash; newest first.
                </p>
              </header>

              {/* ---- desktop: rail + spotlight ---- */}
              <div className="mt-[48px] hidden md:grid md:grid-cols-[minmax(280px,360px)_1fr] md:gap-[72px]">
                <ol className="relative m-0 list-none p-0" aria-label="Roles">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-[22px] left-[8px] top-[22px] w-px"
                    style={{ background: 'linear-gradient(to bottom, transparent, #cfcfcf 10%, #cfcfcf 90%, transparent)' }}
                  />
                  {roles.map((r, i) => {
                    const active = (preview ?? index) === i
                    const current = isPresent(r)
                    return (
                      <li key={r.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setIndex(i)}
                          onMouseEnter={() => setPreview(i)}
                          onMouseLeave={() => setPreview(null)}
                          onFocus={() => setPreview(i)}
                          onBlur={() => setPreview(null)}
                          aria-pressed={index === i}
                          aria-label={`${r.company} — ${r.role}, ${r.period}`}
                          className={`group block w-full cursor-pointer rounded-[12px] py-[14px] pl-[34px] pr-[14px] text-left outline-none transition-colors duration-200 focus-visible:[box-shadow:0_0_0_2px_#7aa88d] ${
                            active ? 'bg-white shadow-[0_10px_26px_-16px_rgba(0,0,0,0.25)]' : 'hover:bg-black/[0.03]'
                          }`}
                        >
                          {/* node on the rail */}
                          <span
                            aria-hidden
                            className={`absolute left-[8px] top-[26px] -translate-x-1/2 rounded-full transition-all duration-200 ${
                              active ? 'h-[12px] w-[12px] bg-[#111]' : 'h-[8px] w-[8px] bg-[#cfcfcf] group-hover:bg-[#9a9a9a]'
                            } ${current && !active ? 'ring-[3px] ring-[#7aa88d]/30' : ''}`}
                          />
                          <span className="flex items-center gap-[8px]">
                            <span className={`text-[10px] ${mono} ${active ? 'text-[#444]' : 'text-[#9a9a9a]'}`}>{r.period}</span>
                            {current && (
                              <span className="rounded-full bg-[#7aa88d] px-[7px] py-[2px] font-mono text-[8.5px] uppercase tracking-[1.2px] text-white">now</span>
                            )}
                          </span>
                          <span className={`mt-[6px] block font-satoshi text-[15px] font-bold leading-tight ${active ? 'text-[#111]' : 'text-[#333]'}`}>{r.company}</span>
                          <span className="mt-[2px] block font-satoshi text-[13px] leading-tight text-[#777]">{r.role}</span>
                        </button>
                      </li>
                    )
                  })}
                </ol>

                <div className="min-w-0">
                  <Swap id={shown.id}>
                    <p className={`text-[11.5px] ${mono} text-[#444]`}>
                      <span className="tabular-nums">{pad2(roles.indexOf(shown) + 1)} / {pad2(roles.length)}</span>
                      <span className="mx-[8px] text-[#c4c4c4]">·</span>
                      {shown.period}
                      
                    </p>
                     <div className="mt-[18px]">
                      <CompanyTag r={shown} />
                    </div>
                    <h3 className="mt-[14px] font-instrument text-[clamp(34px,3.8vw,54px)] font-normal leading-[1.04] tracking-[-0.02em] text-[#111]">
                      {shown.role}
                    </h3>
                   
                    <Bullets r={shown} />
                    <Tags r={shown} />
                  </Swap>

                  <div className="mt-[34px] flex items-center gap-[10px]">
                    <button type="button" onClick={() => go(-1)} aria-label="Newer role" className={arrowBtn}>
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                        <path d="M2 9l5-5 5 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => go(1)} aria-label="Older role" className={arrowBtn}>
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                        <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span className="ml-[6px] font-mono text-[9.5px] uppercase tracking-[2px] text-[#b3b3b3]">↑ ↓ to browse · esc to close</span>
                  </div>
                </div>
              </div>

              {/* ---- small screens: every role, stacked ---- */}
              <ol className="mt-[36px] m-0 flex list-none flex-col gap-[16px] p-0 md:hidden">
                {roles.map((r, i) => (
                  <li key={r.id} className="rounded-[16px] border border-black/[0.07] bg-white p-[22px]">
                    <p className={`text-[10.5px] ${mono} text-[#8a8a8a]`}>
                      <span className="tabular-nums">{pad2(i + 1)}</span>
                      <span className="mx-[6px] text-[#c4c4c4]">·</span>
                      {r.period}
                      {isPresent(r) && (
                        <span className="ml-[8px] rounded-full bg-[#7aa88d] px-[7px] py-[2px] font-mono text-[8.5px] uppercase tracking-[1.2px] text-white">now</span>
                      )}
                    </p>
                    <h3 className="mt-[10px] font-instrument text-[28px] font-normal leading-[1.08] tracking-[-0.01em] text-[#111]">{r.role}</h3>
                    <div className="mt-[12px]">
                      <CompanyTag r={r} />
                    </div>
                    <Bullets r={r} size="sm" />
                    <Tags r={r} />
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ExperienceModal
