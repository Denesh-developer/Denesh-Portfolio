import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react'
import type { GameAssets } from './gameAssets'
import { GameEngine } from './gameEngine'
import { installGameInput } from './gameInput'
import type { GameStatus, HudStats } from './gameTypes'

/**
 * Presentational canvas + engine host. It creates exactly one GameEngine, wires
 * input and a ResizeObserver to it, and tears everything down on unmount so no
 * rAF loop, listener, or AudioContext survives a close. React talks to the
 * engine only through the imperative handle below (never per-frame props).
 */
export interface GameCanvasHandle {
  start(): void
  restart(): void
  pause(): void
  resume(): void
  togglePause(): void
  jump(): void
  setMuted(muted: boolean): void
  playNewBest(): void
}

interface Props {
  assets: GameAssets
  reducedMotion: boolean
  muted: boolean
  onScore: (stats: HudStats) => void
  onGameOver: (stats: HudStats) => void
  onStatusChange: (status: GameStatus) => void
  /** Esc from START/PAUSED/GAME_OVER, or programmatic close. */
  onRequestClose: () => void
}

const GameCanvasInner = forwardRef<GameCanvasHandle, Props>(function GameCanvas(
  { assets, reducedMotion, muted, onScore, onGameOver, onStatusChange, onRequestClose },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)

  // Latest callbacks kept in a ref so the engine is created exactly once.
  const cb = useRef({ onScore, onGameOver, onStatusChange, onRequestClose })
  cb.current = { onScore, onGameOver, onStatusChange, onRequestClose }
  const initial = useRef({ muted, reducedMotion })

  useImperativeHandle(
    ref,
    () => ({
      start: () => engineRef.current?.start(),
      restart: () => engineRef.current?.restart(),
      pause: () => engineRef.current?.pause(),
      resume: () => engineRef.current?.resume(),
      togglePause: () => engineRef.current?.togglePause(),
      jump: () => engineRef.current?.jump(),
      setMuted: (m: boolean) => engineRef.current?.setMuted(m),
      playNewBest: () => engineRef.current?.playNewBest(),
    }),
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new GameEngine(
      canvas,
      assets,
      {
        onScore: (s) => cb.current.onScore(s),
        onGameOver: (s) => cb.current.onGameOver(s),
        onStatusChange: (s) => cb.current.onStatusChange(s),
      },
      { muted: initial.current.muted, reducedMotion: initial.current.reducedMotion },
    )
    engineRef.current = engine

    // Dev-only handle for automated tests (tree-shaken from production builds).
    const DEV = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV
    if (DEV) (window as unknown as { __deneshRun?: GameEngine }).__deneshRun = engine

    const removeInput = installGameInput(canvas, {
      onPrimary: () => {
        const st = engine.getStatus()
        if (st === 'START') engine.start()
        else if (st === 'PLAYING') engine.jump()
        else if (st === 'PAUSED') engine.resume()
        else if (st === 'GAME_OVER') engine.restart()
      },
      onPauseToggle: () => engine.togglePause(),
      onRestart: () => engine.restart(),
      onEscape: () => {
        if (engine.getStatus() === 'PLAYING') engine.pause()
        else cb.current.onRequestClose()
      },
    })

    const ro = new ResizeObserver(() => engine.resize())
    ro.observe(canvas)
    const onWinResize = () => engine.resize()
    window.addEventListener('resize', onWinResize)

    return () => {
      removeInput()
      ro.disconnect()
      window.removeEventListener('resize', onWinResize)
      engine.destroy()
      engineRef.current = null
      if (DEV) delete (window as unknown as { __deneshRun?: GameEngine }).__deneshRun
    }
  }, [assets])

  useEffect(() => {
    engineRef.current?.setReducedMotion(reducedMotion)
  }, [reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full rounded-[10px]"
      style={{ touchAction: 'none' }}
      aria-hidden="true"
    />
  )
})

/** Memoized so the throttled per-second HUD score updates never reconcile the canvas. */
export const GameCanvas = memo(GameCanvasInner)
