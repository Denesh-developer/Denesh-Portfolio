import { useCallback, useRef, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import type { BoardItemConfig } from '../../data/boardItems'
import { useBoard } from '../../board/BoardContext'
import {
  DRAG_THRESHOLD,
  FEATURE_PERSIST_POSITIONS,
  PERSIST_KEY,
} from '../../board/constants'
import { FrameAnimation } from '../animation/FrameAnimation'
import { preloadGameAssets } from '../../game/gameAssets'
import { useMusicDeck } from '../../music/MusicContext'
import {
  type AnimationFrameDefinition,
  type FrameIntrinsic,
  CODING_FRAME_INTRINSIC,
  RUNNING_FRAME_INTRINSIC,
  DJ_FRAME_INTRINSIC,
  codingIdleFrame,
  codingGreetingFrames,
  runningIdleFrame,
  runningIdleFrames,
  runningGreetingFrames,
  djIdleFrame,
  djWaveFrames,
  djPerformanceFrames,
} from '../../data/characterAnimations'

type CharacterConfig = {
  idleFrame: string
  restLoop?: AnimationFrameDefinition[]
  hoverSequence?: AnimationFrameDefinition[]
  activeLoop?: AnimationFrameDefinition[]
  intrinsic: FrameIntrinsic
}

const CHARACTER_ANIMATION: Record<'coding' | 'running' | 'dj', CharacterConfig> = {
  coding: {
    idleFrame: codingIdleFrame,
    hoverSequence: codingGreetingFrames,
    intrinsic: CODING_FRAME_INTRINSIC,
  },
  running: {
    idleFrame: runningIdleFrame,
    restLoop: runningIdleFrames,
    hoverSequence: runningGreetingFrames,
    intrinsic: RUNNING_FRAME_INTRINSIC,
  },
  dj: {
    idleFrame: djIdleFrame,
    hoverSequence: djWaveFrames,
    activeLoop: djPerformanceFrames,
    intrinsic: DJ_FRAME_INTRINSIC,
  },
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  ox: number
  oy: number
  moved: boolean
}

function loadOffset(id: string): { x: number; y: number } | null {
  if (!FEATURE_PERSIST_POSITIONS) return null
  try {
    const all = JSON.parse(localStorage.getItem(PERSIST_KEY) || '{}')
    return all[id] ?? null
  } catch {
    return null
  }
}

function saveOffset(id: string, x: number, y: number) {
  if (!FEATURE_PERSIST_POSITIONS) return
  try {
    const all = JSON.parse(localStorage.getItem(PERSIST_KEY) || '{}')
    all[id] = { x, y }
    localStorage.setItem(PERSIST_KEY, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}

export function BoardItem({ item }: { item: BoardItemConfig }) {
  const { scaleRef, spacePanning, reducedMotion, bringToFront, getZ, openProject, openGame, openWorks, openExperience, openResume, openLaw, openMovies, openTicTacToe } =
    useBoard()
  // Light music slice — only re-renders on play/pause + open/close, never on the
  // per-second playhead, so the board stays cheap during playback.
  const { playing: musicPlaying, openMusic } = useMusicDeck()
  const rootRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const initial = loadOffset(item.id)
  const x = useMotionValue(initial?.x ?? 0)
  const y = useMotionValue(initial?.y ?? 0)

  const [dragging, setDragging] = useState(false)
  const [pressed, setPressed] = useState(false)

  const activate = useCallback(() => {
    if (item.id === 'works') {
      // The Works card opens the project gallery (not a single case study).
      openWorks(rootRef.current)
    } else if (item.id === 'experience') {
      // The Experience card opens the redesigned timeline modal.
      openExperience(rootRef.current)
    } else if (item.type === 'project' && item.projectId) {
      openProject(item.projectId, rootRef.current)
    } else if (item.id === 'running') {
      // Genuine click on the runner → launch the game (dragging is filtered out
      // by the click-vs-drag threshold in endDrag). Pass the node for focus restore.
      openGame(rootRef.current)
    } else if (item.id === 'dj') {
      // Genuine click on the DJ → open the "On repeat" player (drag is filtered out below).
      openMusic(rootRef.current)
    } else if (item.id === 'resume') {
      // Genuine click on the résumé sticker → open the full PDF viewer.
      openResume(rootRef.current)
    } else if (item.id === 'law-student') {
      // Genuine click on the law-student sticker → open the "other side of me" modal.
      openLaw(rootRef.current)
    } else if (item.id === 'movies' || item.id === 'one-more-episode') {
      // Genuine click on the Netflix sticker → open "From my watchlist".
      openMovies(rootRef.current)
    } else if (item.id === 'tictactoe') {
      // Genuine click on the tic-tac-toe note → "One game before you go".
      openTicTacToe(rootRef.current)
    }
  }, [item, openProject, openGame, openWorks, openExperience, openMusic, openResume, openLaw, openMovies, openTicTacToe])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Space+drag pans the whole board; don't hijack the press.
    if (!item.draggable || spacePanning) return
    e.stopPropagation() // keep react-zoom-pan-pinch from starting a pan
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      ox: x.get(),
      oy: y.get(),
      moved: false,
    }
    setPressed(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d || e.pointerId !== d.pointerId) return
    const dxScreen = e.clientX - d.startX
    const dyScreen = e.clientY - d.startY
    if (!d.moved && Math.hypot(dxScreen, dyScreen) > DRAG_THRESHOLD) {
      d.moved = true
      setDragging(true)
      bringToFront(item.id)
    }
    if (d.moved) {
      const s = scaleRef.current || 1
      x.set(d.ox + dxScreen / s)
      y.set(d.oy + dyScreen / s)
    }
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d || e.pointerId !== d.pointerId) return
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    dragRef.current = null
    setPressed(false)
    setDragging(false)
    if (d.moved) {
      saveOffset(item.id, x.get(), y.get())
    } else if (item.interactive) {
      activate() // real click (no movement past threshold)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!item.interactive) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      activate()
    }
  }

  // Hover presets — applied only while NOT dragging (mirrors `:not(.is-dragging)`
  // in the old CSS). Tailwind's `hover:` is already gated to `@media (hover:hover)`.
  const preset = item.hoverPreset && item.hoverPreset !== 'none' ? item.hoverPreset : ''
  const hoverClasses = dragging
    ? ''
    : preset === 'lift'
      ? 'hover:-translate-y-[8px] hover:scale-[1.035] hover:drop-shadow-[0_12px_16px_rgba(0,0,0,0.2)]'
      : preset === 'tilt'
        ? 'hover:rotate-[2deg] hover:scale-[1.025]'
        : preset === 'glow'
          ? 'hover:[filter:drop-shadow(0_0_10px_rgba(122,168,141,0.7))_drop-shadow(0_6px_10px_rgba(0,0,0,0.18))]'
          : preset === 'bounce'
            ? 'hover:animate-bounce-once motion-reduce:hover:animate-none'
            : ''

  const charCfg =
    item.type === 'animated' && item.character ? CHARACTER_ANIMATION[item.character] : null

  const content =
    charCfg ? (
      <FrameAnimation
        idleFrame={charCfg.idleFrame}
        restLoop={charCfg.restLoop}
        hoverSequence={charCfg.hoverSequence}
        activeLoop={charCfg.activeLoop}
        active={item.id === 'dj' ? musicPlaying : false}
        playbackEnabled={!dragging}
        reducedMotion={reducedMotion}
        // Interactive characters are labelled by the wrapper's role="button"
        // aria-label, so the inner frames stay decorative (no double announce).
        alt={item.interactive ? '' : item.alt ?? ''}
        intrinsicWidth={charCfg.intrinsic.width}
        intrinsicHeight={charCfg.intrinsic.height}
      />
    ) : (
      <img
        src={item.src}
        alt={item.type === 'decorative' || item.interactive ? '' : item.alt ?? ''}
        draggable={false}
        className="pointer-events-none [-webkit-user-drag:none]"
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    )

  return (
    <motion.div
      ref={rootRef}
      id={`board-item-${item.id}`}
      className={[
        // functional: react-zoom-pan-pinch pan-exclusion selector — keep verbatim
        item.draggable || item.interactive ? 'no-pan' : '',
        // base sticker look
        'select-none [-webkit-user-drag:none] motion-reduce:transition-none motion-reduce:animate-none',
        // drop shadow (higher while dragging); mutually exclusive to avoid a filter clash
        dragging
          ? 'drop-shadow-[0_14px_20px_rgba(0,0,0,0.22)]'
          : 'drop-shadow-[0_2px_3px_rgba(0,0,0,0.12)]',
        // transition individual transform props + filter; framer owns `transform`, so
        // never transition it — and drop the transition entirely while dragging
        dragging ? 'transition-none' : 'transition-[translate,scale,rotate,filter] duration-[180ms] ease-[ease]',
        // cursor + drag scale
        item.draggable && !dragging ? 'cursor-grab' : '',
        dragging ? 'cursor-grabbing scale-[1.025]' : '',
        // tap feedback on coarse pointers only (was @media (hover: none))
        item.draggable ? '[@media(hover:none)]:active:scale-[1.03]' : '',
        // interactive: focus ring + `group` so the tooltip reacts to hover.
        // Non-interactive stickers with a hoverNote also need `group` for the reveal.
        item.interactive
          ? 'group focus-visible:[outline:2px_solid_#7aa88d] focus-visible:[outline-offset:4px] focus-visible:rounded-[6px]'
          : item.hoverNote
            ? 'group'
            : '',
        // hover presets (off while dragging)
        hoverClasses,
        // NB: no whole-sticker idle bob for animated characters — the frame sets
        // supply the motion, and the wrapper must stay pixel-fixed (running platform).
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height ?? 'auto',
        zIndex: getZ(item.id, item.zIndex ?? 3),
        rotate: `${item.rotation ?? 0}deg`,
        x,
        y,
        willChange: dragging || pressed ? 'transform' : 'auto',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      // Warm the lazy chunk on hover so first open is instant (game sprites for the
      // runner; the "On repeat" player for the DJ; the tic-tac-toe chunk for its note).
      onMouseEnter={
        item.id === 'running'
          ? preloadGameAssets
          : item.id === 'dj'
            ? () => void import('../../music/onrepeat/OnRepeatOverlay')
            : item.id === 'tictactoe'
              ? () => void import('../../tictactoe/TicTacToeOverlay')
              : undefined
      }
      onKeyDown={onKeyDown}
      role={item.interactive ? 'button' : undefined}
      tabIndex={item.interactive ? 0 : undefined}
      aria-label={item.interactive ? item.alt : undefined}
      aria-hidden={item.type === 'decorative' ? true : undefined}
    >
      {content}
      {item.openLabel && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-0 bg-[#111] text-white text-[12px] font-medium py-[5px] px-[9px] rounded-[7px] whitespace-nowrap opacity-0 pointer-events-none transition-[opacity,translate] duration-[160ms] ease-[ease] group-hover:opacity-100 group-hover:-translate-y-[8px]">
          {item.openLabel}
        </span>
      )}
      {item.hoverNote && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 w-[210px] bg-[#fffdf8] text-[#3a2f28] font-caveat text-[16px] leading-[1.28] text-center py-[10px] px-[14px] rounded-[14px] shadow-[0_10px_26px_rgba(0,0,0,0.16)] border border-solid border-black/[0.06] whitespace-pre-line opacity-0 pointer-events-none transition-[opacity,transform] duration-[200ms] ease-[ease] group-hover:opacity-100 group-hover:-translate-y-[12px] z-[30]">
          {item.hoverNote}
        </span>
      )}
    </motion.div>
  )
}
