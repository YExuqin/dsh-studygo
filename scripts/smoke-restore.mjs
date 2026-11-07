const base = process.argv[2], token = process.argv[3]
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const q = 'q-20261107-0004'
let x = await (await fetch(base + '/study/api/related?lib=' + encodeURIComponent('数学-导数') + '&id=' + q, { headers })).json()
console.log('before items', (x.items || []).length, 'hidden', (x.hidden || []).map((h) => h.id).join(','))
if ((x.hidden || []).length) {
  for (const h of x.hidden) await fetch(base + '/study/api/feedback', { method: 'POST', headers, body: JSON.stringify({ id: q, other: h.id, action: 'allow' }) })
  x = await (await fetch(base + '/study/api/related?lib=' + encodeURIComponent('数学-导数') + '&id=' + q, { headers })).json()
  console.log('after restore items', (x.items || []).length, 'hidden', (x.hidden || []).length)
}
