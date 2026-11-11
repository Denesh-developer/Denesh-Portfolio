import { memo } from 'react'
import { motion } from 'framer-motion'
import type { Board, Line, Player } from './ticTacToeEngine'

/** SVG user units — the board is drawn in a 360×360 box, three 120px cells. */
const SIZE = 360
const CELL = SIZE / 3

const INK = '#1e1e1e' // you (X)
const HOUSE_INK = '#7aa88d' // the house (O) — brand green
const GRID = '#6b6b6b'

// The four grid lines, drawn as gentle cubic curves that run a little past the
// cells so they read as pen strokes rather than ruled lines.
const GRID_STROKES = [
  'M 121 6 C 119 92, 122.5 200, 118.5 354',
  'M 239 5 C 242 118, 238 242, 241 355',
  'M 6 119 C 100 121.5, 222 118, 354 121.5',
  'M 5 241 C 118 238.5, 250 242, 355 239.5',
]

const center = (i: number) => ({ cx: (i % 3) * CELL + CELL / 2, cy: Math.floor(i / 3) * CELL + CELL / 2 })

// Deterministic per-mark "handwriting" wobble (rotation + nudge) so each mark
// sits a little differently but never jitters between renders.
function jitter(seed: number) {
  const h = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  const f = h - Math.floor(h)
  const g = Math.sin(seed * 39.3468 + 11.135) * 24634.6345
  const f2 = g - Math.floor(g)
  return { rot: (f - 0.5) * 14, dx: (f2 - 0.5) * 6, dy: (f - 0.5) * 5 }
}

const X_STROKES = (cx: number, cy: number) => [
  `M ${cx - 31} ${cy - 33} Q ${cx + 2} ${cy - 1} ${cx + 33} ${cy + 31}`,
  `M ${cx + 32} ${cy - 31} Q ${cx - 1} ${cy + 1} ${cx - 33} ${cy + 32}`,
]

// One continuous loop that overshoots its own start — the way a quick "O" is
// actually drawn.
const O_STROKE = (cx: number, cy: number) =>
  `M ${cx + 3} ${cy - 34} C ${cx + 23} ${cy - 34}, ${cx + 35} ${cy - 18}, ${cx + 34} ${cy + 2} ` +
  `C ${cx + 33} ${cy + 22}, ${cx + 17} ${cy + 35}, ${cx - 2} ${cy + 34} ` +
  `C ${cx - 22} ${cy + 33}, ${cx - 35} ${cy + 18}, ${cx - 34} ${cy - 2} ` +
  `C ${cx - 33} ${cy - 22}, ${cx - 19} ${cy - 36}, ${cx + 8} ${cy - 32}`

/** Strike-through for the winning line, extended past the outer cells. */
function winPath(line: Line) {
  const a = center(line[0])
  const b = center(line[2])
  const dx = b.cx - a.cx
  const dy = b.cy - a.cy
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  const ext = 26
  const x1 = a.cx - ux * ext
  const y1 = a.cy - uy * ext
  const x2 = b.cx + ux * ext
  const y2 = b.cy + uy * ext
  // control point nudged perpendicular for a slight bow
  const mx = (x1 + x2) / 2 - uy * 7
  const my = (y1 + y2) / 2 + ux * 7
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`
}

type MarkProps = { cell: number; player: Player; seed: number; animate: boolean }

function Mark({ cell, player, seed, animate }: MarkProps) {
  const { cx, cy } = center(cell)
  const j = jitter(seed)
  const stroke = player === 'X' ? INK : HOUSE_INK
  const draw = (delay: number) =>
    animate
      ? {
          initial: { pathLength: 0, opacity: 0.9 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration: 0.28, ease: 'easeOut' as const, delay },
        }
      : { initial: false as const }
  return (
    <g transform={`translate(${j.dx} ${j.dy}) rotate(${j.rot} ${cx} ${cy})`}>
      {player === 'X' ? (
        X_STROKES(cx, cy).map((d, i) => (
          <motion.path key={i} d={d} stroke={stroke} strokeWidth={6.5} strokeLinecap="round" fill="none" {...draw(i * 0.16)} />
        ))
      ) : (
        <motion.path d={O_STROKE(cx, cy)} stroke={stroke} strokeWidth={6.5} strokeLinecap="round" fill="none" {...draw(0)} />
      )}
    </g>
  )
}

type Props = {
  board: Board
  /** Bumps per game so marks re-mount (and re-animate) on "Again". */
  game: number
  /** True while it's the visitor's turn and the board is still live. */
  yourTurn: boolean
  winLine: Line | null
  winner: Player | null
  reducedMotion: boolean
  onPlay: (cell: number) => void
}

const ROW_COL = (i: number) => `row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}`

/**
 * The hand-drawn grid plus a transparent 3×3 button layer for input. Marks are
 * keyed by game + cell, so a new mark mounts (and draws itself in) exactly once.
 */
export const TicTacToeBoard = memo(function TicTacToeBoard({
  board,
  game,
  yourTurn,
  winLine,
  winner,
  reducedMotion,
  onPlay,
}: Props) {
  const animate = !reducedMotion
  return (
    <div
      className="relative aspect-square w-[min(380px,84vw)] select-none"
      role="grid"
      aria-label="Tic-tac-toe board"
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden
      >
        {GRID_STROKES.map((d) => (
          <path key={d} d={d} stroke={GRID} strokeWidth={5.5} strokeLinecap="round" fill="none" />
        ))}
        {board.map((v, i) =>
          v ? <Mark key={`${game}-${i}`} cell={i} player={v} seed={game * 9 + i + 1} animate={animate} /> : null,
        )}
        {winLine && winner && (
          <motion.path
            key={`win-${game}`}
            d={winPath(winLine)}
            stroke={winner === 'X' ? INK : HOUSE_INK}
            strokeWidth={7}
            strokeLinecap="round"
            fill="none"
            opacity={0.9}
            initial={animate ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, ease: 'easeInOut', delay: animate ? 0.35 : 0 }}
          />
        )}
      </svg>

      {/* input layer */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3" role="row">
        {board.map((v, i) => {
          const filled = !!v
          const playable = !filled && yourTurn
          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              aria-label={filled ? `${ROW_COL(i)}: ${v === 'X' ? 'your X' : "the house's O"}` : `${ROW_COL(i)}: empty`}
              aria-disabled={!playable || undefined}
              disabled={filled}
              onClick={() => playable && onPlay(i)}
              className={[
                'group relative m-[6px] rounded-[10px] border-0 bg-transparent p-0 outline-none',
                'focus-visible:[box-shadow:0_0_0_2px_#7aa88d]',
                playable ? 'cursor-pointer' : 'cursor-default',
              ].join(' ')}
            >
              {/* faint ghost X on hover — only while it's your move */}
              {playable && (
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-150 group-hover:opacity-[0.16] group-focus-visible:opacity-[0.16]"
                  viewBox="0 0 100 100"
                  aria-hidden
                >
                  <path d="M 24 24 L 76 76 M 76 24 L 24 76" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
})
