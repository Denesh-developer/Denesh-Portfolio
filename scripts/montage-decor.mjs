import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const SRC = 'C:/Users/jayas/AppData/Local/Temp/claude/c--Users-jayas-kesavan-portfolio/21b95908-39ce-43d3-a58f-10a2bdb6199a/scratchpad/wfd'
const OUT = 'C:/Users/jayas/AppData/Local/Temp/claude/c--Users-jayas-kesavan-portfolio/21b95908-39ce-43d3-a58f-10a2bdb6199a/scratchpad/decor-montage.png'

async function raster(name, w, h) {
  const buf = await readFile(join(SRC, name + '.bin'))
  return sharp(buf, { density: 300 }).resize({ width: w, height: h, fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
}

const names = ['devmode-base', 'devmode-sticker', 'rocket', 'heart-doodle', 'speech-bubble', 'arrow9', 'pin', 'vector6', 'vector7', 'line1', 'line2']
const cell = 230
const cols = 4
const rows = Math.ceil((names.length + 1) / cols)

const tiles = []
// composite dev mode (base + sticker) as an extra tile
{
  const base = await raster('devmode-base', 180, 108)
  const sticker = await sharp(await readFile(join(SRC, 'devmode-sticker.bin')), { density: 300 }).resize({ width: 160, fit: 'inside' }).png().toBuffer()
  const combo = await sharp({ create: { width: 180, height: 120, channels: 4, background: '#dddddd' } })
    .composite([{ input: base, gravity: 'center' }, { input: sticker, gravity: 'center' }])
    .png()
    .toBuffer()
  tiles.push({ label: 'DEVMODE combo', input: combo })
}
for (const n of names) tiles.push({ label: n, input: await raster(n, cell - 24, cell - 60) })

const composites = []
for (let i = 0; i < tiles.length; i++) {
  const t = await sharp({ create: { width: cell, height: cell, channels: 4, background: '#cccccc' } })
    .composite([
      { input: tiles[i].input, gravity: 'center' },
      { input: Buffer.from(`<svg width="${cell}" height="${cell}"><text x="6" y="18" font-size="15" fill="#00c">${i}:${tiles[i].label}</text></svg>`), top: 0, left: 0 },
    ])
    .png()
    .toBuffer()
  composites.push({ input: t, top: Math.floor(i / cols) * cell, left: (i % cols) * cell })
}

await sharp({ create: { width: cols * cell, height: rows * cell, channels: 4, background: '#999999' } }).composite(composites).png().toFile(OUT)
console.log('decor montage written')
