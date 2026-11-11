const base = process.argv[2], token = process.argv[3]
const fs = await import('node:fs')
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const files = [
  'E:/DSH题库插件/参考题型和答题形式/答题/题一.jpg',
  'E:/DSH题库插件/参考题型和答题形式/答题/题二.jpg',
]
const items = files.map((p) => ({ name: p.split('/').pop(), data: 'data:image/jpeg;base64,' + fs.readFileSync(p).toString('base64') }))
const t0 = Date.now()
const r = await (await fetch(base + '/study/api/ingest/batch', { method: 'POST', headers, body: JSON.stringify({ items }) })).json()
console.log('ok', r.ok, '| items', (r.items || []).length, '| ms', Date.now() - t0)
for (const it of r.items || []) console.log('-', it.name, '| chars', (it.text || '').length, '|', (it.text || '').slice(0, 40))
