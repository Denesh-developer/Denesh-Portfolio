import sharp from 'sharp'
import { join } from 'node:path'

const OUT = 'public/assets/workflow'
const names = ['idea', 'plan', 'design', 'build', 'automate', 'deploy', 'monitor', 'title-paper', 'tagline', 'developer']
const cell = 220
const cols = 5
const rows = Math.ceil(names.length / cols)

const tiles = await Promise.all(
  names.map(async (n, i) => {
    const buf = await sharp(join(OUT, n + '.webp'))
      .resize({ width: cell - 20, height: cell - 40, fit: 'inside' })
      .extend({ top: 0, bottom: 0, left: 0, right: 0 })
      .png()
      .toBuffer()
    const labelled = await sharp({
      create: { width: cell, height: cell, channels: 4, background: '#ffffff' },
    })
      .composite([{ input: buf, gravity: 'center' }, {
        input: Buffer.from(
          `<svg width="${cell}" height="${cell}"><text x="6" y="18" font-size="16" fill="#c00" font-family="sans-serif">${i}:${n}</text></svg>`,
        ),
        top: 0,
        left: 0,
      }])
      .png()
      .toBuffer()
    return { input: labelled, top: Math.floor(i / cols) * cell, left: (i % cols) * cell }
  }),
)

await sharp({
  create: { width: cols * cell, height: rows * cell, channels: 4, background: '#eeeeee' },
})
  .composite(tiles)
  .png()
  .toFile('C:/Users/jayas/AppData/Local/Temp/claude/c--Users-jayas-kesavan-portfolio/21b95908-39ce-43d3-a58f-10a2bdb6199a/scratchpad/wf-montage.png')
console.log('montage written')
