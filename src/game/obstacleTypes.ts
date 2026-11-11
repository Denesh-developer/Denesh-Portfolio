/**
 * Obstacle registry for "Kesavan's Run". Each kind is its OWN pixel-art sprite
 * (a small draw routine), with size variants, collision padding, a difficulty
 * gate, and a spawn weight. Everything is drawn programmatically in logical
 * space — crisp at any viewport size, zero image downloads, no giant scene.
 *
 * The roster is portfolio-flavoured: coffee, law books, keyboard, laptop, a code
 * bug, a "deadline" paper. Heights stay ≤ MAX_CLEARABLE_H so the standard jump
 * can always clear them.
 */
import {
  BOOK_FALL_HEIGHT,
  CHAIR_WOBBLE_AMP,
  COLORS,
  GROUND_Y,
  ROLL_EXTRA_VX,
} from './gameConstants'
import type { Obstacle, ObstacleKind } from './gameTypes'

const R = Math.round

export interface Variant {
  w: number
  h: number
  units?: number // stack count (coffeeStack / bookStack)
}

export interface ObstacleDef {
  variants: Variant[] // ordered easy → hard; larger variants unlock with difficulty
  padX: number // collision inset fraction per side (forgiving)
  padTop: number // collision inset fraction from the top
  minDifficulty: number // 0..1 gate
  weight: number // relative spawn frequency
  special?: 'rolling' | 'falling' | 'moving' | 'bug'
  /** Wide obstacles shouldn't sit right next to another wide one in a combo. */
  wide?: boolean
  draw: (ctx: CanvasRenderingContext2D, o: Obstacle, t: number) => void
}

// ---------------------------------------------------------------- shared units
function drawCup(ctx: CanvasRenderingContext2D, x: number, top: number, w: number, h: number) {
  ctx.fillStyle = COLORS.cup
  ctx.fillRect(x, top, w, h)
  ctx.fillStyle = COLORS.cupShade
  ctx.fillRect(x + w - 5, top, 5, h)
  ctx.fillStyle = COLORS.coffee
  ctx.fillRect(x + 3, top + 3, w - 6, 4) // rim of coffee
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 2
  ctx.strokeRect(x + 1, top + 1, w - 2, h - 2)
}

function drawBook(ctx: CanvasRenderingContext2D, x: number, top: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x, top, w, h)
  ctx.fillStyle = COLORS.bookPage
  ctx.fillRect(x + w - 6, top + 2, 5, h - 4) // page block on the right
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(x + 3, top + 3, w - 12, 2) // title band highlight
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 2
  ctx.strokeRect(x + 1, top + 1, w - 2, h - 2)
}

const BOOK_COLORS = [COLORS.book1, COLORS.book2, COLORS.book3, COLORS.book4]

// ---------------------------------------------------------------- draws
function drawRock(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  const base = o.top + o.h
  ctx.fillStyle = COLORS.rock
  ctx.beginPath()
  ctx.moveTo(x, base)
  ctx.lineTo(x + o.w * 0.16, o.top + o.h * 0.35)
  ctx.lineTo(x + o.w * 0.46, o.top)
  ctx.lineTo(x + o.w * 0.8, o.top + o.h * 0.32)
  ctx.lineTo(x + o.w, base)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = COLORS.rockLight
  ctx.fillRect(R(x + o.w * 0.3), R(o.top + o.h * 0.3), R(o.w * 0.22), R(o.h * 0.16))
  ctx.fillStyle = COLORS.rockShade
  ctx.fillRect(x, R(base - 5), o.w, 5)
}

function drawBox(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  ctx.fillStyle = COLORS.box
  ctx.fillRect(x, o.top, o.w, o.h)
  ctx.fillStyle = COLORS.boxShade
  ctx.fillRect(x, R(o.top + o.h - 6), o.w, 6)
  ctx.fillRect(R(x + o.w - 6), o.top, 6, o.h)
  ctx.fillStyle = COLORS.boxTape // packing tape down the middle
  ctx.fillRect(R(x + o.w / 2 - 4), o.top, 8, o.h)
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 2
  ctx.strokeRect(x + 1, o.top + 1, o.w - 2, o.h - 2)
  ctx.beginPath() // top flap seam
  ctx.moveTo(x + 2, R(o.top + o.h * 0.28))
  ctx.lineTo(x + o.w - 2, R(o.top + o.h * 0.28))
  ctx.stroke()
}

