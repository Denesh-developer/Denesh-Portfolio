/**
 * Build the "Kesavan's Run" player sprites from the existing normalized Figma
 * running frames (public/animations/running/*.png — 1200×988, grass platform
 * baked at y=795 in EVERY frame).
 *
 * The game has its own ground, so the baked grass/dirt platform and the dust
 * trail are cropped away, leaving a clean character on a SHARED canvas whose
 * bottom edge is the feet-contact line (grass top, y=795). Because run-1 and
 * run-2 use the identical crop box, the collision box and baseline are pixel-
 * identical between frames — the feet never drift (the alignment-bug guard).
 *
 *   Gameplay frames (share one 567×646 box → 0.8777 aspect):
 *     run-1.png, run-2.png   feet anchored to the bottom edge
 *   Decorative:
 *     hi.png                 waving pose for the GAME OVER screen (own box)
 *
 * Re-run after re-exporting the source frames:  node scripts/build-game-sprites.mjs
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const SRC = 'public/animations/running'
const OUT = 'public/game/player'
await mkdir(OUT, { recursive: true })

// Shared gameplay crop: keeps the whole body, drops grass (y≥795) + trailing dust (x<395).
const RUN_BOX = { left: 395, top: 150, width: 962 - 395, height: 796 - 150 } // 567 × 646
const RUN_OUT_H = 420 // downscale for filesize; ample for a ~132px-tall in-game draw on hi-dpi

/**
 * Erase leftover grass-blade / dust specks in the bottom-LEFT corner. The
 * planted (low) foot is always on the bottom-RIGHT in the run cycle, so the
 * bottom-left corner never contains the character — safe to clear.
 */
async function eraseCorner(buf, yFrac) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  for (let y = Math.floor(H * yFrac); y < H; y++) {
    for (let x = 0; x < Math.floor(W * 0.15); x++) {
      data[(y * W + x) * C + 3] = 0 // clear alpha
    }
  }
  return sharp(data, { raw: { width: W, height: H, channels: C } }).png()
}

async function buildRunFrame(name, yFrac) {
  const cropped = await sharp(`${SRC}/${name}.png`).extract(RUN_BOX).png().toBuffer()
  await (await eraseCorner(cropped, yFrac))
    .resize({ height: RUN_OUT_H }) // lanczos; frames are smooth-shaded, not low-res pixels
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${name}.png`)
}

await buildRunFrame('run-1', 0.9)
await buildRunFrame('run-2', 0.83) // run-2 had the larger dust trail

// Decorative waving pose (own crop — the standing/wave poses are taller than a run stride).
await sharp(`${SRC}/hi.png`)
  .extract({ left: 235, top: 20, width: 1000 - 235, height: 794 - 20 }) // 765 × 774
  .resize({ height: 360 })
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}/hi.png`)

console.log('game sprites →', OUT, '(run-1, run-2 share a 567×646 box; hi is decorative)')
