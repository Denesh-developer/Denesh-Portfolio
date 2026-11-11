/**
 * Shared types for "Kesavan's Run" — a lightweight canvas endless runner.
 * The engine owns all high-frequency state (see gameEngine.ts); React only
 * mirrors the handful of values it renders (status, score, distance, best, muted).
 */

export type GameStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'

/**
 * Obstacle roster. Grounded static kinds (with size variants) + a few rare
 * "special" kinds that move — all portfolio-flavoured (coffee, books, keyboard,
 * laptop, a code bug, a deadline paper).
 */
export type ObstacleKind =
  | 'rock' // small early-game rock
  | 'box' // cardboard box
  | 'pot' // plant pot
  | 'chair' // taller
  | 'bin' // wide dustbin
  | 'barrier' // large construction barrier
  | 'coffeeStack' // 2–4 stacked coffee cups (portfolio)
  | 'bookStack' // 2–4 stacked law books (grows with difficulty)
  | 'keyboard' // wide + low → timing, not height
  | 'laptop' // rare large, late game
  | 'paper' // rare "deadline" document
  | 'rollingCup' // special: rolls toward the player faster
  | 'fallingBook' // special: drops in from above with a warning
  | 'movingChair' // special: small predictable horizontal wobble
  | 'bug' // special: tiny, bobs vertically just off the ground

export type ObstacleMotion =
  | { type: 'falling'; targetTop: number; vy: number }
  | { type: 'bug'; baseTop: number; phase: number }
  | { type: 'moving'; amp: number; phase: number; freq: number }
  | { type: 'rolling'; spin: number }

export interface Obstacle {
  kind: ObstacleKind
  /** Scrolled position (world x of the left edge). `x` is derived from this + wobble. */
  baseX: number
  /** Render/collision left edge = baseX + horizontal wobble. */
  x: number
  w: number
  h: number
  /** Stack count for coffeeStack / bookStack (1 otherwise). */
  units: number
  /** World y of the visual top (animated for falling / bug). base = top + h. */
  top: number
  /** Extra leftward speed on top of the world scroll (rolling cup). */
  vx: number
  /** Collision insets as fractions (smaller than art → fair). */
  padX: number
  padTop: number
  scored: boolean
  motion?: ObstacleMotion
}

export interface Collectible {
  x: number
  /** Center y, logical px. */
  y: number
  r: number
  collected: boolean
  /** Phase seed for the gentle float bob. */
  bob: number
  /** Brief grow/shrink pop timer when collected (s); >0 = animating out. */
  pop: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  gravity: number
}

export interface Player {
  /** Feet Y (logical). Equals GROUND_Y when grounded. */
  y: number
  vy: number
  grounded: boolean
  /** Seconds accumulator that drives the two-frame run swap. */
  runPhase: number
}

/** Everything the renderer needs; mutated in place by the engine each step. */
export interface World {
  status: GameStatus
  speed: number
  distance: number
  score: number
  elapsed: number
  /** 0..1 smooth difficulty, derived from elapsed. */
  difficulty: number
  /** Score multiplier from collected coffees (1.0+). */
  multiplier: number
  player: Player
  obstacles: Obstacle[]
  collectibles: Collectible[]
  particles: Particle[]
  coins: number
  /** Scroll offsets per parallax layer (logical px). */
  groundScroll: number
  hillScroll: number
  cloudScroll: number
  distToNextObstacle: number
  /** Anti-repeat: signature of the previously spawned pattern. */
  lastPattern: string
  /** Remaining screen-shake time (s); 0 = steady. */
  shake: number
  /** Buffered-jump timer (s) so a press just before landing still fires. */
  jumpBuffer: number
}

export interface HudStats {
  score: number
  coins: number
  /** Distance in "metres". */
  distance: number
  multiplier: number
}

export interface EngineCallbacks {
  /** Throttled (~12/s) live stats for the HUD. */
  onScore: (stats: HudStats) => void
  onGameOver: (stats: HudStats) => void
  onStatusChange: (status: GameStatus) => void
}

export interface EngineOptions {
  muted: boolean
  reducedMotion: boolean
}
