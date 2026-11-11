// Zooms the board into the workflow section and captures screenshots at
// ~100/150/200% board zoom for close-up visual inspection.
const APP = 'http://localhost:5173/'
const BASE = 'http://127.0.0.1:9224'
const OUTDIR =
  'C:/Users/jayas/AppData/Local/Temp/claude/c--Users-jayas-kesavan-portfolio/21b95908-39ce-43d3-a58f-10a2bdb6199a/scratchpad/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
import { writeFile } from 'node:fs/promises'

async function waitDbg() {
  for (let i = 0; i < 40; i++) {
    try { await (await fetch(BASE + '/json/version')).json(); return } catch {}
    await sleep(250)
  }
  throw new Error('no debugger')
}
async function target() {
  const l = await (await fetch(BASE + '/json')).json()
  return l.find((t) => t.type === 'page' && t.url.includes('localhost:5173')) || l.find((t) => t.type === 'page')
}
let idc = 0
const pending = new Map()
const errors = []
function rpc(ws, method, params = {}) {
  const id = ++idc
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((res, rej) => { pending.set(id, { res, rej, method }); setTimeout(() => rej(new Error('timeout ' + method)), 8000) })
}
async function ev(ws, expression) {
  const r = await rpc(ws, 'Runtime.evaluate', { expression, returnByValue: true })
  return r.result?.value
}
async function wheel(ws, x, y, dy) { await rpc(ws, 'Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy, button: 'none' }) }
async function zoomTo(ws, x, y, targetPct) {
  for (let i = 0; i < 60; i++) {
    const pct = parseInt((await ev(ws, "document.querySelector('.zc-pct')?.textContent")) || '0')
    if (pct >= targetPct) break
    await wheel(ws, x, y, -60)
    await sleep(70)
  }
  await sleep(400)
}
async function shot(ws, name) {
  const r = await rpc(ws, 'Page.captureScreenshot', { format: 'png' })
  await writeFile(OUTDIR + name, Buffer.from(r.data, 'base64'))
}

async function main() {
  await waitDbg()
  const t = await target()
  const ws = new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(p.method + ': ' + m.error.message)) : p.res(m.result) }
    else if (m.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text))
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error')
  }
  await rpc(ws, 'Runtime.enable')
  await rpc(ws, 'Page.enable')
  await rpc(ws, 'Page.navigate', { url: APP })
  for (let i = 0; i < 40; i++) { await sleep(250); if (await ev(ws, "!!document.querySelector('.workflow-section')")) break }
  await sleep(2000)

  const fit = async () => {
    await ev(ws, "[...document.querySelectorAll('.zc-text')].find(b=>b.textContent==='Fit')?.click()")
    await sleep(900)
  }
  const cx = await ev(ws, 'Math.round(window.innerWidth/2)')
  const cy = await ev(ws, 'Math.round(window.innerHeight/2)')

  await fit(ws)
  await shot(ws, 'fix-fit.png')
  console.log('fit at', await ev(ws, "document.querySelector('.zc-pct')?.textContent"))

  // zoom all the way out to check the grid fills the whole viewport
  for (let i = 0; i < 40; i++) {
    await wheel(ws, cx, cy, 120)
    await sleep(45)
  }
  await sleep(500)
  await shot(ws, 'fix-zoomout.png')
  console.log('zoomout at', await ev(ws, "document.querySelector('.zc-pct')?.textContent"))

  // zoom in to max to confirm the new cap
  await fit(ws)
  for (let i = 0; i < 40; i++) {
    await wheel(ws, cx, cy, -120)
    await sleep(45)
  }
  console.log('maxzoom at', await ev(ws, "document.querySelector('.zc-pct')?.textContent"))
  console.log('consoleErrors:', errors.length)
  ws.close()
}
main().catch((e) => { console.error('SHOT FAILED:', e.message); process.exit(1) })
