import type { CSSProperties } from 'react'

type Props = {
  /** Cover art for the label; omit for a plain (sleeve-peek) record. */
  artwork?: string
  spinning?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * A vinyl record drawn entirely in CSS: grooves + label rotate as one layer,
 * while the light reflection (sheen) stays fixed on top — like a real record
 * under a lamp. Sized by whatever width/height the parent gives it (keep them
 * equal) and positioned by the caller's className (pass `relative` or
 * `absolute …`). The spin animation runs continuously and is merely PAUSED
 * when not playing, so the label never snaps back to 12 o'clock.
 */
export function Vinyl({ artwork, spinning = false, className = '', style }: Props) {
  return (
    <div className={`rounded-full shadow-[0_28px_60px_-18px_rgba(0,0,0,0.55)] ${className}`} style={style}>
      <div
        className="or-grooves absolute inset-0 rounded-full animate-[or-spin_1.9s_linear_infinite] motion-reduce:[animation:none]"
        style={{ animationPlayState: spinning ? 'running' : 'paused' }}
      >
        {/* label */}
        <div
          className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-[#2a2a2a] shadow-[inset_0_0_0_1.5px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.05)]"
        >
          {artwork && (
            <img src={artwork} alt="" draggable={false} className="h-full w-full object-cover [-webkit-user-drag:none]" />
          )}
          {/* spindle hole */}
          <div className="absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f3f0e9] shadow-[inset_0_1px_3px_rgba(0,0,0,0.45)]" />
        </div>
      </div>
      <div className="or-sheen pointer-events-none absolute inset-0 rounded-full" />
    </div>
  )
}
