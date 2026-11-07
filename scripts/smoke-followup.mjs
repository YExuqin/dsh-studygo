const base = 'http://127.0.0.1:6313'
const token = 'PCwz6zR2k0_FmJnGFFpTIwyxtVCYWDR8f789KDRWI6s'
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const r = await (await fetch(base + '/study/api/followup', { method: 'POST', headers, body: JSON.stringify({ library: '数学-导数', id: 'q-20261107-0003', anchor: 'S2', question: '为什么两个驻点都要算？只算一个不行吗？' }) })).json()
console.log('ok:', r.ok, '| chars:', (r.answer || '').length)
console.log((r.answer || r.error || '').slice(0, 300))
