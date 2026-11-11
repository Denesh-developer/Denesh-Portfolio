import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useBoard } from '../../board/BoardContext'
import { projects, type TimelineEntry } from '../../data/projects'

/** Pill colors per engagement type. */
const KIND_STYLES: Record<TimelineEntry['kind'], string> = {
  'Full-time': 'bg-[#e7f0ea] text-[#3f7256]',
  Internship: 'bg-[#e6eefb] text-[#3b62a8]',
  Freelance: 'bg-[#efe4fb] text-[#6b4a9e]',
}

/** Accessible project case-study dialog: focus trap, Escape to close, focus
 *  restore, and a bottom-sheet presentation on small screens (via CSS). */
export function ProjectModal() {
  const { activeProject, closeProject } = useBoard()
  const project = activeProject ? projects[activeProject] : null
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (activeProject) {
      lastFocused.current = document.activeElement as HTMLElement
      const t = window.setTimeout(
        () => dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus(),
        40,
      )
      return () => window.clearTimeout(t)
    }
    lastFocused.current?.focus?.()
  }, [activeProject])

  useEffect(() => {
    if (!activeProject) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeProject()
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
  }, [activeProject, closeProject])

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[2000] bg-[rgba(20,20,20,0.5)] backdrop-blur-[2px] flex items-center justify-center p-[24px] max-[640px]:items-end max-[640px]:p-0"
          onClick={closeProject}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={dialogRef}
            className="relative w-[min(560px,100%)] max-h-[86vh] overflow-auto bg-white rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-[640px]:w-full max-[640px]:max-h-[90vh] max-[640px]:rounded-[18px_18px_0_0]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <button
              className="absolute top-[12px] right-[12px] w-[34px] h-[34px] rounded-full border-0 bg-white/92 text-[#111] flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.2)] z-[2] focus-visible:[outline:2px_solid_#7aa88d] focus-visible:[outline-offset:2px]"
              data-autofocus
              onClick={closeProject}
              aria-label="Close dialog"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            {project.timeline ? (
              /* ---- Work-history timeline ---- */
              <div className="pt-[26px] px-[24px] pb-[26px]">
                <p className="uppercase tracking-[1.5px] text-[11px] font-bold text-brand">
                  {project.tagline}
                </p>
                <h2 id="modal-title" className="font-aeonik font-bold text-[30px] mt-[4px] mb-[2px]">
                  {project.name}
                </h2>
                <p className="text-[#666] text-[14px]">{project.role}</p>

                <ol className="list-none relative mt-[20px] ml-[7px] border-l-2 border-[#ececec] pl-[24px] flex flex-col gap-[22px]">
                  {project.timeline.map((e, i) => (
                    <li key={i} className="relative">
                      <span
                        aria-hidden
                        className={[
                          'absolute top-[3px] left-[-32px] w-[15px] h-[15px] rounded-full border-2 border-white',
                          e.current
                            ? 'bg-brand shadow-[0_0_0_3px_rgba(122,168,141,0.35)]'
                            : 'bg-[#c9c9c9]',
                        ].join(' ')}
                      />
                      <div className="flex items-baseline justify-between gap-[10px] flex-wrap">
                        <h3 className="font-satoshi font-bold text-[16px] text-[#0f0a16] leading-tight">
                          {e.role}
                        </h3>
                        <span className="text-[12px] text-[#8a8a8a] whitespace-nowrap font-medium">
                          {e.period}
                        </span>
                      </div>
                      <p className="text-[14px] text-[#444] font-medium mt-[1px]">{e.company}</p>
                      <div className="flex items-center gap-[7px] mt-[5px]">
                        <span
                          className={`inline-block text-[11px] font-semibold px-[8px] py-[2px] rounded-full ${KIND_STYLES[e.kind]}`}
                        >
                          {e.kind}
                        </span>
                        {e.current && (
                          <span className="inline-flex items-center gap-[4px] text-[11px] font-semibold text-[#3f7256]">
                            <span className="w-[6px] h-[6px] rounded-full bg-brand" />
                            Present
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#555] leading-[1.5] mt-[6px]">{e.summary}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              /* ---- Project case study ---- */
              <>
                <div>
                  <img
                    src={project.image}
                    alt=""
                    draggable={false}
                    className="w-full h-[200px] object-cover object-center block bg-[#f4ece0] rounded-t-[18px]"
                  />
                </div>
                <div className="pt-[20px] px-[24px] pb-[24px]">
                  <p className="uppercase tracking-[1.5px] text-[11px] font-bold text-brand">
                    {project.tagline} · {project.year}
                  </p>
                  <h2 id="modal-title" className="font-aeonik font-bold text-[30px] mt-[4px] mb-[2px]">
                    {project.name}
                  </h2>
                  <p className="text-[#666] text-[14px] mb-[12px]">{project.role}</p>
                  <p className="text-[15px] leading-[1.55] text-[#333]">{project.summary}</p>
                  <ul className="mt-[14px] pl-[18px] flex flex-col gap-[6px] text-[14px] text-[#333]">
                    {project.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                  {project.placeholder && (
                    <p className="mt-[14px] text-[12px] text-[#a1465a] bg-[#fff3f4] py-[8px] px-[10px] rounded-[8px]">
                      Placeholder content — replace with the real case study.
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
