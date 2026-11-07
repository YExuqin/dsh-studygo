import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const url = process.argv[2]
const port = 9600 + Math.floor(Math.random() * 30)
const profile = mkdtempSync(join(tmpdir(), 'dsh-q-'))
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
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value
await send('Page.enable'); await send('Runtime.enable')
await send('Page.navigate', { url }); await sleep(5000)
await ev("(() => { const a=[...document.querySelectorAll('div,span')]; const el=a.filter(e=>(e.textContent||'').trim()==='题库').pop(); if(el) el.click(); })()")
await sleep(1500)
await ev("(() => { const a=[...document.querySelectorAll('div,span')]; const el=a.filter(e=>(e.textContent||'').trim()==='📚').pop(); if(el) el.click(); })()")
await sleep(800)
await ev("(() => { const a=[...document.querySelectorAll('div,span')]; const el=a.filter(e=>(e.textContent||'').trim()==='数学-导数').pop(); if(el) el.click(); })()")
await sleep(2500)
console.log('tree nodes:', await ev("[...document.querySelectorAll('svg g')].filter(g=>g.textContent&&g.textContent.trim()).length"))
console.log('before scroll:', await ev("(() => { const el=[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+50).pop(); return el?Math.round(el.scrollTop):-1 })()"))
const clicked = await ev("(() => { const g=[...document.querySelectorAll('svg g')].filter(x=>(x.textContent||'').includes('S2'))[0]; if(!g) return 'no-node'; g.dispatchEvent(new MouseEvent('click',{bubbles:true})); return 'clicked' })()")
console.log('click:', clicked)
await sleep(250)
console.log('thread bg:', await ev("(() => { const el=document.getElementById('thread-S2-0'); return el?el.style.background:'no-thread' })()"))
console.log('thread rect:', await ev("(() => { const el=document.getElementById('thread-S2-0'); if(!el) return 'no'; const r=el.getBoundingClientRect(); return Math.round(r.top) })()"))
console.log('after scroll:', await ev("(() => { const el=[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+50).pop(); return el?Math.round(el.scrollTop):-1 })()"))
console.log('flash:', await ev("(() => { const el=document.getElementById('step-S2'); return el?el.style.background:'no-el' })()"))
process.exit(0)