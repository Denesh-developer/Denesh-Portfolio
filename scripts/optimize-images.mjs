// Converts the large decorative PNGs in public/assets to WebP (transparency
// preserved). Originals are kept in place; references are updated separately.
import sharp from 'sharp'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const dir = 'public/assets'
const files = (await readdir(dir)).filter((f) => f.endsWith('.png'))

let totalBefore = 0
let totalAfter = 0
const rows = []

for (const f of files) {
  const inp = join(dir, f)
  const out = join(dir, f.replace(/\.png$/, '.webp'))
  const before = (await stat(inp)).size
  await sharp(inp).webp({ quality: 82, effort: 5 }).toFile(out)
  const after = (await stat(out)).size
  totalBefore += before
  totalAfter += after
  rows.push({
    file: f,
    beforeKB: Math.round(before / 1024),
    afterKB: Math.round(after / 1024),
    saved: Math.round((1 - after / before) * 100) + '%',
  })
}

console.table(rows)
console.log(
  `TOTAL: ${Math.round(totalBefore / 1024)} KB -> ${Math.round(totalAfter / 1024)} KB ` +
    `(${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`,
)