function drawPot(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  const potH = o.h * 0.5
  const potTop = o.top + o.h - potH
  // plant
  ctx.fillStyle = COLORS.plant
  for (const [dx, dy, r] of [
    [0.3, 0.1, 0.24],
    [0.55, 0.0, 0.28],
    [0.72, 0.16, 0.2],
  ] as const) {
    ctx.beginPath()
    ctx.arc(x + o.w * dx, o.top + o.h * dy + o.h * 0.16, o.w * r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = COLORS.plantShade
  ctx.fillRect(R(x + o.w * 0.46), R(o.top + o.h * 0.18), 3, R(potTop - (o.top + o.h * 0.18)))
  // pot (trapezoid)
  ctx.fillStyle = COLORS.pot
  ctx.beginPath()
  ctx.moveTo(x + o.w * 0.12, potTop)
  ctx.lineTo(x + o.w * 0.88, potTop)
  ctx.lineTo(x + o.w * 0.78, o.top + o.h)
  ctx.lineTo(x + o.w * 0.22, o.top + o.h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = COLORS.potShade
  ctx.fillRect(x + o.w * 0.12, potTop, o.w * 0.76, 4) // rim
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawChair(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  const base = o.top + o.h
  const seatY = o.top + o.h * 0.5
  ctx.fillStyle = COLORS.chair
  ctx.fillRect(x, R(seatY), o.w, 8) // seat
  ctx.fillRect(x + 2, o.top, 8, R(seatY - o.top)) // backrest post
  ctx.fillStyle = COLORS.chairShade
  ctx.fillRect(x, o.top, o.w * 0.5, 7) // back top rail
  ctx.fillRect(x + 4, R(seatY + 8), 7, R(base - seatY - 8)) // front leg
  ctx.fillRect(R(x + o.w - 10), R(seatY + 8), 7, R(base - seatY - 8)) // back leg
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 2
  ctx.strokeRect(x, R(seatY), o.w, 8)
}

function drawBin(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  const bodyTop = o.top + 8
  ctx.fillStyle = COLORS.bin
  ctx.beginPath() // slightly tapered body
  ctx.moveTo(x + 3, bodyTop)
  ctx.lineTo(x + o.w - 3, bodyTop)
  ctx.lineTo(x + o.w - 6, o.top + o.h)
  ctx.lineTo(x + 6, o.top + o.h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = COLORS.binShade
  for (let i = 1; i < 4; i++) ctx.fillRect(R(x + 6 + (o.w - 12) * (i / 4) - 1), bodyTop, 2, o.h - 8)
  ctx.fillStyle = COLORS.binLid
  ctx.fillRect(x, o.top, o.w, 8) // lid
  ctx.fillRect(R(x + o.w / 2 - 4), o.top - 4, 8, 5) // handle
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 2
  ctx.strokeRect(x, o.top, o.w, 8)
}

function drawBarrier(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  const boardH = o.h * 0.42
  const boardTop = o.top
  ctx.fillStyle = COLORS.barrierLeg // legs
  ctx.fillRect(x + 6, R(boardTop + boardH), 7, o.h - boardH)
  ctx.fillRect(R(x + o.w - 13), R(boardTop + boardH), 7, o.h - boardH)
  ctx.save() // striped board (clip so stripes stay inside)
  ctx.beginPath()
  ctx.rect(x, boardTop, o.w, boardH)
  ctx.clip()
  ctx.fillStyle = COLORS.barrier
  ctx.fillRect(x, boardTop, o.w, boardH)
  ctx.fillStyle = COLORS.barrierStripe
  for (let sx = -boardH; sx < o.w; sx += 18) {
    ctx.beginPath()
    ctx.moveTo(x + sx, boardTop + boardH)
    ctx.lineTo(x + sx + boardH, boardTop)
    ctx.lineTo(x + sx + boardH + 9, boardTop)
    ctx.lineTo(x + sx + 9, boardTop + boardH)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 2
  ctx.strokeRect(x, boardTop, o.w, boardH)
}

function drawKeyboard(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  ctx.fillStyle = COLORS.keyboardBase
  ctx.fillRect(x, o.top, o.w, o.h)
  ctx.fillStyle = COLORS.keycap
  const cols = Math.max(6, Math.floor(o.w / 12))
  const rows = 2
  const kw = (o.w - 8) / cols
  const kh = (o.h - 8) / rows
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const kx = x + 4 + c * kw
      const ky = o.top + 4 + r * kh
      ctx.fillStyle = COLORS.keycapTop
      ctx.fillRect(R(kx), R(ky), R(kw - 2), R(kh - 2))
      ctx.fillStyle = COLORS.keycap
      ctx.fillRect(R(kx), R(ky + kh - 4), R(kw - 2), 2)
    }
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 2
  ctx.strokeRect(x, o.top, o.w, o.h)
}

function drawLaptop(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  const baseH = 8
  const baseTop = o.top + o.h - baseH
  const screenH = o.h - baseH
  ctx.fillStyle = COLORS.laptopBody // base
  ctx.fillRect(x, baseTop, o.w, baseH)
  ctx.fillStyle = COLORS.laptopBodyShade
  ctx.fillRect(x, R(baseTop + baseH - 3), o.w, 3)
  // screen (slight lean)
  const sw = o.w - 10
  ctx.fillStyle = COLORS.laptopBody
  ctx.fillRect(x + 5, o.top, sw, screenH)
  ctx.fillStyle = COLORS.laptopScreen
  ctx.fillRect(x + 9, o.top + 4, sw - 8, screenH - 8)
  ctx.fillStyle = COLORS.laptopGlow // code lines glow
  for (let i = 0; i < 3; i++) ctx.fillRect(R(x + 13), R(o.top + 9 + i * 6), R((sw - 16) * (0.5 + 0.2 * i)), 2)
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 2
  ctx.strokeRect(x + 5, o.top, sw, screenH)
}

function drawPaper(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  ctx.fillStyle = COLORS.paper
  ctx.fillRect(x, o.top, o.w, o.h)
  ctx.fillStyle = COLORS.paperInk // red "DEADLINE" band
  ctx.fillRect(x + 6, o.top + 8, o.w - 12, 6)
  ctx.fillStyle = COLORS.paperLine
  for (let i = 0; i < 6; i++) ctx.fillRect(x + 8, R(o.top + 24 + i * 10), o.w - 16, 2)
  // folded corner
  ctx.fillStyle = COLORS.paperLine
  ctx.beginPath()
  ctx.moveTo(x + o.w - 14, o.top)
  ctx.lineTo(x + o.w, o.top + 14)
  ctx.lineTo(x + o.w - 14, o.top + 14)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = COLORS.ink
  ctx.lineWidth = 2
  ctx.strokeRect(x, o.top, o.w, o.h)
}

function drawBug(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  const cx = x + o.w / 2
  const cy = o.top + o.h / 2
  ctx.strokeStyle = COLORS.bugShade // legs
  ctx.lineWidth = 2
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(cx + s * o.w * 0.18, cy + (i - 1) * 4)
      ctx.lineTo(cx + s * o.w * 0.6, cy + (i - 1) * 5 + 4)
      ctx.stroke()
    }
  ctx.fillStyle = COLORS.bug // body
  ctx.beginPath()
  ctx.ellipse(cx, cy, o.w * 0.38, o.h * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = COLORS.bugShade
  ctx.fillRect(R(cx - 1), R(o.top + 1), 2, o.h - 2) // center seam
  ctx.fillStyle = COLORS.bugEye // eyes
  ctx.fillRect(R(cx - o.w * 0.28), R(cy - 3), 3, 3)
  ctx.fillRect(R(cx + o.w * 0.18), R(cy - 3), 3, 3)
}

function drawCoffeeStack(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  const unitH = o.h / o.units
  for (let i = 0; i < o.units; i++) {
    const inset = i === o.units - 1 ? 0 : 1 // slight taper feel
    drawCup(ctx, x + inset, R(o.top + i * unitH), o.w - inset * 2, R(unitH) + 1)
  }
}

function drawBookStack(ctx: CanvasRenderingContext2D, o: Obstacle) {
  const x = R(o.x)
  const unitH = o.h / o.units
  for (let i = 0; i < o.units; i++) {
    const off = (i % 2) * 4 - 2 // alternate slight offset so the stack reads as separate books
    drawBook(ctx, x + off, R(o.top + i * unitH), o.w - Math.abs(off), R(unitH) + 1, BOOK_COLORS[i % BOOK_COLORS.length])
  }
}

function drawRollingCup(ctx: CanvasRenderingContext2D, o: Obstacle, _t: number) {
  drawCup(ctx, R(o.x), o.top, o.w, o.h)
  // motion streaks trailing to the right (it's moving left)
  const spin = o.motion?.type === 'rolling' ? o.motion.spin : 0
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = 2
  for (let i = 0; i < 3; i++) {
    const yy = o.top + 6 + i * (o.h / 3)
    const dash = 5 + ((spin * 40 + i * 9) % 8)
    ctx.beginPath()
    ctx.moveTo(o.x + o.w + 2, yy)
    ctx.lineTo(o.x + o.w + 2 + dash, yy)
    ctx.stroke()
  }
}

function drawFallingBook(ctx: CanvasRenderingContext2D, o: Obstacle) {
  // faint drop guide while still airborne
  if (o.motion?.type === 'falling' && o.top + o.h < GROUND_Y - 4) {
    ctx.strokeStyle = 'rgba(176,103,103,0.35)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 5])
    ctx.beginPath()
    ctx.moveTo(o.x + o.w / 2, o.top + o.h)
    ctx.lineTo(o.x + o.w / 2, GROUND_Y)
    ctx.stroke()
    ctx.setLineDash([])
  }
  drawBook(ctx, R(o.x), o.top, o.w, o.h, COLORS.book1)
}

// ---------------------------------------------------------------- registry
export const OBSTACLES: Record<ObstacleKind, ObstacleDef> = {
  rock: {
    variants: [{ w: 30, h: 26 }, { w: 42, h: 34 }],
    padX: 0.14, padTop: 0.14, minDifficulty: 0, weight: 10, draw: drawRock,
  },
  box: {
    variants: [{ w: 46, h: 44 }, { w: 54, h: 56 }],
    padX: 0.14, padTop: 0.1, minDifficulty: 0, weight: 9, draw: drawBox,
  },
  pot: {
    variants: [{ w: 38, h: 46 }, { w: 44, h: 54 }],
    padX: 0.18, padTop: 0.08, minDifficulty: 0.04, weight: 6, draw: drawPot,
  },
  keyboard: {
    variants: [{ w: 86, h: 22 }, { w: 104, h: 24 }],
    padX: 0.08, padTop: 0.12, minDifficulty: 0.08, weight: 6, wide: true, draw: drawKeyboard,
  },
  coffeeStack: {
    variants: [{ w: 30, h: 52, units: 2 }, { w: 30, h: 78, units: 3 }],
    padX: 0.18, padTop: 0.06, minDifficulty: 0.15, weight: 5, draw: drawCoffeeStack,
  },
  bookStack: {
    variants: [
      { w: 46, h: 44, units: 2 },
      { w: 46, h: 66, units: 3 },
      { w: 46, h: 88, units: 4 },
    ],
    padX: 0.12, padTop: 0.06, minDifficulty: 0.18, weight: 5, draw: drawBookStack,
  },
  chair: {
    variants: [{ w: 46, h: 66 }, { w: 50, h: 74 }],
    padX: 0.16, padTop: 0.08, minDifficulty: 0.2, weight: 4, draw: drawChair,
  },
  bin: {
    variants: [{ w: 52, h: 60 }, { w: 60, h: 68 }],
    padX: 0.14, padTop: 0.1, minDifficulty: 0.25, weight: 4, wide: true, draw: drawBin,
  },
  bug: {
    variants: [{ w: 24, h: 16 }],
    padX: 0.16, padTop: 0.16, minDifficulty: 0.28, weight: 4, special: 'bug', draw: drawBug,
  },
  rollingCup: {
    variants: [{ w: 32, h: 34 }],
    padX: 0.16, padTop: 0.12, minDifficulty: 0.3, weight: 3, special: 'rolling', draw: drawRollingCup,
  },
  fallingBook: {
    variants: [{ w: 46, h: 26 }],
    padX: 0.12, padTop: 0.12, minDifficulty: 0.34, weight: 3, special: 'falling', draw: drawFallingBook,
  },
  barrier: {
    variants: [{ w: 72, h: 56 }, { w: 88, h: 64 }],
    padX: 0.12, padTop: 0.1, minDifficulty: 0.4, weight: 4, wide: true, draw: drawBarrier,
  },
  movingChair: {
    variants: [{ w: 46, h: 66 }],
    padX: 0.2, padTop: 0.08, minDifficulty: 0.46, weight: 2, special: 'moving', draw: drawChair,
  },
  laptop: {
    variants: [{ w: 74, h: 54 }],
    padX: 0.12, padTop: 0.12, minDifficulty: 0.55, weight: 2, wide: true, draw: drawLaptop,
  },
  paper: {
    variants: [{ w: 62, h: 92 }],
    padX: 0.16, padTop: 0.08, minDifficulty: 0.62, weight: 2, draw: drawPaper,
  },
}

export const ALL_KINDS = Object.keys(OBSTACLES) as ObstacleKind[]

/** Build an obstacle instance at world x, choosing size + wiring any motion state. */
export function makeObstacle(kind: ObstacleKind, variant: number, x: number): Obstacle {
  const def = OBSTACLES[kind]
  const v = def.variants[Math.min(variant, def.variants.length - 1)]
  const w = v.w
  const h = v.h
  const units = v.units ?? 1
  let top = GROUND_Y - h
  let vx = 0
  let motion: Obstacle['motion']

  switch (def.special) {
    case 'rolling':
      vx = ROLL_EXTRA_VX
      motion = { type: 'rolling', spin: 0 }
      break
    case 'falling':
      top = GROUND_Y - h - BOOK_FALL_HEIGHT
      motion = { type: 'falling', targetTop: GROUND_Y - h, vy: 0 }
      break
    case 'moving':
      motion = { type: 'moving', amp: CHAIR_WOBBLE_AMP, phase: Math.random() * Math.PI * 2, freq: 1.6 }
      break
    case 'bug': {
      const baseTop = GROUND_Y - h - 18
      top = baseTop
      motion = { type: 'bug', baseTop, phase: Math.random() * Math.PI * 2 }
      break
    }
  }

  return { kind, baseX: x, x, w, h, units, top, vx, padX: def.padX, padTop: def.padTop, scored: false, motion }
}
