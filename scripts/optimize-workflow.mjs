// Optimizes the individual workflow sticker sources (high-res PNGs) to WebP,
// capped at 512px on the long edge — enough to stay sharp at the board's max
// 2.5x zoom while keeping files small. The vector sticker is copied as SVG.
import sharp from 'sharp'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const SRC =
  'C:/Users/jayas/AppData/Local/Temp/claude/c--Users-jayas-kesavan-portfolio/21b95908-39ce-43d3-a58f-10a2bdb6199a/scratchpad/wf'
const OUT = 'public/assets/workflow'
await mkdir(OUT, { recursive: true })

const pngNames = [
  'idea',
  'plan',
  'design',
  'build',
  'automate',
  'deploy',
  'monitor',
  'title-paper',
  'tagline',
  'developer',
]

const rows = []
for (const n of pngNames) {
  const inp = join(SRC, n + '.bin')
  const out = join(OUT, n + '.webp')
  const meta = await sharp(inp).metadata()
  await sharp(inp)
    .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, effort: 5 })
    .toFile(out)
  const outMeta = await sharp(out).metadata()
  rows.push({
    name: n,
    src: `${meta.width}x${meta.height}`,
    out: `${outMeta.width}x${outMeta.height}`,
    kb: Math.round((await stat(out)).size / 1024),
  })
}

const svg = await readFile(join(SRC, 'works-on-my-machine.bin'))
await writeFile(join(OUT, 'works-on-my-machine.svg'), svg)
rows.push({ name: 'works-on-my-machine', src: 'svg', out: 'svg', kb: Math.round(svg.length / 1024) })

console.table(rows)
