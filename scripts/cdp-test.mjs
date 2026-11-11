// Drives the running app through the Edge DevTools Protocol to verify
// interactions: console cleanliness, wheel-zoom, and sticker drag (without
// panning the board). No external deps — uses Node's global fetch + WebSocket.
const APP = 'http://localhost:5173/'
const BASE = 'http://127.0.0.1:9222'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForDebugger() {
  for (let i = 0; i < 40; i++) {
    try {
      const v = await (await fetch(BASE + '/json/version')).json()
      if (v) return
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  throw new Error('debugger not reachable on 9222')
}

async function getPageTarget() {
  const list = await (await fetch(BASE + '/json')).json()
  return (
    list.find((t) => t.type === 'page' && t.url.includes('localhost:5173')) ||
    list.find((t) => t.type === 'page') ||
    list[0]
  )
}

let idc = 0
const pending = new Map()
const errors = []

function rpc(ws, method, params = {}) {
  const id = ++idc
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((res, rej) => {
    pending.set(id, { res, rej, method })
    setTimeout(() => rej(new Error('timeout ' + method)), 8000)
  })
}

async function evaluate(ws, expression) {
  const r = await rpc(ws, 'Runtime.evaluate', { expression, returnByValue: true })
  return r.result?.value
}

async function mouse(ws, type, x, y, extra = {}) {
  await rpc(ws, 'Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: 1, ...extra })
}

async function main() {
  await waitForDebugger()
  const target = await getPageTarget()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id)
      pending.delete(m.id)
      m.error ? p.rej(new Error(p.method + ': ' + m.error.message)) : p.res(m.result)
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      errors.push('console.error: ' + m.params.args.map((a) => a.value ?? a.description).join(' '))
    } else if (m.method === 'Runtime.exceptionThrown') {
      errors.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text))
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      errors.push('log.error: ' + m.params.entry.text)
    }
  }

  await rpc(ws, 'Runtime.enable')
  await rpc(ws, 'Log.enable')
  await rpc(ws, 'Page.enable')
  await rpc(ws, 'Page.navigate', { url: APP })
  // wait for the app's zoom control to appear
  for (let i = 0; i < 40; i++) {
    await sleep(250)
    if (await evaluate(ws, "!!document.querySelector('.zc-pct')")) break
  }
  await sleep(1500) // let fonts/images/fit settle

  const results = {}

  // Body must not scroll.
  results.noBodyScroll = await evaluate(
    ws,
    'document.body.scrollHeight <= window.innerHeight + 1 && document.body.scrollWidth <= window.innerWidth + 1',
  )

  // Grid present.
  results.gridPresent = await evaluate(
    ws,
    "getComputedStyle(document.querySelector('.board-canvas')).backgroundImage.includes('gradient')",
  )

  // Initial zoom %.
  results.initialZoom = await evaluate(ws, "document.querySelector('.zc-pct')?.textContent")

  // --- Wheel zoom over canvas center ---
  const cx = await evaluate(ws, 'Math.round(window.innerWidth/2)')
  const cy = await evaluate(ws, 'Math.round(window.innerHeight/2)')
  for (let i = 0; i < 6; i++) {
    await mouse(ws, 'mouseWheel', cx, cy, { deltaX: 0, deltaY: -120 })
    await sleep(80)
  }
  await sleep(500)
  results.zoomAfterWheel = await evaluate(ws, "document.querySelector('.zc-pct')?.textContent")

  // Reset via Fit to a known state.
  await evaluate(ws, "[...document.querySelectorAll('.zc-text')].find(b=>b.textContent==='Fit')?.click()")
  await sleep(700)

  // --- Drag the keyboard sticker; board must NOT pan ---
  const boardTransformBefore = await evaluate(
    ws,
    "getComputedStyle(document.querySelector('.react-transform-component')).transform",
  )
  results.keyboardExists = await evaluate(ws, "!!document.getElementById('board-item-keyboard')")
  const rect = await evaluate(
    ws,
    "(()=>{const e=document.getElementById('board-item-keyboard');if(!e)return null;const r=e.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()",
  )
  if (!rect) {
    results.stickerMoved = 'SKIPPED — keyboard element not found'
    results.boardDidNotPanDuringDrag = 'SKIPPED'
    results.consoleErrors = errors
    console.log(JSON.stringify(results, null, 2))
    ws.close()
    return
  }
  const kbTransformBefore = await evaluate(
    ws,
    "getComputedStyle(document.getElementById('board-item-keyboard')).transform",
  )
  await mouse(ws, 'mousePressed', rect.x, rect.y)
  await sleep(30)
  for (let i = 1; i <= 8; i++) {
    await mouse(ws, 'mouseMoved', rect.x + i * 12, rect.y + i * 6, { buttons: 1 })
    await sleep(16)
  }
  await mouse(ws, 'mouseReleased', rect.x + 96, rect.y + 48)
  await sleep(200)
  const kbTransformAfter = await evaluate(
    ws,
    "getComputedStyle(document.getElementById('board-item-keyboard')).transform",
  )
  const boardTransformAfter = await evaluate(
    ws,
    "getComputedStyle(document.querySelector('.react-transform-component')).transform",
  )
  results.stickerMoved = kbTransformBefore !== kbTransformAfter
  results.boardDidNotPanDuringDrag = boardTransformBefore === boardTransformAfter

  // --- Open a project via click (no drag) ---
  const worksRect = await evaluate(
    ws,
    "(()=>{const r=document.getElementById('board-item-works').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()",
  )
  await mouse(ws, 'mousePressed', worksRect.x, worksRect.y)
  await sleep(30)
  await mouse(ws, 'mouseReleased', worksRect.x, worksRect.y)
  await sleep(800)
  results.modalOpened = await evaluate(ws, "!!document.querySelector('.modal[role=dialog]')")
  // Escape closes
  await rpc(ws, 'Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await rpc(ws, 'Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await sleep(700)
  results.modalClosedOnEscape = await evaluate(ws, "!document.querySelector('.modal[role=dialog]')")

  results.consoleErrors = errors

  console.log(JSON.stringify(results, null, 2))
  ws.close()
}

main().catch((e) => {
  console.error('CDP TEST FAILED:', e.message)
  process.exit(1)
})
