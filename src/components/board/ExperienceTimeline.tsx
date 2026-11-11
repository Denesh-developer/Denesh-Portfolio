import { useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { experienceRoles, type ExperienceRole } from '../../data/experience'

/** Employment-type chip colours (reused from the old timeline palette). */


const isPresent = (r: ExperienceRole) => /present/i.test(r.period)

/**
 * Interactive career timeline: a thin rail with milestone nodes, newest → oldest.
 * Each role is a semantic <button>. Hover / keyboard-focus PREVIEWS an entry;
 * click LOCKS it (activeId). Only one entry is expanded at a time — the effective
 * one is `previewId ?? activeId`. The current role (…— Present) is locked open by
 * default. Height is animated with a CSS grid-rows trick (smooth auto-height),
 * disabled under prefers-reduced-motion.
 */
export function ExperienceTimeline() {
  const roles = experienceRoles
  const reduce = useReducedMotion()
  const defaultId = (roles.find(isPresent) ?? roles[0])?.id
  const [activeId, setActiveId] = useState<string | undefined>(defaultId)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const expandedId = previewId ?? activeId

  return (
    <ol className="relative m-0 list-none p-0">
      {/* rail — a hairline that fades at both ends */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[7px] top-[16px] bottom-[16px] w-px -translate-x-1/2"
        style={{ background: 'linear-gradient(to bottom, transparent, #d7d7d7 10%, #d7d7d7 90%, transparent)' }}
      />

      {roles.map((r) => {
        const expanded = expandedId === r.id
        const current = isPresent(r)
        const extra = r.bullets.slice(1)
        return (
          <li key={r.id} className="relative">
            {/* milestone node */}
            <span
              aria-hidden
              className={`absolute left-[7px] top-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ease-out 
                
              `}
            />

            <button
              type="button"
              onClick={() => setActiveId(r.id)}
              onMouseEnter={() => setPreviewId(r.id)}
              onMouseLeave={() => setPreviewId(null)}
              onFocus={() => setPreviewId(r.id)}
              onBlur={() => setPreviewId(null)}
              aria-expanded={expanded}
              aria-label={`${r.company} — ${r.role}, ${r.period}`}
              className={`block w-full cursor-pointer rounded-[12px] py-[13px] pl-[28px] pr-[14px] text-left transition-colors duration-200 focus-visible:[outline:2px_solid_#7aa88d] focus-visible:[outline-offset:2px] max-[640px]:pl-[26px] ${
                expanded ? 'bg-[#f6f4f0]' : 'hover:bg-black/[0.025]'
              }`}
            >
              {/* date + present marker */}
              <div className="flex items-center gap-[8px]">
                <span className="font-mono text-[10.5px] font-medium uppercase tracking-[1.3px] text-[#8a8a8a]">
                  {r.period}
                </span>
                {current && (
                  <span className="rounded-full border border-[#3f7256] px-[7px] py-[1px] font-satoshi text-[9px] font-bold uppercase tracking-[0.8px] text-[#3f7256]">
                    Present
                  </span>
                )}
              </div>

              {/* company logo (slight scale on activation) */}
              <div className="mt-[9px] flex h-[26px] items-center">
                {r.logo ? (
                  <img
                    src={r.logo}
                    alt={r.company}
                    draggable={false}
                    className={`block h-full w-auto max-w-[140px] origin-left object-contain object-left transition-transform duration-200 [-webkit-user-drag:none] `}
                  />
                ) : (
                  <span className="font-satoshi text-[14px] font-bold text-[#0f0a16]">{r.company}</span>
                )}
              </div>

              {/* role */}
              <h3 className="mt-[9px] font-aeonik text-[17px] font-bold leading-[1.15] text-[#0f0a16] max-[640px]:text-[16px]">
                {r.role}
              </h3>

              {/* lead line — one line when collapsed, full when expanded */}
              <p className={`mt-[4px] text-[13px] leading-[1.55] text-[#4a4a4a] ${expanded ? '' : 'truncate'}`}>
                {r.bullets[0]}
              </p>

              {/* expanded detail (smooth auto-height via grid-rows) */}
              <div
                aria-hidden={!expanded}
                className="grid"
                style={{
                  gridTemplateRows: expanded ? '1fr' : '0fr',
                  transition: reduce ? 'none' : 'grid-template-rows 240ms cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col items-start gap-[8px] pt-[6px]">
                   
                    
                    {r.tags && r.tags.length > 0 && (
                      <div className="mt-[2px] flex flex-wrap gap-[6px]">
                        {r.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-[7px] border border-solid border-black/[0.08] bg-white px-[8px] py-[3px] font-satoshi text-[11px] font-medium text-[#3a3a3a]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
