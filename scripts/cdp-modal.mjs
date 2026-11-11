// Opens the Experience card's modal (work-history timeline) and screenshots it.
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
  return new Promise((res, rej) => { pending.set(id, { res, rej, method }); setTimeout(() => rej(new Error('timeout ' + method)), 10000) })
}
async function ev(ws, expression) {
  const r = await rpc(ws, 'Runtime.evaluate', { expression, returnByValue: true })
  return r.result?.value
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
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(p.method + ': ' + m.error.message)) : p.res(m.result) }
  }
  await rpc(ws, 'Runtime.enable')
  await rpc(ws, 'Page.enable')
  await rpc(ws, 'Emulation.setDeviceMetricsOverride', { width: 1200, height: 1000, deviceScaleFactor: 2, mobile: false })
  await rpc(ws, 'Page.navigate', { url: APP })
  for (let i = 0; i < 40; i++) { await sleep(250); if (await ev(ws, "!!document.querySelector('#board-item-experience')")) break }
  await sleep(1200)

  // Trigger the card's activate() via keyboard (bubbles to React root listener).
  await ev(ws, `(() => { const el=document.querySelector('#board-item-experience'); el.focus(); el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); return true; })()`)
  let ok = false
  for (let i = 0; i < 20; i++) { await sleep(150); if (await ev(ws, "!!document.querySelector('[role=\\'dialog\\']')")) { ok = true; break } }
  console.log('dialog open:', ok)
  await sleep(500)

  const j = await ev(ws, `(() => { const el=document.querySelector('[role=\\'dialog\\']'); if(!el) return null; const r=el.getBoundingClientRect(); return JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height}); })()`)
  if (j) {
    const r = JSON.parse(j)
    await shot(ws, 'modal-timeline.png', { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: r.w + 12, height: r.h + 12 })
  } else {
    await shot(ws, 'modal-fullpage.png')
  }
  ws.close()
}
main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
