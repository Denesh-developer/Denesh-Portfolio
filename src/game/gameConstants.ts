/**
 * Tuning + palette for "Kesavan's Run". All gameplay math is in this LOGICAL
 * coordinate space (960×540); the canvas backing store is scaled to fit the
 * viewport at render time, so physics never depend on CSS size or refresh rate.
 */

// ---- Logical resolution (fixed 16:9 game world) --------------------------
export const LOGICAL_W = 960
export const LOGICAL_H = 540

/** Feet-contact baseline. The player sprite's bottom edge sits here on the ground. */
export const GROUND_Y = 454

// ---- Player --------------------------------------------------------------
export const PLAYER_X = 150 // fixed sprite left edge (world scrolls past a stationary runner)
export const PLAYER_SPRITE_ASPECT = 567 / 646 // built crop box (see build-game-sprites.mjs)
export const PLAYER_DISPLAY_H = 140
export const PLAYER_DISPLAY_W = Math.round(PLAYER_DISPLAY_H * PLAYER_SPRITE_ASPECT) // ~123

/**
 * Collision box as fractions of the drawn sprite — deliberately SMALLER than the
 * art (a vertical slab through the torso/legs) so brushing an out-flung arm or
 * trailing foot never kills you. Feet-anchored: the box bottom rides with the feet.
 */
export const PLAYER_HITBOX = { fx: 0.31, fy: 0.1, fw: 0.4, fh: 0.9 }

// ---- Physics -------------------------------------------------------------
export const GRAVITY = 2400 // logical px / s²
export const JUMP_VELOCITY = -880 // apex ≈ 161px above ground; airtime ≈ 0.73s
export const JUMP_BUFFER = 0.12 // s — a jump pressed just before landing still fires
export const MAX_DT = 0.05 // clamp huge frame gaps (tab-out) to avoid tunnelling
export const FIXED_DT = 1 / 120 // fixed physics step; render is decoupled

/** Max obstacle height the standard jump can clear (apex ≈ 161) — the fairness cap. */
export const MAX_CLEARABLE_H = 120

// ---- Difficulty ----------------------------------------------------------
export const SPEED_START = 320 // logical px / s
export const SPEED_MAX = 720
export const SPEED_RAMP = 11 // px/s added per second of play (smooth, capped at MAX)
export const START_SCROLL_SPEED = 190 // cosmetic run-in-place speed on the START screen
/** Seconds to reach full difficulty (variant sizes, combos, specials all unlocked). */
export const DIFFICULTY_RAMP_S = 48

// ---- Scoring -------------------------------------------------------------
export const COIN_VALUE = 25
export const SCORE_PER_PX = 0.1 // distance → score
export const DIST_PER_METRE = 46 // logical px per displayed "metre"
/** +0.1× per 5 coffees, capped. Keeps the multiplier a gentle bonus, never required. */
export const MULT_PER_COINS = 5
export const MULT_STEP = 0.1
export const MULT_MAX = 1.6

// ---- Special-obstacle behaviour -----------------------------------------
export const ROLL_EXTRA_VX = 120 // rolling cup closes distance faster than the world
export const BOOK_FALL_G = 2000 // falling-book gravity
export const BOOK_FALL_HEIGHT = 150 // how far above its resting top a book starts
export const BUG_BOB_AMP = 11
export const CHAIR_WOBBLE_AMP = 16

export const MAX_PARTICLES = 80

// ---- Palette (warm, restrained — reads as the portfolio's paper/pixel world) ----
export const COLORS = {
  sun: '#f7e7c4',
  cloud: '#fbfaf4',
  grassTop: '#78a45f',
  grassMid: '#6b9553',
  grassShade: '#5f8a4b',
  dirt: '#8a6a45',
  dirtDark: '#6f5436',
  ink: '#2b2a28',
  line: '#413d38',
  // obstacles
  rock: '#a2a29c',
  rockShade: '#7f7f79',
  rockLight: '#b9b9b2',
  box: '#c79a5c',
  boxShade: '#a97d43',
  boxTape: '#e6d3ad',
  pot: '#c1734a',
  potShade: '#a25c39',
  plant: '#5f924c',
  plantShade: '#497a3b',
  chair: '#8a5a3c',
  chairShade: '#6c4429',
  bin: '#8f9aa0',
  binShade: '#6f7a80',
  binLid: '#758087',
  barrier: '#d98a3c',
  barrierStripe: '#f2ead6',
  barrierLeg: '#5b5852',
  cup: '#f0e6d2',
  cupShade: '#d9caae',
  coffee: '#6f4a2d',
  book1: '#8a4b57',
  book2: '#4f6d8a',
  book3: '#6d7a45',
  book4: '#8a6d3f',
  bookPage: '#efe6d0',
  keycap: '#4a4f57',
  keycapTop: '#5b626c',
  keyboardBase: '#33373d',
  laptopBody: '#b9bcc2',
  laptopBodyShade: '#9a9da4',
  laptopScreen: '#2b3550',
  laptopGlow: '#6f89c9',
  paper: '#f3efe4',
  paperLine: '#cdbf9e',
  paperInk: '#b06767',
  bug: '#7bb04e',
  bugShade: '#5c8a38',
  bugEye: '#f0e6d2',
  bean: '#7a4a2b',
  beanShade: '#5c371f',
  beanShine: '#c79a6a',
  coffeeSteam: '#cbb48f',
  // particles
  particleDust: '#c9bda3',
  particleCoin: '#c78a3f',
} as const

/**
 * Subtle background "zones" — the sky + hills drift through these as the run
 * progresses (desk → city → coding → mixed). Small tints, not scene swaps.
 */
export interface ZonePalette {
  skyTop: string
  skyBottom: string
  hillFar: string
  hillNear: string
}
export const ZONES: ZonePalette[] = [
  { skyTop: '#eaf0f1', skyBottom: '#f5ecd9', hillFar: '#c3d3bd', hillNear: '#a7c1a1' }, // desk / warm
  { skyTop: '#dfe6ee', skyBottom: '#eee6df', hillFar: '#c2c9d2', hillNear: '#a6afbd' }, // city / cool grey-blue
  { skyTop: '#e6e3ef', skyBottom: '#eae6db', hillFar: '#c4bdd2', hillNear: '#a9a1bd' }, // coding / soft violet
  { skyTop: '#e8eee6', skyBottom: '#f3ecda', hillFar: '#bfd0bd', hillNear: '#a4bf9f' }, // mixed / greens
]
/** Seconds each zone lasts before drifting to the next (loops after the last). */
export const ZONE_DURATION_S = 15
