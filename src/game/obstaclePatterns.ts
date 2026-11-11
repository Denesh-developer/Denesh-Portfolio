/**
 * The spawn director. Instead of random single obstacles, it composes short,
 * always-clearable PATTERNS (1–3 obstacles) plus optional collectible arcs, based
 * on difficulty / speed / the previous pattern.
 *
 * Fairness is guaranteed by physics: every inter-obstacle gap is ≥ safeGap(speed),
 * which is the horizontal distance the player covers in one jump arc (plus a
 * reaction margin), so there is always time to land and jump again. Collectibles
 * are only ever placed in free gaps at heights inside the jump arc.
 */
import { GRAVITY, GROUND_Y, JUMP_VELOCITY, ROLL_EXTRA_VX } from './gameConstants'
import { ALL_KINDS, OBSTACLES } from './obstacleTypes'
import type { ObstacleKind } from './gameTypes'

const AIRTIME = (2 * Math.abs(JUMP_VELOCITY)) / GRAVITY // ≈ 0.73s

/** Edge-to-edge distance the player needs to land and re-jump at this speed. */
export function safeGap(effSpeed: number): number {
  return effSpeed * (AIRTIME + 0.12) + 38
}

function effSpeed(kind: ObstacleKind, speed: number): number {
  return OBSTACLES[kind].special === 'rolling' ? speed + ROLL_EXTRA_VX : speed
}

export interface PatternItem {
  kind: ObstacleKind
  variant: number
  dx: number // left edge offset from the pattern's spawn x
  w: number
  h: number
}
export interface PatternCollectible {
  dx: number
  y: number
}
export interface SpawnPattern {
  items: PatternItem[]
  collectibles: PatternCollectible[]
  span: number // right edge of the last obstacle, relative to spawn x
  leadGap: number // extra gap before the next pattern
  signature: string
}
export interface DirectorInput {
  difficulty: number
  speed: number
  prevSignature: string
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

function eligibleKinds(difficulty: number): ObstacleKind[] {
  return ALL_KINDS.filter((k) => OBSTACLES[k].minDifficulty <= difficulty)
}

function pickWeighted(pool: ObstacleKind[]): ObstacleKind {
  let total = 0
  for (const k of pool) total += OBSTACLES[k].weight
  let r = Math.random() * total
  for (const k of pool) {
    r -= OBSTACLES[k].weight
    if (r <= 0) return k
  }
  return pool[pool.length - 1]
}

/** Larger size variants appear as difficulty rises. */
function pickVariant(kind: ObstacleKind, difficulty: number): number {
  const n = OBSTACLES[kind].variants.length
  if (n === 1) return 0
  const maxV = Math.min(n - 1, Math.floor(difficulty * n))
  // Bias toward the largest unlocked variant at high difficulty.
  return Math.random() < 0.35 + difficulty * 0.4 ? maxV : Math.floor(Math.random() * (maxV + 1))
}

function patternLength(difficulty: number): number {
  const r = Math.random()
  if (difficulty < 0.15) return 1
  if (difficulty < 0.4) return r < 0.6 ? 1 : 2
  if (difficulty < 0.7) return r < 0.35 ? 1 : r < 0.82 ? 2 : 3
  return r < 0.25 ? 1 : r < 0.68 ? 2 : 3
}

function isSpecial(kind: ObstacleKind): boolean {
  return !!OBSTACLES[kind].special
}
function isWide(kind: ObstacleKind): boolean {
  return !!OBSTACLES[kind].wide
}
function isLow(kind: ObstacleKind, h: number): boolean {
  return h <= 30 && !isSpecial(kind) && kind !== 'bug'
}

/** Free x-ranges (relative to spawn x) not occupied by an obstacle, within [0, end]. */
function freeGaps(items: PatternItem[], end: number): Array<[number, number]> {
  const occ = items.map((it) => [it.dx, it.dx + it.w] as [number, number]).sort((a, b) => a[0] - b[0])
  const gaps: Array<[number, number]> = []
  let cursor = 0
  for (const [s, e] of occ) {
    if (s - cursor > 0) gaps.push([cursor, s])
    cursor = Math.max(cursor, e)
  }
  if (end - cursor > 0) gaps.push([cursor, end])
  return gaps
}

function buildCollectibles(items: PatternItem[], span: number, leadGap: number): PatternCollectible[] {
  if (Math.random() > 0.58) return []
  const out: PatternCollectible[] = []

  // Sometimes float beans in an arc above a low obstacle (jump-and-grab).
  const low = items.find((it) => isLow(it.kind, it.h))
  if (low && Math.random() < 0.45) {
    const cx = low.dx + low.w / 2
    for (let i = -1; i <= 1; i++) {
      out.push({ dx: cx + i * 34, y: GROUND_Y - (low.h + 70) - (1 - Math.abs(i)) * 26 })
    }
    return out
  }

  // Otherwise drop a single bean or a 3-bean arc into the widest free gap.
  const gaps = freeGaps(items, span + leadGap)
  gaps.sort((a, b) => b[1] - b[0] - (a[1] - a[0]))
  const gap = gaps[0]
  if (!gap || gap[1] - gap[0] < 90) return out
  const mid = (gap[0] + gap[1]) / 2
  if (gap[1] - gap[0] > 150 && Math.random() < 0.6) {
    for (let i = -1; i <= 1; i++) out.push({ dx: mid + i * 36, y: GROUND_Y - 95 - (1 - Math.abs(i)) * 40 })
  } else {
    out.push({ dx: mid, y: GROUND_Y - rand(70, 130) })
  }
  return out
}

export function getNextPattern(input: DirectorInput): SpawnPattern {
  const { difficulty, speed } = input
  const eligible = eligibleKinds(difficulty)

  const build = (): SpawnPattern => {
    const len = patternLength(difficulty)
    const kinds: ObstacleKind[] = []
    let usedSpecial = false
    for (let i = 0; i < len; i++) {
      // Constrain the pool: at most one special, no two wide obstacles adjacent.
      let pool = eligible.filter((k) => {
        if (usedSpecial && isSpecial(k)) return false
        if (i > 0 && isWide(k) && isWide(kinds[i - 1])) return false
        return true
      })
      // Avoid repeating the immediately previous kind when there's an alternative.
      if (i > 0) {
        const alt = pool.filter((k) => k !== kinds[i - 1])
        if (alt.length) pool = alt
      }
      if (!pool.length) pool = eligible
      const kind = pickWeighted(pool)
      if (isSpecial(kind)) usedSpecial = true
      kinds.push(kind)
    }

    const items: PatternItem[] = []
    let cursor = 0
    for (let i = 0; i < kinds.length; i++) {
      const kind = kinds[i]
      const variant = pickVariant(kind, difficulty)
      const v = OBSTACLES[kind].variants[variant]
      items.push({ kind, variant, dx: cursor, w: v.w, h: v.h })
      cursor += v.w
      if (i < kinds.length - 1) {
        const gapSpeed = Math.max(effSpeed(kind, speed), effSpeed(kinds[i + 1], speed))
        cursor += safeGap(gapSpeed) * rand(1.0, 1.35)
      }
    }
    const span = cursor
    const leadGap = safeGap(speed) * rand(1.05, 1.9)
    const collectibles = buildCollectibles(items, span, leadGap)
    const signature = kinds.join('-')
    return { items, collectibles, span, leadGap, signature }
  }

  let pat = build()
  if (pat.signature === input.prevSignature) pat = build() // one re-roll to avoid immediate repeats
  return pat
}
