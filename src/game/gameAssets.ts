/**
 * Preloads the player sprites (built by scripts/build-game-sprites.mjs from the
 * existing Figma running frames). Loaded lazily — only when the game overlay
 * mounts — so the portfolio's initial bundle/network cost is unchanged.
 *
 * Every environment element (ground, hills, clouds, crates, bushes, rocks, the
 * coffee collectible, particles) is drawn programmatically on the canvas, so
 * there are no other image assets to fetch.
 */

export interface GameAssets {
  /** Two-frame run cycle — identical canvas + baseline (feet never drift). */
  run: [HTMLImageElement, HTMLImageElement]
  /** Waving pose for the GAME OVER screen (decorative). */
  hi: HTMLImageElement
}

const SRC = {
  run1: '/game/player/run-1.png',
  run2: '/game/player/run-2.png',
  hi: '/game/player/hi.png',
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    // Resolve on error too so one missing file can't hang the loader forever.
    img.onload = () => resolve(img)
    img.onerror = () => resolve(img)
    img.src = src
  })
}

let cache: Promise<GameAssets> | null = null

export function loadGameAssets(): Promise<GameAssets> {
  if (cache) return cache
  cache = Promise.all([load(SRC.run1), load(SRC.run2), load(SRC.hi)]).then(
    ([run1, run2, hi]) => ({ run: [run1, run2], hi }),
  )
  return cache
}

/** Warm the sprite cache ahead of time (called on running-sticker hover). */
export function preloadGameAssets() {
  void loadGameAssets()
}
