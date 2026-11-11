const base = process.argv[2], token = process.argv[3]
const fs = await import('node:fs')
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const data = 'data:image/jpeg;base64,' + fs.readFileSync('E:/DSH题库插件/参考题型和答题形式/答题/题二.jpg').toString('base64')
const ing = await (await fetch(base + '/study/api/ingest/batch', { method: 'POST', headers, body: JSON.stringify({ items: [{ name: 'q2.jpg', data }] }) })).json()
const text = String((ing.items || [{}])[0].text || '').replace(/\s+/g, ' ').trim()
console.log('ocr chars', text.length)
const s = await (await fetch(base + '/study/api/solve', { method: 'POST', headers, body: JSON.stringify({ stem: text.slice(0, 400), library: '概率统计' }) })).json()
console.log('solve ok', s.ok, '| steps', (s.card && s.card.steps || []).length, '| course', s.card && s.card.course)
if (s.ok) {
  const c = await (await fetch(base + '/study/api/commit', { method: 'POST', headers, body: JSON.stringify({ library: '概率统计', card: s.card }) })).json()
  console.log('commit', c.ok, c.id)
}
