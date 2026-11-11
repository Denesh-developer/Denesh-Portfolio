import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GameCanvas, type GameCanvasHandle } from './GameCanvas'
import { loadGameAssets, type GameAssets } from './gameAssets'
import type { GameStatus, HudStats } from './gameTypes'

const BEST_KEY = 'denesh-run-best-v1'
const MUTED_KEY = 'denesh-run-muted-v1'

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(6, '0')

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}
function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1'
  } catch {
    return false
  }
}

/** A small keyboard-key chip used in the controls card + start hint. */
function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[20px] items-center justify-center rounded-[5px] border border-black/25 border-b-[3px] bg-white px-[5px] py-[1px] font-satoshi text-[11px] font-bold leading-[1.4] text-[#2b2a28]">
      {children}
    </kbd>
  )
}

function Btn({
  children,
  onClick,
  variant = 'primary',
  autoFocus,
}: {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'ghost'
  autoFocus?: boolean
}) {
  const base =
    'inline-flex items-center gap-[8px] rounded-[10px] px-[16px] py-[9px] text-[13px] font-semibold cursor-pointer transition-colors active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]'
  const look =
    variant === 'primary'
      ? 'bg-[#2b2a28] text-[#f6f1e7] hover:bg-[#3d3a36] border border-[#2b2a28]'
      : 'bg-transparent text-[#2b2a28] hover:bg-black/5 border border-[#2b2a28]/35'
  return (
    <button type="button" className={`${base} ${look}`} onClick={onClick} data-autofocus={autoFocus || undefined}>
      {children}
    </button>
  )
}

interface Props {
  onClose: () => void
  /** Element to restore focus to on close (the running sticker). */
  launcher: HTMLElement | null
}

/**
 * Full-screen game overlay. The portfolio board stays mounted, unchanged,
 * underneath — this is a fixed layer above it. Owns game UI state (status,
 * score, best, muted) and the surrounding accessible chrome; all per-frame work
 * lives in the engine behind <GameCanvas>.
 */
