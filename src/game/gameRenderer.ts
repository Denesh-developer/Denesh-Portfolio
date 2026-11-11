/**
 * All canvas drawing for "Kesavan's Run", layered back-to-front:
 *   1 sky (zone-tinted gradient + soft sun)   2 parallax clouds + hills
 *   3 ground (scrolling)                       4 obstacles + collectibles
 *   5 player + particles + speed lines
 *
 * The ctx is handed in ALREADY scaled to logical space (1 unit = 1 logical px)
 * by the engine, so everything here is authored in the 960×540 world. Each
 * obstacle draws itself via its registry entry (obstacleTypes.ts).
 */
import type { GameAssets } from './gameAssets'
import type { Collectible, Particle, World } from './gameTypes'
import {
  COLORS,
  GROUND_Y,
  LOGICAL_H,
  LOGICAL_W,
  PLAYER_DISPLAY_H,
  PLAYER_DISPLAY_W,
  PLAYER_X,
  SPEED_MAX,
  ZONES,
  ZONE_DURATION_S,
  type ZonePalette,
} from './gameConstants'
import { OBSTACLES } from './obstacleTypes'

const R = Math.round

/** Stable pseudo-random in [0,1) from a number — keeps scenery from jittering. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}

// ---------------------------------------------------------------- zone tint
function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const c = (x: number, y: number) => R(x + (y - x) * t)
  return `rgb(${c(ar, br)},${c(ag, bg)},${c(ab, bb)})`
}
/** Smoothly drift between background zones as the run progresses. */
function currentZone(elapsed: number): ZonePalette {
  const t = elapsed / ZONE_DURATION_S
  const i = Math.floor(t) % ZONES.length
  const j = (i + 1) % ZONES.length
  const f = t - Math.floor(t)
  const a = ZONES[i]
  const b = ZONES[j]
  return {
    skyTop: lerpHex(a.skyTop, b.skyTop, f),
    skyBottom: lerpHex(a.skyBottom, b.skyBottom, f),
    hillFar: lerpHex(a.hillFar, b.hillFar, f),
    hillNear: lerpHex(a.hillNear, b.hillNear, f),
  }
}

// ---------------------------------------------------------------- sky
function drawSky(ctx: CanvasRenderingContext2D, zone: ZonePalette) {
  const g = ctx.createLinearGradient(0, 0, 0, LOGICAL_H)
  g.addColorStop(0, zone.skyTop)
  g.addColorStop(1, zone.skyBottom)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H)
  ctx.fillStyle = COLORS.sun
  ctx.beginPath()
  ctx.arc(LOGICAL_W - 150, 96, 54, 0, Math.PI * 2)
  ctx.fill()
}

// ---------------------------------------------------------------- clouds
function puff(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(R(x), R(y), R(r), 0, Math.PI * 2)
  ctx.fill()
}
function drawClouds(ctx: CanvasRenderingContext2D, scroll: number) {
  const clouds = [
    { x: 120, y: 90, s: 1.0 },
    { x: 470, y: 60, s: 0.8 },
    { x: 760, y: 120, s: 1.15 },
    { x: 980, y: 74, s: 0.9 },
  ]
  const span = LOGICAL_W + 300
  ctx.fillStyle = COLORS.cloud
  ctx.globalAlpha = 0.92
  for (const c of clouds) {
    const cx = (((c.x - scroll) % span) + span) % span - 150
    const s = c.s
    puff(ctx, cx, c.y, 26 * s)
    puff(ctx, cx + 28 * s, c.y - 12 * s, 32 * s)
    puff(ctx, cx + 60 * s, c.y, 24 * s)
    puff(ctx, cx + 30 * s, c.y + 8 * s, 30 * s)
  }
  ctx.globalAlpha = 1
}

// ---------------------------------------------------------------- hills
function hillRidge(ctx: CanvasRenderingContext2D, scroll: number, spacing: number, r: number, color: string) {
  ctx.fillStyle = color
  const off = ((scroll % spacing) + spacing) % spacing
  for (let x = -spacing; x < LOGICAL_W + spacing; x += spacing) {
    ctx.beginPath()
    ctx.arc(R(x - off), GROUND_Y, r, Math.PI, Math.PI * 2)
    ctx.fill()
  }
}
function drawHills(ctx: CanvasRenderingContext2D, scroll: number, zone: ZonePalette) {
  hillRidge(ctx, scroll * 0.35, 150, 96, zone.hillFar)
  hillRidge(ctx, scroll * 0.55, 120, 66, zone.hillNear)
}

