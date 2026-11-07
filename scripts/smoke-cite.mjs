const base = process.argv[2], token = process.argv[3]
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const r = await (await fetch(base + '/study/api/solve', { method: 'POST', headers, body: JSON.stringify({ stem: '求 f(x)=x^3-6x 在 [-2,2] 上的最大值与最小值。', library: '数学-导数' }) })).json()
console.log('ok', r.ok, '| steps', (r.card && r.card.steps || []).length)
if (r.ok) {
  const cited = (r.card.steps || []).filter((s) => /q-\d{8}-\d{4}/.test(s.explain || '')).length
  console.log('steps citing q-id:', cited)
  console.log('sample explain:', ((r.card.steps || [])[0] || {}).explain || '')
  const s = await (await fetch(base + '/study/api/commit', { method: 'POST', headers, body: JSON.stringify({ library: '数学-导数', card: r.card }) })).json()
  console.log('saved', s.id)
}
