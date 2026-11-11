// Logical size of the original Figma "Home" composition.
export const CONTENT_W = 1440
export const CONTENT_H = 1680

// The virtual board is larger than the composition so there is empty grid
// canvas to pan into (Figma-like). The composition is centered inside it.
export const VIRTUAL_W = 2560
export const VIRTUAL_H = 2400
export const CONTENT_OFFSET_X = Math.round((VIRTUAL_W - CONTENT_W) / 2) // 560
export const CONTENT_OFFSET_Y = Math.round((VIRTUAL_H - CONTENT_H) / 2) // 465

// Zoom limits (kept tight so the board doesn't zoom in too far).
export const MIN_SCALE = 0.5
export const MAX_SCALE = 1.8

// Grid.
export const GRID_MINOR = 32
export const GRID_MAJOR = 160

// The transform that fits the whole composition into the viewport. Shared by
// the initial render (so the board opens AT this level — no initial-scale flash)
// and the Fit/Reset buttons, so "open/refresh" and "Fit" always match exactly.
//
// Horizontally the composition is centered. Vertically it is centered ONLY while
// it fully fits; once the content is taller than the viewport (the common case,
// since MIN_SCALE clamps the zoom at 0.5) it is TOP-anchored with a small pad so
// the hero/works never get clipped off the top — the extra height below (the
// "Things I love" closing section) simply falls just past the fold, ready to be
// panned to. This keeps the "open = Fit" framing hero-first and stable no matter
// how tall the board grows.
export function computeFitTransform(vw: number, vh: number) {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  const pad = Math.min(vw, vh) < 640 ? 24 : 96
  const topPad = Math.min(vw, vh) < 640 ? 16 : 48
  const scale = clamp(Math.min((vw - pad) / CONTENT_W, (vh - pad) / CONTENT_H), MIN_SCALE, MAX_SCALE)
  const x = (vw - CONTENT_W * scale) / 2 - CONTENT_OFFSET_X * scale
  const centerY = (vh - CONTENT_H * scale) / 2 - CONTENT_OFFSET_Y * scale
  const topY = topPad - CONTENT_OFFSET_Y * scale
  // max() picks centering while it fits (centerY is the larger, higher value) and
  // the top-anchor once the content overflows (centerY goes negative).
  const y = Math.max(centerY, topY)
  return { x, y, scale }
}

// Movement (in screen px) before a pointer press is treated as a drag
// rather than a click.
export const DRAG_THRESHOLD = 4

// Persist dragged sticker positions across reloads. Off by default.
export const FEATURE_PERSIST_POSITIONS = false
export const PERSIST_KEY = 'denesh-board-positions-v1'
