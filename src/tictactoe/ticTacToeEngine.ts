/**
 * Pure tic-tac-toe rules + the house's brain. No React, no DOM.
 *
 * The house plays perfect minimax, so it can never lose — the best a visitor
 * can force is a draw ("the house has not lost yet" is a promise the code
 * keeps). Ties between equally-good moves are broken at random so games don't
 * play out identically every time.
 */
export type Player = 'X' | 'O'
export type Cell = Player | null
/** Nine cells, row-major (0 = top-left, 8 = bottom-right). */
export type Board = Cell[]
export type Line = readonly [number, number, number]

export const LINES: readonly Line[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export const emptyBoard = (): Board => Array<Cell>(9).fill(null)

export type Outcome = { kind: 'win'; player: Player; line: Line } | { kind: 'draw' } | null

/** Winner + winning line, a draw once the board is full, or null while play continues. */
export function evaluate(board: Board): Outcome {
  for (const line of LINES) {
    const [a, b, c] = line
    const v = board[a]
    if (v && v === board[b] && v === board[c]) return { kind: 'win', player: v, line }
  }
  return board.every(Boolean) ? { kind: 'draw' } : null
}

export const other = (p: Player): Player => (p === 'X' ? 'O' : 'X')

// Minimax with alpha-beta, scored from the house's point of view. Depth-aware
// so the house takes the quickest win and, when cornered, the slowest loss.
function score(board: Board, turn: Player, house: Player, depth: number, alpha: number, beta: number): number {
  const out = evaluate(board)
  if (out) {
    if (out.kind === 'draw') return 0
    return out.player === house ? 10 - depth : depth - 10
  }
  const maximizing = turn === house
  let best = maximizing ? -Infinity : Infinity
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue
    board[i] = turn
    const s = score(board, other(turn), house, depth + 1, alpha, beta)
    board[i] = null
    if (maximizing) {
      best = Math.max(best, s)
      alpha = Math.max(alpha, s)
    } else {
      best = Math.min(best, s)
      beta = Math.min(beta, s)
    }
    if (beta <= alpha) break
  }
  return best
}

/** The house's move for `board` (index 0–8). Perfect play; random among equals. */
export function houseMove(board: Board, house: Player, rng: () => number = Math.random): number {
  const empties: number[] = []
  board.forEach((c, i) => {
    if (!c) empties.push(i)
  })
  if (empties.length === 9) {
    // Opening move: centre and corners are all perfect — vary the opening.
    const openers = [0, 2, 4, 6, 8]
    return openers[Math.floor(rng() * openers.length)]
  }
  const work = board.slice()
  let bestScore = -Infinity
  let best: number[] = []
  for (const i of empties) {
    work[i] = house
    // Fresh alpha/beta per root move so every candidate gets an exact score
    // (needed to detect ties for the random tie-break).
    const s = score(work, other(house), house, 1, -Infinity, Infinity)
    work[i] = null
    if (s > bestScore) {
      bestScore = s
      best = [i]
    } else if (s === bestScore) {
      best.push(i)
    }
  }
  return best[Math.floor(rng() * best.length)]
}