// ---------------------------------------------------------------- ground
const TILE = 48
function drawGround(ctx: CanvasRenderingContext2D, scroll: number) {
  ctx.fillStyle = COLORS.dirt
  ctx.fillRect(0, GROUND_Y + 14, LOGICAL_W, LOGICAL_H - GROUND_Y - 14)
  ctx.fillStyle = COLORS.grassTop
  ctx.fillRect(0, GROUND_Y, LOGICAL_W, 14)
  ctx.fillStyle = COLORS.grassShade
  ctx.fillRect(0, GROUND_Y + 12, LOGICAL_W, 4)

  const off = ((scroll % TILE) + TILE) % TILE
  const first = Math.floor(scroll / TILE)
  for (let i = -1; i * TILE < LOGICAL_W + TILE; i++) {
    const tileX = i * TILE - off
    const idx = first + i
    ctx.fillStyle = COLORS.grassShade
    const bx = tileX + 6 + hash(idx) * 30
    ctx.fillRect(R(bx), GROUND_Y - 4, 3, 5)
    ctx.fillRect(R(bx + 10), GROUND_Y - 3, 3, 4)
    ctx.fillStyle = COLORS.dirtDark
    ctx.fillRect(R(tileX + 8 + hash(idx * 3.1) * 30), GROUND_Y + 26 + hash(idx * 7.3) * 30, 5, 5)
    ctx.fillRect(R(tileX + 24 + hash(idx * 5.7) * 18), GROUND_Y + 46 + hash(idx * 2.9) * 24, 4, 4)
  }
}

// ---------------------------------------------------------------- collectible (coffee bean)
function drawCollectible(ctx: CanvasRenderingContext2D, c: Collectible, time: number, reducedMotion: boolean) {
  const popFrac = c.collected ? Math.max(0, c.pop / 0.28) : 1
  if (c.collected && popFrac <= 0) return
  const scale = c.collected ? 1 + (1 - popFrac) * 0.9 : 1
  const alpha = c.collected ? popFrac : 1
  const bob = reducedMotion || c.collected ? 0 : Math.sin(time * 3 + c.bob) * 4
  const rw = c.r
  const rh = c.r * 0.78

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(c.x, c.y + bob)
  ctx.scale(scale, scale)
  ctx.rotate(-0.32)
  ctx.fillStyle = COLORS.bean
  ctx.beginPath()
  ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = COLORS.beanShade // center crease
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -rh * 0.8)
  ctx.quadraticCurveTo(rw * 0.5, 0, 0, rh * 0.8)
  ctx.stroke()
  ctx.fillStyle = COLORS.beanShine // shine
  ctx.beginPath()
  ctx.ellipse(-rw * 0.35, -rh * 0.35, rw * 0.24, rh * 0.24, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

// ---------------------------------------------------------------- player
function drawPlayer(ctx: CanvasRenderingContext2D, world: World, assets: GameAssets) {
  const p = world.player
  const feetY = p.y
  const x = PLAYER_X
  const top = feetY - PLAYER_DISPLAY_H

  const airFrac = Math.min(1, (GROUND_Y - feetY) / 160)
  ctx.save()
  ctx.globalAlpha = 0.18 * (1 - airFrac * 0.7)
  ctx.fillStyle = '#000'
  ctx.beginPath()
  const sw = PLAYER_DISPLAY_W * (0.42 - airFrac * 0.16)
  ctx.ellipse(x + PLAYER_DISPLAY_W / 2, GROUND_Y + 6, sw, 7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const frame =
    p.grounded && Math.floor(p.runPhase * 6.5) % 2 !== 0 ? assets.run[1] : assets.run[0]
  if (frame && frame.complete && frame.naturalWidth) {
    ctx.drawImage(frame, R(x), R(top), PLAYER_DISPLAY_W, PLAYER_DISPLAY_H)
  } else {
    ctx.fillStyle = COLORS.box
    ctx.fillRect(x + 30, top + 14, 50, PLAYER_DISPLAY_H - 20)
  }
}

// ---------------------------------------------------------------- speed lines
function drawSpeedLines(ctx: CanvasRenderingContext2D, world: World, time: number) {
  const frac = (world.speed - SPEED_MAX * 0.6) / (SPEED_MAX * 0.4)
  if (frac <= 0) return
  ctx.strokeStyle = `rgba(255,255,255,${0.1 * Math.min(1, frac)})`
  ctx.lineWidth = 2
  for (let i = 0; i < 5; i++) {
    const seed = i * 1.7
    const y = 120 + hash(seed) * (GROUND_Y - 150)
    const speedX = ((time * 900 + i * 220) % (LOGICAL_W + 200)) - 200
    const x = LOGICAL_W - speedX
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 40 - hash(seed + 3) * 30, y)
    ctx.stroke()
  }
}

// ---------------------------------------------------------------- particles
function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
    ctx.fillStyle = p.color
    ctx.fillRect(R(p.x), R(p.y), p.size, p.size)
  }
  ctx.globalAlpha = 1
}

// ---------------------------------------------------------------- compose
export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  assets: GameAssets,
  time: number,
  reducedMotion: boolean,
) {
  ctx.save()
  if (world.shake > 0 && !reducedMotion) {
    const m = world.shake * 14
    ctx.translate((hash(time * 90) - 0.5) * m, (hash(time * 57) - 0.5) * m)
  }
  const zone = currentZone(world.elapsed)
  drawSky(ctx, zone)
  drawClouds(ctx, world.cloudScroll * 0.18)
  drawHills(ctx, world.hillScroll, zone)
  drawGround(ctx, world.groundScroll)
  if (!reducedMotion && world.status === 'PLAYING') drawSpeedLines(ctx, world, time)
  for (const c of world.collectibles) drawCollectible(ctx, c, time, reducedMotion)
  for (const o of world.obstacles) OBSTACLES[o.kind].draw(ctx, o, time)
  drawParticles(ctx, world.particles)
  drawPlayer(ctx, world, assets)
  ctx.restore()
}
