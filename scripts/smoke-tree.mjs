const base = 'http://127.0.0.1:6313'
const token = 'MkGBEuVT2gf-T-yxDwzTk2KDR6rY8yGGElz7YOER-ic'
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const q1 = await (await fetch(base + '/study/api/question?lib=' + encodeURIComponent('数学-导数') + '&id=q-20261107-0003', { headers })).json()
console.log('threads:', JSON.stringify(q1.question.threads).slice(0, 300))
const f = await (await fetch(base + '/study/api/followup', { method: 'POST', headers, body: JSON.stringify({ library: '数学-导数', id: 'q-20261107-0003', anchor: 'S2', parent: '为什么两个驻点都要算？只算一个不行吗？', question: '那如果两个驻点函数值一样呢？' }) })).json()
console.log('nested ok:', f.ok, '| chars:', (f.answer || '').length)
const q2 = await (await fetch(base + '/study/api/question?lib=' + encodeURIComponent('数学-导数') + '&id=q-20261107-0003', { headers })).json()
console.log('tree:', JSON.stringify(q2.question.threads, null, 1).slice(0, 600))
