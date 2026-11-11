/**
 * Titles that point at each interactive thing on the board — the same treatment
 * as the "Things I love" heading (caveat eyebrow → bold title → pink hand-drawn
 * sweep) plus a little arrow aimed at the sticker. Positioned in composition
 * space: `cx` is the label's horizontal centre (line it up with the sticker's
 * centre), `top` its top edge. Sticker positions live in boardItems.ts — keep
 * the two in step when moving something.
 */
export type FeatureLabel = {
  /** Matches the board item it belongs to (for reference only). */
  id: string
  eyebrow: string
  title: string
  cx: number
  top: number
  /** Direction the arrow points, towards the sticker. Omit for no arrow. */
  arrow?: 'down' | 'up'
}

export const featureLabels: FeatureLabel[] = [
  // Works card at 192,330 (205 wide) → centre 294.
  { id: 'works', eyebrow: 'take a look', title: 'Works', cx: 244, top: 240, arrow: 'down' },
  // Runner frame at 985,60 (400 wide) → centre 1185; its head starts ≈ y 114.
  { id: 'running', eyebrow: 'a tiny game · press play', title: "Denesh's Run", cx: 1185, top: 0 },
  // Experience card at 1008,570 (335 wide) → centre 1176.
  { id: 'experience', eyebrow: 'the road so far', title: 'Experience', cx: 1276, top: 485, arrow: 'down' },
  // SysAdmin sticker at -330,920
  { id: 'law-student', eyebrow: 'beyond the screen', title: 'SysAdmin & Ops', cx: -140, top: 775, arrow: 'down' },
  // Tic-tac-toe note at 1262,1210 (136 wide) → centre 1330.
  { id: 'tictactoe', eyebrow: 'one game before you go', title: 'Tic-tac-toe', cx: 1430, top: 1340, arrow: 'down' },
]
