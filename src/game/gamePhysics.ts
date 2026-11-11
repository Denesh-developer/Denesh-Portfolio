/**
 * Pure physics + collision helpers. Deterministic and frame-rate independent:
 * the engine steps these with a FIXED timestep, so behaviour is identical at
 * 60Hz, 120Hz, or a throttled background tab.
 */
import type { Obstacle, Player } from './gameTypes'
import {
  GRAVITY,
  GROUND_Y,
  JUMP_VELOCITY,
  PLAYER_DISPLAY_H,
  PLAYER_DISPLAY_W,
  PLAYER_HITBOX,
  PLAYER_X,
} from './gameConstants'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Advance the player one fixed step under gravity, clamping to the ground. */
export function integratePlayer(p: Player, dt: number) {
  p.vy += GRAVITY * dt
  p.y += p.vy * dt
  if (p.y >= GROUND_Y) {
    p.y = GROUND_Y
    p.vy = 0
    p.grounded = true
  } else {
    p.grounded = false
  }
}

/** Start a jump if grounded. Returns true if the jump actually launched. */
export function launchJump(p: Player): boolean {
  if (!p.grounded) return false
  p.vy = JUMP_VELOCITY
  p.grounded = false
  return true
}

/** Player collision box in world coords — a torso slab anchored to the feet. */
export function playerHitbox(p: Player): Rect {
  const spriteTop = p.y - PLAYER_DISPLAY_H
  return {
    x: PLAYER_X + PLAYER_HITBOX.fx * PLAYER_DISPLAY_W,
    y: spriteTop + PLAYER_HITBOX.fy * PLAYER_DISPLAY_H,
    w: PLAYER_HITBOX.fw * PLAYER_DISPLAY_W,
    h: PLAYER_HITBOX.fh * PLAYER_DISPLAY_H,
  }
}

/**
 * Obstacle collision box — inset from the artwork by each type's own padding
 * (see obstacleTypes) so gameplay feels fair rather than pixel-perfect punishing.
 * Uses the obstacle's live `top`, so falling books / bobbing bugs collide where
 * they actually are.
 */
export function obstacleHitbox(o: Obstacle): Rect {
  const insetX = o.w * o.padX
  const insetTop = o.h * o.padTop
  return {
    x: o.x + insetX,
    y: o.top + insetTop,
    w: o.w - insetX * 2,
    h: o.h - insetTop,
  }
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
