const base = process.argv[2], token = process.argv[3]
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const before = await (await fetch(base + '/study/api/related?lib=' + encodeURIComponent('数学-导数') + '&id=q-20261107-0004', { headers })).json()
console.log('before:', (before.items || []).map((x) => x.id).join(','))
if (before.items && before.items.length) {
  const target = before.items[0].id
  await fetch(base + '/study/api/feedback', { method: 'POST', headers, body: JSON.stringify({ id: 'q-20261107-0004', other: target, action: 'deny' }) })
  const after = await (await fetch(base + '/study/api/related?lib=' + encodeURIComponent('数学-导数') + '&id=q-20261107-0004', { headers })).json()
  console.log('denied', target, '| after:', (after.items || []).map((x) => x.id).join(','))
}
