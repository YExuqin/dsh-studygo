import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const url = process.argv[2]
const out = process.argv[3]
const W = Number(process.argv[4] || 1440)
const H = Number(process.argv[5] || 900)
const clicks = (process.argv[6] || '').split(',').map((s) => s.trim()).filter(Boolean)
if (!url || !out) { console.error('usage: shot.mjs <url> <out.png> [w] [h] [clickText,...]'); process.exit(2) }

const port = 9333 + Math.floor(Math.random() * 60)
const profile = mkdtempSync(join(tmpdir(), 'dsh-shot-'))
const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--disable-extensions',
  '--user-data-dir=' + profile,
  '--remote-debugging-port=' + port,
  '--window-size=' + W + ',' + H,
  'about:blank'
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function endpoint() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + port + '/json/version')
      if (r.ok) return await r.json()
    } catch {}
    await sleep(150)
  }
  throw new Error('edge devtools did not come up')
}

await endpoint()
const target = await (await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent('about:blank'), { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); p(msg) }
})
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej) })
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })

await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
await send('Page.enable')
await send('Runtime.enable')
await send('Page.navigate', { url })
await sleep(6000)

for (const text of clicks) {
  const expr = `(() => { const all = [...document.querySelectorAll('button,a,[role=button],li,div,span')]; const hit = all.filter((e) => (e.textContent || '').trim() === ${JSON.stringify(text)}); const el = hit[hit.length - 1]; if (!el) return 'missing'; el.click(); return 'clicked'; })()`
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true })
  console.log('click', text, '->', r.result && r.result.result && r.result.result.value)
  await sleep(1800)
}

const shotRes = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
if (!shotRes.result?.data) { console.error('capture failed'); process.exit(1) }
writeFileSync(out, Buffer.from(shotRes.result.data, 'base64'))
console.log('saved', out)
try { ws.close() } catch {}
child.kill()
process.exit(0)
