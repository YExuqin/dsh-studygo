const base = 'http://127.0.0.1:6313'
const token = 'RWM9xc0XA7P1n7jVYrJS5nxktG30YysLpYUPYHwZ9Fk'
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const a = await (await fetch(base + '/study/api/followup', { method: 'POST', headers, body: JSON.stringify({ library: '数学-导数', id: 'q-20261107-0004', anchor: 'S2', question: '为什么只取 x=1，x=-1 不要吗？' }) })).json()
console.log('a ok', a.ok)
const b = await (await fetch(base + '/study/api/followup', { method: 'POST', headers, body: JSON.stringify({ library: '数学-导数', id: 'q-20261107-0004', anchor: 'S2', parent: '为什么只取 x=1，x=-1 不要吗？', question: '那如果区间也包含 -1 呢？' }) })).json()
console.log('b ok', b.ok)
