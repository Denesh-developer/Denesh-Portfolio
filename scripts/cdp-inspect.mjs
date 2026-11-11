// Ad-hoc visual inspection: capture the workflow section at a readable zoom and
// a tight clip of the tagline note, to verify text-fit issues. Targets my own
// dev instance on :5174 and Chrome debugger on :9224.
const APP = 'http://localhost:5174/'
const BASE = 'http://127.0.0.1:9224'
const OUTDIR = '/tmp/kesavan-shots/'
import { writeFile, mkdir } from 'node:fs/promises'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let idc = 0
const pending = new Map()
function rpc(ws, method, params = {}) {
  const id = ++idc
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((res, rej) => {
    pending.set(id, { res, rej, method })
    setTimeout(() => rej(new Error('timeout ' + method)), 10000)
  })
}
async function ev(ws, expression) {
  const r = await rpc(ws, 'Runtime.evaluate', { expression, returnByValue: true })
  return r.result?.value
}
async function wheel(ws, x, y, dy) {
  await rpc(ws, 'Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy, button: 'none' })
}
async function shot(ws, name, clip) {
  const params = { format: 'png' }
  if (clip) params.clip = { ...clip, scale: 1 }
  const r = await rpc(ws, 'Page.captureScreenshot', params)
  await writeFile(OUTDIR + name, Buffer.from(r.data, 'base64'))
  console.log('wrote', name)
}

async function main() {
  await mkdir(OUTDIR, { recursive: true })
  const list = await (await fetch(BASE + '/json')).json()
  const t = list.find((x) => x.type === 'page') || list[0]
  const ws = new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id)
      pending.delete(m.id)
      m.error ? p.rej(new Error(p.method + ': ' + m.error.message)) : p.res(m.result)
    }
  }
  await rpc(ws, 'Runtime.enable')
  await rpc(ws, 'Page.enable')
  // Render at 4x pixel density so small board text is legible in tight clips.
  await rpc(ws, 'Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 4, mobile: false })
  await rpc(ws, 'Page.navigate', { url: APP })
  for (let i = 0; i < 40; i++) {
    await sleep(250)
    if (await ev(ws, "!!document.querySelector('.workflow-section')")) break
  }
  await sleep(1500)

  // Fit so the whole workflow panel is on screen
  await ev(ws, "[...document.querySelectorAll('.zc-text')].find(b=>b.textContent==='Fit')?.click()")
  await sleep(900)
  console.log('zoom now', await ev(ws, "document.querySelector('.zc-pct')?.textContent"))
  await shot(ws, '01-board.png')

  // Find the tagline text element by its content and clip a padded box around it.
  const clipFor = async (needle, pad) => {
    const j = await ev(ws, `(() => {
      const el = [...document.querySelectorAll('.workflow-section *')]
        .find(n => n.children.length===0 && n.textContent && n.textContent.includes(${JSON.stringify(needle)}));
      if(!el) return null;
      const r = el.getBoundingClientRect();
      return JSON.stringify({x:r.left, y:r.top, w:r.width, h:r.height});
    })()`)
    if (!j) return null
    const r = JSON.parse(j)
    return { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.w + pad * 2, height: r.h + pad * 2 }
  }

  const tag = await clipFor('I don', 26)
  if (tag) await shot(ws, '02-tagline.png', tag)
  else console.log('tagline element not found')

  // IDEA step label — check rotation
  const idea = await clipFor('Understand the problem', 44)
  if (idea) await shot(ws, '07-idea.png', idea)
  else console.log('idea label not found')

  // MONITOR description — most likely to overflow its sticker
  const mon = await clipFor('collect feedback', 30)
  if (mon) await shot(ws, '03-monitor.png', mon)

  // AUTOMATE description
  const aut = await clipFor('process automation', 30)
  if (aut) await shot(ws, '04-automate.png', aut)

  // Experience project card (by element id) — verify no chrome after SVG swap
  const clipSel = async (sel, pad) => {
    const j = await ev(ws, `(() => { const el=document.querySelector(${JSON.stringify(sel)}); if(!el) return null; const r=el.getBoundingClientRect(); return JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height}); })()`)
    if (!j) return null
    const r = JSON.parse(j)
    return { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.w + pad * 2, height: r.h + pad * 2 }
  }
  const exp = await clipSel('#board-item-experience', 40)
  if (exp) await shot(ws, '05-experience.png', exp)
  else console.log('experience card not found')

  const wrk = await clipSel('#board-item-works', 40)
  if (wrk) await shot(ws, '06-works.png', wrk)
  else console.log('works card not found')
  ws.close()
}
main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
