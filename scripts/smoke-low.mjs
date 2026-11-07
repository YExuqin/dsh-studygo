const base = 'http://127.0.0.1:6313'
const token = 'Nfy0RyjLgPEyULcQqsxyNdfTNkRSTWQy51Z6iEmjzIo'
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const t0 = Date.now()
const r = await (await fetch(base + '/study/api/solve', { method: 'POST', headers, body: JSON.stringify({ stem: '求 f(x)=x^3-3x 在 [-1,3] 上的最大值。' }) })).json()
console.log('ok', r.ok, '|', ((Date.now()-t0)/1000).toFixed(1) + 's', '| steps', (r.card && r.card.steps || []).length, '| course', r.card && r.card.course, '| form', r.card && r.card.form)
if (r.ok) {
  const s = await (await fetch(base + '/study/api/commit', { method: 'POST', headers, body: JSON.stringify({ library: '数学-导数', card: r.card }) })).json()
  console.log('saved', s.id)
}
