import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { emptyBoard, evaluate, houseMove, type Board, type Player } from './ticTacToeEngine'
import { gamesPlayed, readRecord, writeRecord, type TttRecord } from './ticTacToeRecord'
import { TicTacToeBoard } from './TicTacToeBoard'

const YOU: Player = 'X'
const HOUSE: Player = 'O'

// Post-game one-liners. `{games}` = "N game(s)" played so far, this one included.
// Rotated by game number so back-to-back games don't repeat a line.
const LOSE_LINES = [
  'Nice try. The house has not lost in {games}.',
  'So close. And yet — still undefeated.',
  'The house always wins. This one, anyway.',
  'Told you. {games}, zero losses.',
]
const DRAW_LINES = [
  'A draw is the best anyone has managed. Respect.',
  'Stalemate. You have clearly done this before.',
  'Even. The house is quietly impressed.',
  'Nobody wins — which, for the house, counts as a win.',
]

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const pick = (lines: string[], i: number, n: number) => lines[i % lines.length].replace('{games}', plural(n, 'game'))
const countMarks = (b: Board) => b.reduce((n, c) => n + (c ? 1 : 0), 0)

/** Three pulsing dots shown while the house "thinks". */
function Thinking() {
  return (
    <span className="ml-[2px] inline-flex gap-[3px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-[3px] w-[3px] rounded-full bg-current"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

/** Crossfades its child whenever `id` changes (heading / subtitle swaps). */
function Swap({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={id}
        className={className}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

interface Props {
  onClose: () => void
  /** Element to restore focus to on close (the tic-tac-toe sticker). */
  launcher: HTMLElement | null
}

/**
 * "One game before you go." — a full-screen tic-tac-toe against the house.
 * Fixed layer above the board (the board stays untouched underneath). You are
 * always X; who opens alternates each game. The house plays perfect minimax,
 * so the copy's promise — it has not lost yet — holds; the best you can do is
 * a draw, and the headline/subtitle/status react to how each game ends.
 */
export default function TicTacToeOverlay({ onClose, launcher }: Props) {
  const [visible, setVisible] = useState(true) // drives the enter/exit animation
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [game, setGame] = useState(0) // per-session game index; odd games the house opens
  const [record, setRecord] = useState<TttRecord>(readRecord)
  const [revealed, setRevealed] = useState(false) // result copy shown once the strike-through has drawn

  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current
  const dialogRef = useRef<HTMLDivElement>(null)

  const outcome = useMemo(() => evaluate(board), [board])
  const houseOpens = game % 2 === 1
  const houseTurn = !outcome && (countMarks(board) % 2 === 0) === houseOpens
  const yourTurn = !outcome && !houseTurn
  const games = gamesPlayed(record)

  const close = useCallback(() => setVisible(false), [])

  // ---- the house's turn: pause like a person would, then play ----
  useEffect(() => {
    if (!houseTurn) return
    const delay = reducedMotion ? 350 : 520 + Math.random() * 480
    const t = window.setTimeout(() => {
      setBoard((b) => {
        // Guard: still the house's move on a live board (StrictMode / stale-timer safety).
        if (evaluate(b) || (countMarks(b) % 2 === 0) !== houseOpens) return b
        const next = b.slice()
        next[houseMove(b, HOUSE)] = HOUSE
        return next
      })
    }, delay)
    return () => window.clearTimeout(t)
  }, [houseTurn, houseOpens, reducedMotion])

  // ---- game over: record it once per game… ----
  const recordedRef = useRef(-1)
  useEffect(() => {
    if (!outcome || recordedRef.current === game) return
    recordedRef.current = game
    setRecord((r) => {
      const n = { ...r }
      if (outcome.kind === 'draw') n.draws += 1
      else if (outcome.player === YOU) n.you += 1
      else n.house += 1
      writeRecord(n)
      return n
    })
  }, [outcome, game])

  // …and reveal the result copy once the last mark / strike-through has drawn.
  useEffect(() => {
    if (!outcome) {
      setRevealed(false)
      return
    }
    const t = window.setTimeout(() => setRevealed(true), reducedMotion ? 0 : 900)
    return () => window.clearTimeout(t)
  }, [outcome, reducedMotion])

  const play = useCallback((cell: number) => {
    setBoard((b) => {
      if (b[cell] || evaluate(b)) return b
      const next = b.slice()
      next[cell] = YOU
      return next
    })
  }, [])

  const again = useCallback(() => {
    setBoard(emptyBoard())
    setGame((g) => g + 1)
  }, [])

  // ---- focus: into the dialog on open; back to the sticker on unmount ----
  useEffect(() => {
    const t = window.setTimeout(() => dialogRef.current?.focus(), 60)
    return () => window.clearTimeout(t)
  }, [])
  useEffect(() => () => launcher?.focus?.(), [launcher])

  // Esc closes; Tab is trapped inside the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
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
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close])

  // ---- copy ----
  const result = outcome && revealed ? outcome : null
  const youWon = result?.kind === 'win' && result.player === YOU
  const houseWon = result?.kind === 'win' && result.player === HOUSE

  let headingKey = 'idle'
  let heading: ReactNode = (
    <>
      One game <em>before you go.</em>
    </>
  )
  let subtitle =
    games === 0
      ? 'Try beating me. The house has not lost yet.'
      : record.you === 0
        ? `Try beating me. The house has not lost in ${plural(games, 'game')}.`
        : `The house has lost ${plural(record.you, 'time')}. It would like a rematch.`

  if (houseWon) {
    headingKey = `lose-${game}`
    heading = (
      <>
        The house <em>wins{record.house > 1 ? ' again' : ''}.</em>
      </>
    )
    subtitle = pick(LOSE_LINES, game, games)
  } else if (result?.kind === 'draw') {
    headingKey = `draw-${game}`
    heading = (
      <>
        It&rsquo;s a <em>draw.</em>
      </>
    )
    subtitle = pick(DRAW_LINES, game, games)
  } else if (youWon) {
    headingKey = `win-${game}`
    heading = (
      <>
        Wait&hellip; <em>you won?</em>
      </>
    )
    subtitle = 'The house has lost. Screenshot this — nobody will believe you.'
  }

  const status = result
    ? `${result.kind === 'draw' ? 'Draw' : youWon ? 'You win' : 'House wins'} · game ${games}`
    : houseTurn
      ? 'You are X · my move'
      : outcome
        ? 'You are X' // the last mark is still drawing in
        : 'You are X · your move'

  return (
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[3000] overflow-y-auto bg-[#f9f8f4]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="One game before you go — tic-tac-toe against the house"
            tabIndex={-1}
            className="flex min-h-full flex-col items-center justify-center px-[20px] py-[64px] outline-none"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close the game and return to the board"
              className="fixed right-[20px] top-[18px] flex h-[40px] w-[40px] items-center justify-center rounded-full border border-black/10 bg-white/80 text-[#2b2a28] shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <motion.div
              className="flex w-full max-w-[640px] flex-col items-center text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.28, ease: 'easeOut', delay: 0.05 }}
            >
              <Swap id={headingKey}>
                <h2 className="font-instrument text-[clamp(40px,7.5vw,68px)] font-normal leading-[1.02] tracking-[-0.02em] text-[#111] [&_em]:italic">
                  {heading}
                </h2>
              </Swap>

              <Swap id={`${headingKey}-sub`} className="mt-[22px]">
                <p className="max-w-[460px] font-satoshi text-[17px] leading-[1.5] text-[#5c5c5c] max-[480px]:text-[15px]">
                  {subtitle}
                </p>
              </Swap>

              <p
                aria-live="polite"
                className="mt-[34px] flex min-h-[16px] items-center font-mono text-[12px] uppercase tracking-[2.6px] text-[#444]"
              >
                <span>{status}</span>
                {houseTurn && <Thinking />}
              </p>

              <div className="mt-[22px]">
                <TicTacToeBoard
                  board={board}
                  game={game}
                  yourTurn={yourTurn}
                  winLine={outcome?.kind === 'win' ? outcome.line : null}
                  winner={outcome?.kind === 'win' ? outcome.player : null}
                  reducedMotion={reducedMotion}
                  onPlay={play}
                />
              </div>

              <button
                type="button"
                onClick={again}
                className="mt-[30px] rounded-full border border-[#cdcdcd] bg-transparent px-[30px] py-[13px] font-satoshi text-[16px] font-medium text-[#555] transition-colors hover:border-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d] active:translate-y-[1px]"
              >
                Again
              </button>

              <p className="mt-[26px] font-mono text-[11px] uppercase tracking-[2px] text-[#9a9a9a]">
                <span className="tabular-nums">You {record.you}</span>
                <span className="mx-[8px] text-[#cfcfcf]">·</span>
                <span className="tabular-nums">Draws {record.draws}</span>
                <span className="mx-[8px] text-[#cfcfcf]">·</span>
                <span className="tabular-nums">House {record.house}</span>
              </p>

              <button
                type="button"
                onClick={close}
                className="mt-[10px] rounded-[6px] px-[8px] py-[4px] font-satoshi text-[13px] text-[#8a8a8a] underline-offset-[3px] transition-colors hover:text-[#111] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]"
              >
                &larr; back to the board
              </button>
            </motion.div>

            {/* Accessible, crawlable description (kept out of the visual UI). */}
            <p className="sr-only">
              Interactive tic-tac-toe game against an unbeatable computer opponent. You play X; pick an
              empty square to make your move. Part of a Full-Stack Developer portfolio.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
