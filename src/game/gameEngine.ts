/**
 * The game engine: owns the world, the single requestAnimationFrame loop, and
 * all per-frame mutation. It exposes a small imperative API (start / pause /
 * jump / …) that React calls, and reports back through throttled callbacks — so
 * React never re-renders per frame (see gameTypes.EngineCallbacks).
 *
 * Timing uses a FIXED-timestep accumulator: physics always advance in 1/120s
 * steps regardless of the display's refresh rate, and a clamped frame delta
 * prevents a background-tabbed loop from tunnelling through obstacles on return.
 *
 * Obstacle SPAWNING is delegated to the pattern director (obstaclePatterns.ts):
 * short, always-clearable combinations whose spacing is derived from the jump
 * physics. The engine just lays out each returned pattern and animates the few
 * "special" obstacles (falling book, rolling cup, bobbing bug, wobbling chair).
 *
 * The loop runs ONLY while the overlay is open and is fully cancelled on
 * destroy() — nothing ticks behind a closed game.
 */
import { GameAudio } from './gameAudio'
import type { GameAssets } from './gameAssets'
import {
  BOOK_FALL_G,
  BUG_BOB_AMP,
  COIN_VALUE,
  COLORS,
  DIFFICULTY_RAMP_S,
  DIST_PER_METRE,
  FIXED_DT,
  GROUND_Y,
  JUMP_BUFFER,
  LOGICAL_H,
  LOGICAL_W,
  MAX_DT,
  MAX_PARTICLES,
  MULT_MAX,
  MULT_PER_COINS,
  MULT_STEP,
  PLAYER_DISPLAY_W,
  PLAYER_X,
  SCORE_PER_PX,
  SPEED_MAX,
  SPEED_RAMP,
  SPEED_START,
  START_SCROLL_SPEED,
} from './gameConstants'
import { integratePlayer, launchJump, obstacleHitbox, playerHitbox, rectsOverlap } from './gamePhysics'
import { makeObstacle } from './obstacleTypes'
import { getNextPattern } from './obstaclePatterns'
import { renderWorld } from './gameRenderer'
import type {
  Collectible,
  EngineCallbacks,
  EngineOptions,
  GameStatus,
  HudStats,
  Particle,
  World,
} from './gameTypes'

