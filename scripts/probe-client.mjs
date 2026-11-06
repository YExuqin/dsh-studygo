
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const url = process.argv[2]
const port = 9400 + Math.floor(Math.random() * 50)
const profile = mkdtempSync(join(tmpdir(), 'dsh-probe-'))
spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--user-data-dir=' + profile,
  '--remote-debugging-port=' + port, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (let i = 0; i < 100; i++) {
  try { const r = await fetch('http://127.0.0.1:' + port + '/json/version'); if (r.ok) break } catch {}
  await sleep(150)
}
const t = await (await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent('about:blank'), { method: 'PUT' })).json()
const ws = new WebSocket(t.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const logs = []
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data)
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push(m.params.args.map((a) => a.value || a.description || '').join(' '))
  if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails.exception?.description || '').slice(0, 300))
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); p(m) }
})
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej) })
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
await send('Runtime.enable')
await send('Page.enable')
await send('Page.navigate', { url })
await sleep(6000)
await send('Runtime.evaluate', { expression: "(() => { const all=[...document.querySelectorAll('div,span')]; const el=all.filter(e=>(e.textContent||'').trim()==='题库').pop(); if(el) el.click(); return !!el })()" })
await sleep(2500)
const r = await send('Runtime.evaluate', { expression: "document.body.innerText.replace(/\\n+/g,' | ').slice(0, 600)", returnByValue: true })
console.log('TEXT:', r.result?.result?.value)
console.log('LOGS:', logs.slice(0, 8).join('\n'))
process.exit(0)