export default function GameOverlay({ onClose, launcher }: Props) {
  const [visible, setVisible] = useState(true) // drives the enter/exit animation
  const [assets, setAssets] = useState<GameAssets | null>(null)
  const [status, setStatus] = useState<GameStatus>('START')
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(0)
  const [distance, setDistance] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [best, setBest] = useState(readBest)
  const [muted, setMuted] = useState(readMuted)
  const [lastNewBest, setLastNewBest] = useState(false)

  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current
  const isTouch = useRef(
    typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches,
  ).current

  const gameRef = useRef<GameCanvasHandle>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const bestRef = useRef(best)
  useEffect(() => {
    bestRef.current = best
  }, [best])

  const close = useCallback(() => setVisible(false), [])

  // Preload sprites, then reveal the game.
  useEffect(() => {
    let alive = true
    loadGameAssets().then((a) => {
      if (alive) setAssets(a)
    })
    return () => {
      alive = false
    }
  }, [])

  // Lock body scroll while open; restore on close.
  useEffect(() => {
    const body = document.body
    const prevOverflow = body.style.overflow
    const prevOverscroll = body.style.overscrollBehavior
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    return () => {
      body.style.overflow = prevOverflow
      body.style.overscrollBehavior = prevOverscroll
    }
  }, [])

  // Focus into the dialog once ready; restore focus to the launcher on unmount.
  useEffect(() => {
    if (!assets) return
    const t = window.setTimeout(() => {
      const el =
        dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? dialogRef.current
      el?.focus()
    }, 60)
    return () => window.clearTimeout(t)
  }, [assets, status])

  useEffect(
    () => () => {
      // On unmount, return focus to the running sticker.
      launcher?.focus?.()
    },
    [launcher],
  )

  // Tab focus trap (Space/Arrows/P/R/Esc are handled by the engine input layer).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
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
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // ---- engine callbacks (stable) ----
  const handleScore = useCallback((s: HudStats) => {
    setScore(s.score)
    setCoins(s.coins)
    setDistance(s.distance)
    setMultiplier(s.multiplier)
  }, [])
  const handleGameOver = useCallback((s: HudStats) => {
    setScore(s.score)
    setDistance(s.distance)
    const beat = s.score > 0 && s.score > bestRef.current
    setLastNewBest(beat)
    if (beat) {
      bestRef.current = s.score
      setBest(s.score)
      gameRef.current?.playNewBest()
      try {
        localStorage.setItem(BEST_KEY, String(s.score))
      } catch {
        /* ignore */
      }
    }
  }, [])
  const handleStatus = useCallback((s: GameStatus) => setStatus(s), [])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      gameRef.current?.setMuted(next)
      try {
        localStorage.setItem(MUTED_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const startLabel = isTouch ? 'Tap to start' : 'Press Space to start'

  return (
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-[rgba(24,22,19,0.68)] p-[16px] [backdrop-filter:blur(3px)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Denesh's Run — a pixel-art running mini game"
            data-status={status}
            tabIndex={-1}
            className="flex w-fit max-w-[97vw] flex-col gap-[12px] rounded-[16px] border border-black/10 bg-[#f6f1e7] p-[14px] shadow-[0_24px_70px_rgba(0,0,0,0.45)] outline-none sm:p-[18px]"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* ---- header ---- */}
            <div className="flex w-full items-center justify-between gap-[12px]">
              <div className="min-w-0">
                <h2 className="font-aeonik text-[19px] font-bold leading-none text-[#2b2a28] sm:text-[22px]">
                  Denesh&rsquo;s Run
                </h2>
                <p className="mt-[4px] truncate font-satoshi text-[11px] text-[#8a8375]">
                  A tiny game hidden inside my portfolio.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-[8px]">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-pressed={muted}
                  aria-label={muted ? 'Unmute game sound' : 'Mute game sound'}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-black/10 bg-white/80 text-[15px] shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]"
                >
                  <span aria-hidden>{muted ? '🔇' : '🔊'}</span>
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close game and return to portfolio"
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-black/10 bg-white/80 text-[#2b2a28] shadow-[0_2px_6px_rgba(0,0,0,0.12)] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ---- screen (fixed 16:9; sized to fit both viewport dimensions) ---- */}
            <div
              className="relative overflow-hidden rounded-[12px] border-2 border-[#2b2a28]/85 bg-[#eaf0f1] shadow-[inset_0_2px_10px_rgba(0,0,0,0.12)]"
              style={{ width: 'min(94vw, calc((92vh - 176px) * 16 / 9))', aspectRatio: '16 / 9' }}
            >
              {assets ? (
                <GameCanvas
                  ref={gameRef}
                  assets={assets}
                  reducedMotion={reducedMotion}
                  muted={muted}
                  onScore={handleScore}
                  onGameOver={handleGameOver}
                  onStatusChange={handleStatus}
                  onRequestClose={close}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-satoshi text-[13px] text-[#6b7280]">
                  Loading…
                </div>
              )}

              {/* ---- desktop controls card (corner, compact) ---- */}
              <div className="pointer-events-none absolute bottom-[10px] left-[10px] hidden select-none rounded-[9px] border border-black/10 bg-[rgba(246,241,231,0.82)] px-[10px] py-[8px] text-[11px] leading-[1.9] text-[#2b2a28] shadow-[0_2px_8px_rgba(0,0,0,0.12)] [backdrop-filter:blur(2px)] [@media(hover:hover)]:block">
                <div className="mb-[3px] font-satoshi text-[9px] font-bold uppercase tracking-[1.2px] text-[#8a8375]">
                  Controls
                </div>
                <div className="flex items-center gap-[6px]">
                  <Key>Space</Key>
                  <Key>↑</Key>
                  <span>Jump</span>
                </div>
                <div className="flex items-center gap-[6px]">
                  <Key>P</Key>
                  <span>Pause</span>
                  <span className="mx-[2px] text-black/20">·</span>
                  <Key>R</Key>
                  <span>Restart</span>
                </div>
                <div className="flex items-center gap-[6px]">
                  <Key>Esc</Key>
                  <span>Pause / Close</span>
                </div>
              </div>

              {/* ---- mobile jump hint ---- */}
              {(status === 'START' || status === 'PLAYING') && (
                <div className="pointer-events-none absolute bottom-[10px] left-1/2 -translate-x-1/2 select-none rounded-full border border-black/10 bg-[rgba(246,241,231,0.85)] px-[12px] py-[5px] font-satoshi text-[11px] font-semibold text-[#2b2a28] shadow-[0_2px_8px_rgba(0,0,0,0.14)] [@media(hover:hover)]:hidden">
                  TAP to jump
                </div>
              )}

              {/* ---- START ---- */}
              {status === 'START' && assets && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-[10px] bg-gradient-to-b from-black/10 via-transparent to-black/35 px-[16px] text-center">
                  <h3 className="font-aeonik text-[clamp(24px,5vw,44px)] font-bold uppercase tracking-[2px] text-[#f6f1e7] [text-shadow:0_3px_0_rgba(0,0,0,0.35)]">
                    Denesh&rsquo;s Run
                  </h3>
                  <p className="font-satoshi text-[13px] font-semibold uppercase tracking-[3px] text-[#f6f1e7]/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                    Run. Build. Repeat.
                  </p>
                  <Btn onClick={() => gameRef.current?.start()} autoFocus>
                    ▶ {startLabel}
                  </Btn>
                  <p className="max-w-[420px] font-satoshi text-[11px] text-[#f6f1e7]/75 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                    Jump the obstacles · grab the coffee · don&rsquo;t crash
                  </p>
                </div>
              )}

              {/* ---- PAUSED ---- */}
              {status === 'PAUSED' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-[14px] bg-[rgba(20,18,15,0.5)] px-[16px] text-center [backdrop-filter:blur(2px)]">
                  <h3 className="font-aeonik text-[32px] font-bold uppercase tracking-[3px] text-[#f6f1e7]">
                    Paused
                  </h3>
                  <div className="flex flex-wrap items-center justify-center gap-[10px]">
                    <Btn onClick={() => gameRef.current?.resume()} autoFocus>
                      Resume <Key>P</Key>
                    </Btn>
                    <Btn variant="ghost" onClick={() => gameRef.current?.restart()}>
                      <span className="text-[#f6f1e7]">Restart</span> <Key>R</Key>
                    </Btn>
                    <Btn variant="ghost" onClick={close}>
                      <span className="text-[#f6f1e7]">Back</span> <Key>Esc</Key>
                    </Btn>
                  </div>
                </div>
              )}

              {/* ---- GAME OVER ---- */}
              {status === 'GAME_OVER' && assets && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-[10px] bg-[rgba(20,18,15,0.58)] px-[16px] text-center [backdrop-filter:blur(2px)]">
                  <img
                    src="/game/player/hi.png"
                    alt=""
                    aria-hidden
                    className="h-[74px] w-auto drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
                  />
                  <h3
                    aria-live="polite"
                    className="font-aeonik text-[30px] font-bold uppercase tracking-[2px] text-[#f6f1e7] [text-shadow:0_2px_0_rgba(0,0,0,0.35)]"
                  >
                    Game Over
                  </h3>
                  {lastNewBest && (
                    <span className="rounded-full bg-[#7aa88d] px-[10px] py-[3px] font-satoshi text-[11px] font-bold uppercase tracking-[1px] text-white">
                      New best!
                    </span>
                  )}
                  <div className="font-satoshi text-[13px] text-[#f6f1e7]">
                    <span className="tabular-nums">Score {pad(score)}</span>
                    <span className="mx-[7px] text-white/40">·</span>
                    <span className="tabular-nums">Dist {distance}m</span>
                    <span className="mx-[7px] text-white/40">·</span>
                    <span className="tabular-nums">Best {pad(best)}</span>
                    {coins > 0 && (
                      <>
                        <span className="mx-[7px] text-white/40">·</span>
                        <span aria-label={`${coins} coffees collected`}>☕ {coins}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-[2px] flex flex-wrap items-center justify-center gap-[10px]">
                    <Btn onClick={() => gameRef.current?.restart()} autoFocus>
                      Run again <Key>R</Key>
                    </Btn>
                    <Btn variant="ghost" onClick={close}>
                      <span className="text-[#f6f1e7]">Exit</span> <Key>Esc</Key>
                    </Btn>
                  </div>
                </div>
              )}
            </div>

            {/* ---- footer HUD ---- */}
            <div className="flex w-full items-center justify-between gap-[8px] px-[4px] font-satoshi text-[12px] font-semibold text-[#5f594e]">
              <span className="tabular-nums tracking-[0.5px]">
                <span className="text-[#8a8375]">SCORE</span> {pad(score)}
              </span>
              <span className="flex items-center gap-[8px] tabular-nums">
                <span>
                  <span className="text-[#8a8375]">DIST</span> {distance}m
                </span>
                <span className="text-[#8a8375]">
                  ☕ {coins}
                  {multiplier > 1 && <span className="text-brand"> ×{multiplier.toFixed(1)}</span>}
                </span>
              </span>
              <span className="tabular-nums tracking-[0.5px]">
                <span className="text-[#8a8375]">BEST</span> {pad(best)}
              </span>
            </div>

            {/* Accessible, crawlable description (kept out of the visual game UI). */}
            <p className="sr-only">
              Interactive pixel-art running game. Press space, the up arrow, or tap the screen to make
              the character jump over obstacles and collect coffee. Part of a Full-Stack Developer
              portfolio.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