const MAX_DPR = 2

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private assets: GameAssets
  private cb: EngineCallbacks
  private audio: GameAudio
  private reducedMotion: boolean

  private world: World
  private raf = 0
  private last = 0
  private acc = 0
  private scoreEmit = 0
  private dustTimer = 0
  private prevGrounded = true
  private destroyed = false
  /** Last status handed to React — dedups notifications independently of world.status. */
  private notifiedStatus: GameStatus = 'START'

  constructor(canvas: HTMLCanvasElement, assets: GameAssets, cb: EngineCallbacks, opts: EngineOptions) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.assets = assets
    this.cb = cb
    this.reducedMotion = opts.reducedMotion
    this.audio = new GameAudio(opts.muted)
    this.world = this.freshWorld('START')
    this.resize()
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.loop)
  }

  // --------------------------------------------------------------- world setup
  private freshWorld(status: GameStatus): World {
    return {
      status,
      speed: SPEED_START,
      distance: 0,
      score: 0,
      elapsed: 0,
      difficulty: 0,
      multiplier: 1,
      player: { y: GROUND_Y, vy: 0, grounded: true, runPhase: 0 },
      obstacles: [],
      collectibles: [],
      particles: [],
      coins: 0,
      groundScroll: 0,
      hillScroll: 0,
      cloudScroll: 0,
      distToNextObstacle: 560, // opening breather before the first obstacle
      lastPattern: '',
      shake: 0,
      jumpBuffer: 0,
    }
  }

  private stats(): HudStats {
    const w = this.world
    return {
      score: Math.floor(w.score),
      coins: w.coins,
      distance: Math.floor(w.distance / DIST_PER_METRE),
      multiplier: w.multiplier,
    }
  }

  private setStatus(s: GameStatus) {
    // world.status is the loop's source of truth and may already be `s` (e.g.
    // freshWorld('PLAYING') on start), so dedup against what React was last told.
    this.world.status = s
    if (this.notifiedStatus === s) return
    this.notifiedStatus = s
    this.cb.onStatusChange(s)
  }

  // --------------------------------------------------------------- public API
  start() {
    this.world = this.freshWorld('PLAYING')
    this.acc = 0
    this.scoreEmit = 0
    this.prevGrounded = true
    this.audio.resume()
    this.setStatus('PLAYING')
    this.cb.onScore(this.stats())
  }

  restart() {
    this.start()
  }

  pause() {
    if (this.world.status === 'PLAYING') this.setStatus('PAUSED')
  }

  resume() {
    if (this.world.status === 'PAUSED') {
      this.acc = 0
      this.setStatus('PLAYING')
    }
  }

  togglePause() {
    if (this.world.status === 'PLAYING') this.pause()
    else if (this.world.status === 'PAUSED') this.resume()
  }

  jump() {
    if (this.world.status !== 'PLAYING') return
    if (launchJump(this.world.player)) {
      this.audio.jump()
      if (!this.reducedMotion) this.spawnGroundPuff(6, 90)
    } else {
      this.world.jumpBuffer = JUMP_BUFFER // remember: fire on landing
    }
  }

  setMuted(muted: boolean) {
    this.audio.setMuted(muted)
  }
  setReducedMotion(rm: boolean) {
    this.reducedMotion = rm
  }
  playNewBest() {
    this.audio.newBest()
  }
  getStatus(): GameStatus {
    return this.world.status
  }

  /** Test-only: fast-forward the difficulty/speed clock (reached via the DEV window handle). */
  debugSetElapsed(s: number) {
    this.world.elapsed = s
  }

  /** Read-only snapshot for automated tests. */
  peek() {
    const w = this.world
    const next = w.obstacles.find((o) => o.x + o.w > PLAYER_X)
    return {
      status: w.status,
      grounded: w.player.grounded,
      score: Math.floor(w.score),
      distance: Math.floor(w.distance / DIST_PER_METRE),
      difficulty: Number(w.difficulty.toFixed(2)),
      speed: Math.round(w.speed),
      nextObstacleDist: next ? Math.round(next.x - PLAYER_X) : null,
      obstacleKinds: w.obstacles.map((o) => o.kind),
      coins: w.coins,
      multiplier: w.multiplier,
    }
  }

  // --------------------------------------------------------------- sizing
  resize() {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1)
    const w = Math.max(1, Math.round(rect.width * dpr))
    const h = Math.max(1, Math.round(rect.height * dpr))
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
    if (this.world.status !== 'PLAYING') this.draw(performance.now() / 1000)
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.audio.dispose()
  }

  // --------------------------------------------------------------- loop
  private loop = (now: number) => {
    if (this.destroyed) return
    let dt = (now - this.last) / 1000
    this.last = now
    if (dt > MAX_DT) dt = MAX_DT

    const s = this.world.status
    if (s === 'PLAYING') {
      this.acc += dt
      while (this.acc >= FIXED_DT) {
        this.step(FIXED_DT)
        this.acc -= FIXED_DT
        if (this.world.status !== 'PLAYING') break
      }
      this.emitScore(dt)
    } else if (s === 'START') {
      this.cosmeticStep(dt)
    }

    this.draw(now / 1000)
    this.raf = requestAnimationFrame(this.loop)
  }

  private emitScore(dt: number) {
    this.scoreEmit += dt
    if (this.scoreEmit >= 0.08) {
      this.scoreEmit = 0
      this.cb.onScore(this.stats())
    }
  }

  // --------------------------------------------------------------- START idle
  private cosmeticStep(dt: number) {
    const w = this.world
    const moved = START_SCROLL_SPEED * dt
    w.groundScroll += moved
    w.hillScroll += moved
    w.cloudScroll += moved
    w.player.runPhase += dt
    this.updateParticles(dt)
    if (!this.reducedMotion) {
      this.dustTimer -= dt
      if (this.dustTimer <= 0) {
        this.dustTimer = 0.14
        this.spawnRunDust()
      }
    }
  }

  // --------------------------------------------------------------- PLAYING step
  private step(dt: number) {
    const w = this.world
    w.elapsed += dt
    w.difficulty = Math.min(1, w.elapsed / DIFFICULTY_RAMP_S)
    w.speed = Math.min(SPEED_MAX, SPEED_START + w.elapsed * SPEED_RAMP)
    const moved = w.speed * dt
    w.distance += moved
    w.score += moved * SCORE_PER_PX * w.multiplier
    w.groundScroll += moved
    w.hillScroll += moved
    w.cloudScroll += moved

    // player + buffered jump
    if (w.jumpBuffer > 0) {
      w.jumpBuffer -= dt
      if (w.player.grounded && launchJump(w.player)) {
        w.jumpBuffer = 0
        this.audio.jump()
        if (!this.reducedMotion) this.spawnGroundPuff(6, 90)
      }
    }
    const wasGrounded = this.prevGrounded
    integratePlayer(w.player, dt)
    if (!wasGrounded && w.player.grounded) {
      this.audio.land()
      if (!this.reducedMotion) this.spawnGroundPuff(7, 130) // landing puff
    }
    this.prevGrounded = w.player.grounded
    if (w.player.grounded) {
      w.player.runPhase += dt
      if (!this.reducedMotion) {
        this.dustTimer -= dt
        if (this.dustTimer <= 0) {
          this.dustTimer = 0.12
          this.spawnRunDust()
        }
      }
    }

    // spawn + scroll + animate obstacles
    w.distToNextObstacle -= moved
    if (w.distToNextObstacle <= 0) this.spawnPattern()
    for (const o of w.obstacles) {
      o.baseX -= moved + o.vx * dt
      let wobble = 0
      const m = o.motion
      if (m) {
        if (m.type === 'falling') {
          if (o.top < m.targetTop) {
            m.vy += BOOK_FALL_G * dt
            o.top = Math.min(m.targetTop, o.top + m.vy * dt)
          }
        } else if (m.type === 'bug') {
          o.top = m.baseTop + Math.sin(w.elapsed * 6 + m.phase) * BUG_BOB_AMP
        } else if (m.type === 'moving') {
          wobble = Math.sin(w.elapsed * m.freq + m.phase) * m.amp
        } else if (m.type === 'rolling') {
          m.spin += (moved + o.vx * dt) * 0.02
        }
      }
      o.x = o.baseX + wobble
    }
    w.obstacles = w.obstacles.filter((o) => o.x + o.w > -80)

    // scroll collectibles
    for (const c of w.collectibles) {
      c.x -= moved
      if (c.collected) c.pop -= dt
    }
    w.collectibles = w.collectibles.filter((c) => c.x > -40 && (!c.collected || c.pop > 0))

    // collisions
    const box = playerHitbox(w.player)
    for (const o of w.obstacles) {
      if (rectsOverlap(box, obstacleHitbox(o))) {
        this.gameOver()
        return
      }
    }
    for (const c of w.collectibles) {
      if (c.collected) continue
      const cbx = { x: c.x - c.r - 4, y: c.y - c.r - 4, w: (c.r + 4) * 2, h: (c.r + 4) * 2 }
      if (rectsOverlap(box, cbx)) this.collect(c)
    }

    this.updateParticles(dt)
    if (w.shake > 0) w.shake = Math.max(0, w.shake - dt)
  }

  // --------------------------------------------------------------- spawning
  private spawnPattern() {
    const w = this.world
    const pat = getNextPattern({ difficulty: w.difficulty, speed: w.speed, prevSignature: w.lastPattern })
    w.lastPattern = pat.signature
    const spawnX = LOGICAL_W + 40
    for (const it of pat.items) w.obstacles.push(makeObstacle(it.kind, it.variant, spawnX + it.dx))
    for (const c of pat.collectibles) {
      w.collectibles.push({ x: spawnX + c.dx, y: c.y, r: 13, collected: false, bob: Math.random() * Math.PI * 2, pop: 0 })
    }
    w.distToNextObstacle = pat.span + pat.leadGap
  }

  private collect(c: Collectible) {
    const w = this.world
    c.collected = true
    c.pop = 0.28
    w.coins += 1
    w.multiplier = Math.min(MULT_MAX, 1 + Math.floor(w.coins / MULT_PER_COINS) * MULT_STEP)
    w.score += COIN_VALUE
    this.audio.collect()
    for (let i = 0; i < 8; i++) {
      this.pushParticle({
        x: c.x,
        y: c.y,
        vx: (Math.random() - 0.5) * 220,
        vy: -Math.random() * 220 - 40,
        life: 0.5,
        maxLife: 0.5,
        size: 3 + Math.round(Math.random() * 2),
        color: COLORS.particleCoin,
        gravity: 900,
      })
    }
  }

  // --------------------------------------------------------------- particles
  private spawnRunDust() {
    this.pushParticle({
      x: PLAYER_X + PLAYER_DISPLAY_W * 0.32,
      y: GROUND_Y - 2,
      vx: -60 - Math.random() * 60,
      vy: -Math.random() * 40,
      life: 0.4,
      maxLife: 0.4,
      size: 3,
      color: COLORS.particleDust,
      gravity: 120,
    })
  }

  /** Burst of dust at the feet — used for jump take-off and landing puffs. */
  private spawnGroundPuff(count: number, spread: number) {
    const cx = PLAYER_X + PLAYER_DISPLAY_W * 0.42
    for (let i = 0; i < count; i++) {
      this.pushParticle({
        x: cx + (Math.random() - 0.5) * 20,
        y: GROUND_Y - 2,
        vx: (Math.random() - 0.5) * spread,
        vy: -Math.random() * 70 - 10,
        life: 0.34,
        maxLife: 0.34,
        size: 3 + Math.round(Math.random() * 2),
        color: COLORS.particleDust,
        gravity: 260,
      })
    }
  }

  private pushParticle(p: Particle) {
    const arr = this.world.particles
    if (arr.length >= MAX_PARTICLES) arr.shift()
    arr.push(p)
  }

  private updateParticles(dt: number) {
    const arr = this.world.particles
    for (const p of arr) {
      p.vy += p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
    }
    this.world.particles = arr.filter((p) => p.life > 0)
  }

  // --------------------------------------------------------------- game over
  private gameOver() {
    const w = this.world
    this.setStatus('GAME_OVER')
    w.shake = 0.4
    this.audio.hit()
    this.audio.gameOver()
    for (let i = 0; i < 18; i++) {
      this.pushParticle({
        x: PLAYER_X + PLAYER_DISPLAY_W * 0.5,
        y: GROUND_Y - 40,
        vx: (Math.random() - 0.5) * 320,
        vy: -Math.random() * 300 - 60,
        life: 0.7,
        maxLife: 0.7,
        size: 3 + Math.round(Math.random() * 2),
        color: i % 3 === 0 ? COLORS.particleCoin : COLORS.particleDust,
        gravity: 1100,
      })
    }
    const stats = this.stats()
    this.cb.onScore(stats)
    this.cb.onGameOver(stats)
  }

  // --------------------------------------------------------------- draw
  private draw(time: number) {
    const ctx = this.ctx
    const { width, height } = this.canvas
    ctx.setTransform(width / LOGICAL_W, 0, 0, height / LOGICAL_H, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H)
    renderWorld(ctx, this.world, this.assets, time, this.reducedMotion)
  }
}
