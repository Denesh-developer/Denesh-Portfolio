import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { workProjects, type CaseStudyBlock, type WorkProject } from '../../data/works'

type Props = {
  open: boolean
  onClose: () => void
  triggerRef?: React.MutableRefObject<HTMLElement | null>
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const TOTAL = pad2(workProjects.length)

const mono = 'font-mono uppercase tracking-[2px] text-[#8a8a8a]'

/* ---------------- gallery ---------------- */

function GalleryCard({ p, onOpen }: { p: WorkProject; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex min-h-[260px] flex-col rounded-[14px] border border-black/[0.07] bg-white p-[24px] text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-[4px] hover:shadow-[0_24px_46px_-18px_rgba(0,0,0,0.26)] focus-visible:[box-shadow:0_0_0_3px_#7aa88d] motion-reduce:transition-none"
    >
      <div className={`flex items-center justify-between pr-[40px] text-[11px] ${mono}`}>
        <span className="text-[#111]">{p.index}</span>
        <span>{p.period}</span>
      </div>

      <span className="mt-[22px] font-mono text-[10px] uppercase tracking-[1.8px] text-[#9a6a2f]">{p.category}</span>
      <h3 className="mt-[8px] font-instrument text-[34px] font-normal leading-[1.02] tracking-[-0.02em] text-[#111]">{p.title}</h3>
      <p className="mt-[10px] font-satoshi text-[14.5px] leading-[1.55] text-[#4a4a4a]">{p.description}</p>

      {/* bottom: tags by default; on hover the handwritten note sweeps in over a marker */}
      <div className="relative mt-auto min-h-[54px] pt-[20px]">
        <div className="absolute bottom-0 left-0 flex flex-wrap gap-[6px] transition-opacity duration-200 group-hover:opacity-0">
          {p.tags.map((t) => (
            <span key={t} className="rounded-full border border-black/[0.08] px-[9px] py-[4px] font-mono text-[9.5px] uppercase tracking-[1.2px] text-[#555]">
              {t}
            </span>
          ))}
        </div>
        {p.note && (
          <span className="absolute bottom-[2px] left-0 inline-block max-w-full">
            <span
              className="absolute inset-x-[-5px] inset-y-0 origin-left -rotate-[0.5deg] scale-x-0 rounded-[3px] transition-transform duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 motion-reduce:transition-none"
              style={{ background: p.highlight }}
              aria-hidden
            />
            <span className="relative px-[4px] font-caveat text-[17px] leading-[1.28] text-[#2a1620] opacity-0 transition-opacity delay-[170ms] duration-200 group-hover:opacity-100">
              {p.note}
            </span>
          </span>
        )}
      </div>

      {/* corner arrow — fills on hover */}
      <span
        className="absolute right-[18px] top-[16px] flex h-[30px] w-[30px] items-center justify-center rounded-full border border-black/[0.1] text-[#555] transition-colors duration-200 group-hover:border-[#111] group-hover:bg-[#111] group-hover:text-white"
        aria-hidden
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 9.5L9.5 2.5M4 2.5h5.5V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  )
}

function GalleryView({ onOpen }: { onOpen: (p: WorkProject) => void }) {
  return (
    <motion.div
      className="mx-auto w-full max-w-[1240px] px-[5%] pb-[90px] pt-[28px] md:pt-[40px]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <header className="max-w-[720px] pr-[56px]">
        <p className={`text-[11.5px] ${mono} text-[#444]`}>selected work · {TOTAL} projects</p>
        <h2 className="mt-[12px] font-instrument text-[clamp(44px,5vw,72px)] font-normal leading-none tracking-[-0.02em] text-[#111]">
          Things I&rsquo;ve <em className="italic">built.</em>
        </h2>
        <p className="mt-[14px] max-w-[520px] font-satoshi text-[16px] leading-[1.5] text-[#5c5c5c] md:text-[17px]">
          Products, platforms and websites I&rsquo;ve shipped &mdash; pick one to read the full case study.
        </p>
      </header>

      <div className="mt-[44px] grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-3">
        {workProjects.map((p) => (
          <GalleryCard key={p.id} p={p} onOpen={() => onOpen(p)} />
        ))}
      </div>
    </motion.div>
  )
}

/* ---------------- case study ---------------- */

// `ph` is the placeholder's height — used ONLY when there's no image. A real
// image keeps its own aspect ratio (shown in full, never cropped).
function ImageFrame({ src, ph = 'h-[220px]' }: { src?: string; ph?: string }) {
  if (src) {
    return (
      <div className="overflow-hidden rounded-[14px] border border-black/[0.07] bg-[#eeece6] shadow-[0_18px_40px_-22px_rgba(0,0,0,0.3)]">
        <img src={src} alt="" draggable={false} className="block h-auto w-full [-webkit-user-drag:none]" />
      </div>
    )
  }
  return (
    <div className={`flex flex-col items-center justify-center gap-[8px] rounded-[14px] border border-dashed border-black/[0.14] bg-[#f4f0e7] ${ph}`} aria-hidden>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c6bda9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
        <circle cx="8.5" cy="10" r="1.6" />
        <path d="M4 18l5.5-5 3.5 3.2 3-2.7 4 3.5" />
      </svg>
      <span className="font-mono text-[10px] uppercase tracking-[1.8px] text-[#b3ab98]">screenshot</span>
    </div>
  )
}

function PaperCards({ cards, accent }: { cards: { title: string; body: string }[]; accent: string }) {
  return (
    <div className={`grid gap-[14px] ${cards.length >= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {cards.map((c, i) => (
        <div key={i} className="rounded-[12px] border border-black/[0.06] bg-[#f4f0e7] p-[18px]">
          <span className="block h-[3px] w-[26px] rounded-full" style={{ background: accent }} aria-hidden />
          <p className="mt-[12px] font-satoshi text-[14.5px] font-bold leading-[1.35] text-[#111]">{c.title}</p>
          {c.body && <p className="mt-[7px] font-satoshi text-[13.5px] leading-[1.55] text-[#5a5a5a]">{c.body}</p>}
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-instrument text-[clamp(26px,2.6vw,32px)] font-normal leading-[1.12] tracking-[-0.01em] text-[#111]">{children}</h3>
}

function Block({ block }: { block: CaseStudyBlock }) {
  switch (block.type) {
    case 'section':
      return (
        <section>
          <SectionTitle>{block.heading}</SectionTitle>
          <p className="mt-[14px] max-w-[720px] font-satoshi text-[16px] leading-[1.7] text-[#3a3a3a]">{block.body}</p>
        </section>
      )
    case 'cards':
      return (
        <section>
          {block.heading && <SectionTitle>{block.heading}</SectionTitle>}
          {block.body && <p className="mt-[12px] mb-[18px] max-w-[720px] font-satoshi text-[16px] leading-[1.7] text-[#3a3a3a]">{block.body}</p>}
          {!block.body && block.heading && <div className="h-[18px]" />}
          <PaperCards cards={block.cards} accent={block.variant === 'outcome' ? '#7aa88d' : '#e0607a'} />
        </section>
      )
    case 'insight':
      return (
        <section className="border-l-[3px] border-[#7aa88d] pl-[22px]">
          <p className={`text-[10.5px] ${mono}`}>insight</p>
          <p className="mt-[8px] max-w-[700px] font-instrument text-[22px] italic leading-[1.45] text-[#111] md:text-[24px]">{block.body}</p>
        </section>
      )
    case 'hmw':
      return (
        <section className="rounded-[16px] border border-black/[0.06] bg-[#f4f0e7] px-[30px] py-[28px] max-[640px]:px-[22px]">
          <p className={`text-[10.5px] ${mono}`}>{block.eyebrow}</p>
          <h3 className="mt-[10px] max-w-[720px] font-instrument text-[clamp(24px,2.6vw,30px)] font-normal leading-[1.25] text-[#111]">{block.question}</h3>
          {block.note && <p className="mt-[12px] max-w-[680px] font-satoshi text-[14.5px] leading-[1.65] text-[#6a6357]">{block.note}</p>}
        </section>
      )
    case 'solution':
      return (
        <section className="grid grid-cols-1 items-start gap-[24px] md:grid-cols-[1fr_1.1fr]">
          <div>
            <p className={`text-[10.5px] ${mono}`}>{block.label}</p>
            <h3 className="mt-[8px] font-instrument text-[clamp(24px,2.4vw,28px)] font-normal leading-[1.15] text-[#111]">{block.title}</h3>
            <p className="mt-[10px] font-satoshi text-[14.5px] leading-[1.65] text-[#3a3a3a]">{block.body}</p>
          </div>
          <ImageFrame src={block.image} ph="h-[200px] max-[720px]:h-[170px]" />
        </section>
      )
    case 'reflection':
      return (
        <section className="border-t border-black/10 pt-[26px]">
          <p className={`text-[10.5px] ${mono}`}>{block.eyebrow}</p>
          <p className="mt-[10px] max-w-[720px] font-satoshi text-[15px] leading-[1.7] text-[#555]">{block.body}</p>
          <p className="mt-[16px] max-w-[760px] font-instrument text-[clamp(22px,2.4vw,26px)] italic leading-[1.35] text-[#111]">{block.statement}</p>
        </section>
      )
  }
}

function CaseStudyView({
  p,
  onBack,
  onNav,
}: {
  p: WorkProject
  onBack: () => void
  onNav: (p: WorkProject) => void
}) {
  const cs = p.caseStudy
  const i = workProjects.findIndex((x) => x.id === p.id)
  const prev = workProjects[(i - 1 + workProjects.length) % workProjects.length]
  const next = workProjects[(i + 1) % workProjects.length]
  const backBtn =
    'inline-flex items-center gap-[8px] rounded-full border border-[#cdcdcd] px-[16px] py-[8px] font-mono text-[10.5px] uppercase tracking-[1.8px] text-[#555] transition-colors hover:border-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]'

  return (
    <motion.article
      className="mx-auto w-full max-w-[980px] px-[5%] pb-[90px] pt-[28px] md:pt-[36px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <button type="button" onClick={onBack} className={backBtn}>
        <span aria-hidden>&larr;</span> all work
      </button>

      <p className={`mt-[34px] text-[11.5px] ${mono} text-[#444]`}>
        <span className="tabular-nums">{p.index} / {TOTAL}</span>
        <span className="mx-[8px] text-[#c4c4c4]">·</span>
        {p.category}
        <span className="mx-[8px] text-[#c4c4c4]">·</span>
        {p.period}
      </p>
      <h1 className="mt-[14px] max-w-[820px] font-instrument text-[clamp(36px,4.6vw,62px)] font-normal leading-[1.04] tracking-[-0.02em] text-[#111]">
        {cs.title}
      </h1>
      <p className="mt-[20px] max-w-[720px] font-satoshi text-[17px] leading-[1.65] text-[#3a3a3a]">{cs.intro}</p>
      {cs.goal && (
        <p className="mt-[16px] max-w-[720px] font-instrument text-[22px] italic leading-[1.4] text-[#3f7256]">{cs.goal}</p>
      )}

      {/* hero — one wide frame, or a 2-up when there are multiple shots */}
      <div className="mt-[36px]">
        {cs.hero.length >= 2 ? (
          <div className="grid grid-cols-1 items-start gap-[14px] sm:grid-cols-2">
            {cs.hero.slice(0, 2).map((src, k) => (
              <ImageFrame key={k} src={src} ph="h-[220px] max-[640px]:h-[170px]" />
            ))}
          </div>
        ) : (
          <ImageFrame src={cs.hero[0]} ph="h-[280px] max-[640px]:h-[190px]" />
        )}
      </div>

      {/* meta / credits */}
      <div className="mt-[32px] grid grid-cols-2 gap-x-[24px] gap-y-[22px] border-t border-black/[0.09] pt-[24px] md:grid-cols-4">
        {cs.meta.map((m, k) => (
          <div key={k}>
            <p className={`text-[10px] ${mono}`}>{m.label}</p>
            {m.value.startsWith('http') ? (
              <a
                href={m.value}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-[8px] inline-flex items-center gap-[4px] font-satoshi text-[13.5px] font-semibold leading-[1.5] text-[#12b86f] underline underline-offset-[3px] hover:text-[#0a8751]"
              >
                {m.value.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
              </a>
            ) : (
              <p className="mt-[8px] font-satoshi text-[13.5px] leading-[1.5] text-[#2c2c2c]">{m.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-[48px] flex flex-col gap-[44px]">
        {cs.blocks.map((b, k) => (
          <Block key={k} block={b} />
        ))}
      </div>

      {p.placeholder && (
        <p className="mt-[30px] inline-block rounded-[8px] bg-[#fff3f4] px-[12px] py-[9px] font-mono text-[10.5px] uppercase tracking-[1.4px] text-[#a1465a]">
          sample case study · edit src/data/works.json
        </p>
      )}

      {/* prev / next */}
      <nav className="mt-[60px] grid grid-cols-1 gap-[14px] border-t border-black/[0.09] pt-[26px] sm:grid-cols-2" aria-label="Other case studies">
        <button
          type="button"
          onClick={() => onNav(prev)}
          className="group rounded-[14px] border border-black/[0.07] bg-white p-[18px] text-left outline-none transition-[transform,box-shadow] hover:-translate-y-[2px] hover:shadow-[0_18px_36px_-18px_rgba(0,0,0,0.25)] focus-visible:[box-shadow:0_0_0_3px_#7aa88d]"
        >
          <span className={`text-[10px] ${mono}`}>&larr; previous · {prev.index}</span>
          <span className="mt-[6px] block font-instrument text-[24px] leading-[1.1] text-[#111]">{prev.title}</span>
        </button>
        <button
          type="button"
          onClick={() => onNav(next)}
          className="group rounded-[14px] border border-black/[0.07] bg-white p-[18px] text-right outline-none transition-[transform,box-shadow] hover:-translate-y-[2px] hover:shadow-[0_18px_36px_-18px_rgba(0,0,0,0.25)] focus-visible:[box-shadow:0_0_0_3px_#7aa88d]"
        >
          <span className={`text-[10px] ${mono}`}>next · {next.index} &rarr;</span>
          <span className="mt-[6px] block font-instrument text-[24px] leading-[1.1] text-[#111]">{next.title}</span>
        </button>
      </nav>
    </motion.article>
  )
}

/* ---------------- page shell ---------------- */

/**
 * Works — a full-page gallery ("Things I've built.") that opens into a
 * full-page case study, in the same cream / serif / mono language as the
 * tic-tac-toe, "On repeat." and watchlist pages. Content lives in works.json.
 */
export function WorksGalleryModal({ open, onClose, triggerRef }: Props) {
  // One element is both the dialog and the scroll container.
  const dialogRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<WorkProject | null>(null)

  useEffect(() => {
    if (open) setSelected(null)
  }, [open])

  // Back to the top whenever the view (gallery ↔ case study) changes.
  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0 })
  }, [selected])

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => dialogRef.current?.focus(), 60)
      return () => window.clearTimeout(t)
    }
    triggerRef?.current?.focus?.()
  }, [open, triggerRef])

  // Esc: back to the gallery from a case study, otherwise close. Tab is trapped.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (selected) setSelected(null)
        else onClose()
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
  }, [open, selected, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[3000] bg-[#f9f8f4]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={selected ? `Case study: ${selected.title}` : 'Works — selected projects'}
            tabIndex={-1}
            className="relative h-full w-full overflow-y-auto outline-none"
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

            <AnimatePresence mode="wait" initial={false}>
              {selected ? (
                <CaseStudyView key={selected.id} p={selected} onBack={() => setSelected(null)} onNav={setSelected} />
              ) : (
                <GalleryView key="gallery" onOpen={setSelected} />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default WorksGalleryModal
