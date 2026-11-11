/**
 * Typed frame-sequence config for the three animated board characters.
 *
 * Every frame in a set shares ONE normalized canvas (see public/animations/*),
 * so `intrinsic` is identical for all frames in that set and swapping frames can
 * never resize the sticker or move the platform/console baseline.
 *
 * Sources — original Figma component sets (file zhcsbU5OeUSUEgohBug6FJ):
 *   - Coding  "Keshav Hello"      node 15:792  (Typing / seeing / smiling / rasing / waving)
 *   - Running "Running Character" node 33:49   (run x3 / stand / hi)
 *   - DJ      "DJ Character"      node 54:16   (DJ1..DJ6)
 *
 * Figma exposes no prototype timing over MCP, so the left-to-right variant order
 * is the sequence reference and these millisecond holds are tuned for the web.
 */

export type AnimationFrameDefinition = {
  src: string
  duration: number
}

export type FrameIntrinsic = { width: number; height: number }

// ---------------------------------------------------------------- CODING
export const CODING_FRAME_INTRINSIC: FrameIntrinsic = { width: 1000, height: 823 }

const coding = {
  typing: '/animations/coding/typing.png',
  looking: '/animations/coding/looking.png',
  smiling: '/animations/coding/smiling.png',
  wave1: '/animations/coding/wave-1.png',
  wave2: '/animations/coding/wave-2.png',
} as const

export const codingIdleFrame = coding.typing

/** Hover greeting: type → look up → smile → wave·wave → settle → back to typing. */
export const codingGreetingFrames: AnimationFrameDefinition[] = [
  { src: coding.typing, duration: 120 },
  { src: coding.looking, duration: 200 },
  { src: coding.smiling, duration: 240 },
  { src: coding.wave1, duration: 150 },
  { src: coding.wave2, duration: 150 },
  { src: coding.wave1, duration: 150 },
  { src: coding.wave2, duration: 150 },
  { src: coding.smiling, duration: 220 },
  { src: coding.typing, duration: 160 },
]

// ---------------------------------------------------------------- RUNNING
export const RUNNING_FRAME_INTRINSIC: FrameIntrinsic = { width: 1200, height: 988 }

const running = {
  run1: '/animations/running/run-1.png',
  run2: '/animations/running/run-2.png',
  run3: '/animations/running/run-3.png',
  stop: '/animations/running/stop.png',
  hi: '/animations/running/hi.png',
} as const

export const runningIdleFrame = running.run1

/** Slow, non-distracting idle run cycle (Run1 ↔ Run2). */
export const runningIdleFrames: AnimationFrameDefinition[] = [
  { src: running.run1, duration: 220 },
  { src: running.run2, duration: 220 },
]

/** Hover greeting: run → slow → stop → "Hi!" (held) → stop → run → back to idle loop. */
export const runningGreetingFrames: AnimationFrameDefinition[] = [
  { src: running.run1, duration: 130 },
  { src: running.run2, duration: 130 },
  { src: running.run3, duration: 140 },
  { src: running.stop, duration: 220 },
  { src: running.hi, duration: 850 }, // hold long enough to read the greeting
  { src: running.stop, duration: 200 },
  { src: running.run3, duration: 120 },
  { src: running.run2, duration: 120 },
]

// ---------------------------------------------------------------- DJ
export const DJ_FRAME_INTRINSIC: FrameIntrinsic = { width: 500, height: 840 }

const dj = {
  idle: '/animations/dj/idle.png',
  headLeft: '/animations/dj/head-left.png',
  headRight: '/animations/dj/head-right.png',
  scratch: '/animations/dj/scratch.png',
  handUp: '/animations/dj/hand-up.png',
  wave: '/animations/dj/wave.png',
} as const

export const djIdleFrame = dj.idle

/** Hover gesture (when not performing): a quick friendly wave. */
export const djWaveFrames: AnimationFrameDefinition[] = [
  { src: dj.wave, duration: 180 },
  { src: dj.handUp, duration: 420 },
  { src: dj.wave, duration: 200 },
]

/** Performance loop while music plays — slow, musical head-bob with hand-up + scratch. */
export const djPerformanceFrames: AnimationFrameDefinition[] = [
  { src: dj.headLeft, duration: 320 },
  { src: dj.headRight, duration: 320 },
  { src: dj.scratch, duration: 220 },
  { src: dj.headLeft, duration: 300 },
  { src: dj.handUp, duration: 520 },
  { src: dj.headRight, duration: 360 },
  { src: dj.scratch, duration: 200 },
  { src: dj.idle, duration: 300 },
]
