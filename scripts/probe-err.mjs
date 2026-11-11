import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const url = process.argv[2]
const port = 9700 + Math.floor(Math.random() * 20)
const profile = mkdtempSync(join(tmpdir(), 'dsh-e-'))
spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--user-data-dir=' + profile, '--remote-debugging-port=' + port, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (let i = 0; i < 100; i++) { try { const r = await fetch('http://127.0.0.1:' + port + '/json/version'); if (r.ok) break } catch {} await sleep(150) }
const t = await (await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent('about:blank'), { method: 'PUT' })).json()
const ws = new WebSocket(t.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const errs = []
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data)
  if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').slice(0, 400))
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push(m.params.args.map((a) => a.value || a.description || '').join(' ').slice(0, 400))
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); p(m) }
})
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej) })
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
await send('Page.enable'); await send('Runtime.enable')
await send('Page.navigate', { url }); await sleep(5000)
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value
await ev("(() => { const a=[...document.querySelectorAll('div,span')]; const el=a.filter(x=>(x.textContent||'').trim()==='题库').pop(); if(el) el.click(); })()")
await sleep(1500)
await ev("(() => { const a=[...document.querySelectorAll('div,span,button')]; const el=a.filter(x=>(x.textContent||'').trim()==='＋ 新建').pop(); if(el) el.click(); })()")
await sleep(2000)
console.log('ERRORS:', errs.slice(0, 5).join('\n---\n'))
console.log('body:', (await ev("document.body.innerText")).slice(0, 200).replace(/\n/g, ' | '))
process.exit(0)