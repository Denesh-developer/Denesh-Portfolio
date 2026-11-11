import { featureLabels, type FeatureLabel } from '../../data/featureLabels'

const LABEL_W = 300

/** Hand-drawn double chevron, aimed at the sticker. */
function Arrow({ dir }: { dir: 'down' | 'up' }) {
  return (
    <svg
      width="22"
      height="30"
      viewBox="0 0 22 30"
      fill="none"
      className={`mt-[8px] ${dir === 'up' ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path d="M3 3.5C5.5 6.5 8 9.5 11 12c3-2.5 5.5-5.5 8-8.5" stroke="#e8f5ee" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16c2.5 3 5 6 8 8.5 3-2.5 5.5-5.5 8-8.5" stroke="#e8f5ee" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * One feature title: caveat eyebrow → bold title → pink hand-drawn sweep →
 * arrow. Sized for a sticker.
 * The sweep stretches to roughly the title's width.
 */
function Label({ l }: { l: FeatureLabel }) {
  const sweepW = Math.min(230, Math.max(80, l.title.length * 17))
  return (
    <div
      className="absolute flex flex-col items-center text-center"
      style={{ left: l.cx - LABEL_W / 2, top: l.top, width: LABEL_W }}
    >
      <span className="font-caveat font-medium text-[24px] leading-none text-[#00ff9c] -rotate-2 whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,255,156,0.3)]">
        {l.eyebrow}
      </span>
      <h2 className="font-satoshi font-black text-[36px] leading-none tracking-[-1px] text-white mt-[7px] whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
        {l.title}
      </h2>
      <svg width={sweepW} height="10" viewBox="0 0 120 10" preserveAspectRatio="none" fill="none" className="mt-[7px]" aria-hidden>
        <path d="M3 6.5C22 2.5 50 2.5 70 4.5C87 6.2 105 5.2 117 3.2" stroke="#00ff9c" strokeWidth="3.6" strokeLinecap="round" opacity="0.85" />
      </svg>
      {l.arrow && <Arrow dir={l.arrow} />}
    </div>
  )
}

/**
 * All feature titles, in composition coordinates. Pointer-transparent so the
 * board pans when dragged over them (they're not draggable, unlike stickers).
 */
export function BoardLabels() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[6]" aria-hidden={false}>
      {featureLabels.map((l) => (
        <Label key={l.id} l={l} />
      ))}
    </div>
  )
}
