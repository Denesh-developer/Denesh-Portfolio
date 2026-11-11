import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type FrameDefinition = {
  src: string
  /** Milliseconds this frame is held before advancing. */
  duration: number
}

export type FrameAnimationProps = {
  /** Single frame shown when fully at rest (and while dragging / reduced-motion). */
  idleFrame: string
  /** Optional continuous loop for the resting state (e.g. the running run-cycle). */
  restLoop?: FrameDefinition[]
  /** One-shot sequence played once per pointer entry (greeting / wave). */
  hoverSequence?: FrameDefinition[]
  /** Loop played while `active` is true (e.g. the DJ performance while music plays). */
  activeLoop?: FrameDefinition[]
  /** External "is the active loop engaged" flag (DJ music playing). */
  active?: boolean
  /** When false (e.g. actively dragging) all playback halts on the idle frame. */
  playbackEnabled?: boolean
  reducedMotion?: boolean
  className?: string
  alt: string
  /** Intrinsic pixel size of every frame in the set (all frames share one canvas). */
  intrinsicWidth?: number
  intrinsicHeight?: number
  width?: number | string
  height?: number | string
  /** Fired when a hover one-shot finishes and playback returns to rest. */
  onHoverSequenceEnd?: () => void
}

type Resolved = {
  /** Stable identity so the playback effect only restarts when the plan changes. */
  sig: string
  frames: FrameDefinition[] | null // null → hold the idle frame statically
  loop: boolean
  clearHoverOnEnd: boolean
}

/**
 * Frame-by-frame sprite engine with a fixed-size, layout-shift-free wrapper.
 *
 * All frames (idle + every sequence) are preloaded and layered absolutely; only
 * the active frame is opaque, so switching never re-fetches, reflows, or flickers.
 * Because every frame in a set shares one normalized canvas, swapping frames can
 * NEVER change the wrapper's box — the platform/baseline stays pixel-locked.
 *
 * A single requestAnimationFrame loop runs per resolved "plan"; React cancels the
 * previous loop before starting the next, so two loops can never overlap and a
 * plan change can never start a second timer.
 *
 * State priority (highest first):
 *   1. reduced-motion / drag disabled → static idle frame
 *   2. active loop engaged (music)     → activeLoop, looping
 *   3. hover one-shot latched          → hoverSequence, once, then back to rest
 *   4. rest loop provided              → restLoop, looping
 *   5. otherwise                       → static idle frame
 */
export function FrameAnimation({
  idleFrame,
  restLoop,
  hoverSequence,
  activeLoop,
  active = false,
  playbackEnabled = true,
  reducedMotion = false,
  className,
  alt,
  intrinsicWidth,
  intrinsicHeight,
  width = '100%',
  height = '100%',
  onHoverSequenceEnd,
}: FrameAnimationProps) {
  const [ready, setReady] = useState(false)
  // Latches true on pointer-enter, clears when the one-shot completes → guarantees
  // "play once per entry" without restarting while the cursor lingers.
  const [hoverPlaying, setHoverPlaying] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(idleFrame)
  const [frameIndex, setFrameIndex] = useState(0)

  const onEndRef = useRef(onHoverSequenceEnd)
  onEndRef.current = onHoverSequenceEnd

  // Every distinct frame across every mode → the preload + layer set.
  const layers = useMemo(() => {
    const set = new Set<string>([idleFrame])
    for (const list of [restLoop, hoverSequence, activeLoop])
      list?.forEach((f) => set.add(f.src))
    return Array.from(set)
  }, [idleFrame, restLoop, hoverSequence, activeLoop])

  // Preload every layer before allowing playback (no mid-sequence fetch flicker).
  useEffect(() => {
    let cancelled = false
    let loaded = 0
    if (layers.length === 0) {
      setReady(true)
      return
    }
    setReady(false)
    layers.forEach((src) => {
      const img = new Image()
      const done = () => {
        loaded += 1
        if (!cancelled && loaded >= layers.length) setReady(true)
      }
      img.onload = done
      img.onerror = done
      img.src = src
    })
    return () => {
      cancelled = true
    }
  }, [layers])

  const resolved: Resolved = useMemo(() => {
    if (reducedMotion || !playbackEnabled)
      return { sig: 'rest', frames: null, loop: false, clearHoverOnEnd: false }
    if (active && activeLoop?.length)
      return { sig: 'active', frames: activeLoop, loop: true, clearHoverOnEnd: false }
    if (hoverPlaying && hoverSequence?.length)
      return { sig: 'hover', frames: hoverSequence, loop: false, clearHoverOnEnd: true }
    if (restLoop?.length)
      return { sig: 'restloop', frames: restLoop, loop: true, clearHoverOnEnd: false }
    return { sig: 'rest', frames: null, loop: false, clearHoverOnEnd: false }
  }, [reducedMotion, playbackEnabled, active, activeLoop, hoverPlaying, hoverSequence, restLoop])

  // One rAF loop per resolved plan. Cleanup cancels it before the next plan starts.
  useEffect(() => {
    const { frames, loop, clearHoverOnEnd } = resolved
    if (!ready || !frames || frames.length === 0) {
      setCurrentSrc(idleFrame)
      setFrameIndex(0)
      return
    }

    let raf = 0
    let idx = 0
    let start = performance.now()
    setCurrentSrc(frames[0].src)
    setFrameIndex(0)

    const tick = (now: number) => {
      if (now - start >= frames[idx].duration) {
        start = now
        idx += 1
        if (idx >= frames.length) {
          if (loop) {
            idx = 0
          } else {
            // One-shot done → land on idle and drop the latch (re-resolves to rest).
            setCurrentSrc(idleFrame)
            setFrameIndex(0)
            if (clearHoverOnEnd) setHoverPlaying(false)
            onEndRef.current?.()
            return
          }
        }
        setCurrentSrc(frames[idx].src)
        setFrameIndex(idx)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ready, resolved, idleFrame])

  const handlePointerEnter = useCallback(() => {
    if (!playbackEnabled || reducedMotion || active) return
    if (!hoverSequence?.length) return
    // mouseenter only fires crossing the wrapper boundary, and pointer-none on the
    // layers means moving between frames never re-fires it — so this can't loop.
    setHoverPlaying(true)
  }, [playbackEnabled, reducedMotion, active, hoverSequence])

  return (
    <div
      className={className}
      style={{ position: 'relative', width, height, display: 'block' }}
      onMouseEnter={handlePointerEnter}
      data-animation-state={resolved.sig}
      data-frame-index={frameIndex}
    >
      {layers.map((src) => (
        <img
          key={src}
          src={src}
          alt={src === currentSrc ? alt : ''}
          aria-hidden={src === currentSrc ? undefined : true}
          draggable={false}
          width={intrinsicWidth}
          height={intrinsicHeight}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: src === currentSrc ? 1 : 0,
            transition: 'none',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      ))}
    </div>
  )
}
