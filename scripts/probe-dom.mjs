import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const url = process.argv[2]
const port = 9500 + Math.floor(Math.random() * 40)
const profile = mkdtempSync(join(tmpdir(), 'dsh-p-'))
spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--user-data-dir=' + profile, '--remote-debugging-port=' + port, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (let i = 0; i < 100; i++) { try { const r = await fetch('http://127.0.0.1:' + port + '/json/version'); if (r.ok) break } catch {} await sleep(150) }
const t = await (await fetch('http://127.0.0.1:' + port + '/json/new?' + encodeURIComponent('about:blank'), { method: 'PUT' })).json()
const ws = new WebSocket(t.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); p(m) } })
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej) })
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
await send('Page.enable'); await send('Runtime.enable')
await send('Page.navigate', { url }); await sleep(5000)
await send('Runtime.evaluate', { expression: "(() => { const a=[...document.querySelectorAll('div,span')]; const el=a.filter(e=>(e.textContent||'').trim()==='题库').pop(); if(el) el.click(); })()" })
await sleep(2500)
const evalx = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value
console.log('katex loaded:', await evalx("typeof window.katex"))
console.log('katex nodes:', await evalx("document.querySelectorAll('.katex').length"))
console.log('sample:', await evalx("(document.querySelector('main')||document.body).innerText.slice(0,160).replace(/\\n/g,' | ')"))
console.log('scripts:', await evalx("[...document.scripts].map(s=>s.src).filter(Boolean).join(',')"))
process.exit(0)
