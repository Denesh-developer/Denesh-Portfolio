import sharp from 'sharp'
import { readFile, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const WF = 'C:/Users/jayas/AppData/Local/Temp/claude/c--Users-jayas-kesavan-portfolio/21b95908-39ce-43d3-a58f-10a2bdb6199a/scratchpad/wf'
const WFD = 'C:/Users/jayas/AppData/Local/Temp/claude/c--Users-jayas-kesavan-portfolio/21b95908-39ce-43d3-a58f-10a2bdb6199a/scratchpad/wfd'
const OUT = 'public/assets/workflow'
const DEC = 'public/assets/workflow/decorations'

// Developer character is pixel art — re-export LOSSLESS (hard edges) at higher res.
const devSrc = join(WF, 'developer.bin')
await sharp(devSrc).resize({ height: 768, withoutEnlargement: true }).webp({ lossless: true }).toFile(join(OUT, 'developer.webp'))
const dm = await sharp(join(OUT, 'developer.webp')).metadata()
console.log('developer.webp (lossless):', dm.width + 'x' + dm.height, Math.round((await stat(join(OUT, 'developer.webp'))).size / 1024) + 'KB')

// rocket doodle (PNG) -> webp
await sharp(join(WFD, 'rocket.bin')).resize({ width: 256, withoutEnlargement: true }).webp({ quality: 90 }).toFile(join(DEC, 'rocket.webp'))
const rm = await sharp(join(DEC, 'rocket.webp')).metadata()
console.log('rocket.webp:', rm.width + 'x' + rm.height)

// note stickies are SVG -> copy
for (const n of ['note1', 'note2']) {
  await writeFile(join(DEC, n + '.svg'), await readFile(join(WFD, n + '.bin')))
}
console.log('notes copied')
