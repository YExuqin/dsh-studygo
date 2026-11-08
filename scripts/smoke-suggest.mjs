const base = process.argv[2], token = process.argv[3]
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
for (const stem of ['求 f(x)=x^3-3x 在 [-1,3] 上的最大值。', '已知传递函数 G(s)=10/(s+1)，求闭环传递函数。']) {
  const s = await (await fetch(base + '/study/api/suggest-library', { method: 'POST', headers, body: JSON.stringify({ stem }) })).json()
  console.log(stem.slice(0, 12), '->', s.library || ('新库:' + s.newName), '|', s.reason)
}
