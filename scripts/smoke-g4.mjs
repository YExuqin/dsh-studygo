const base = 'http://127.0.0.1:6313'
const token = '-IjYzYSAHOtScheAQ2phCxRduwYB-rFctRWcsrN4Bz4'
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
for (const id of ['q-20261107-0003', 'q-20261107-0004']) {
  const r = await (await fetch(base + '/study/api/related?lib=' + encodeURIComponent('数学-导数') + '&id=' + id, { headers })).json()
  console.log(id, 'related:', (r.items || []).map((x) => x.kind + ':' + x.title.slice(0, 18)).join(' | ') || 'none')
}
const c = await (await fetch(base + '/study/api/compare', { method: 'POST', headers, body: JSON.stringify({ lib: '数学-导数', a: 'q-20261107-0003', b: 'q-20261107-0004', question: '这两题解法一样吗？' }) })).json()
console.log('compare ok:', c.ok, '| chars:', (c.answer || '').length)
console.log((c.answer || '').slice(0, 160))
