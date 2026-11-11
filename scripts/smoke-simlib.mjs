const base = process.argv[2], token = process.argv[3]
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const a = await (await fetch(base + '/study/api/library/create', { method: 'POST', headers, body: JSON.stringify({ name: '数学' }) })).json()
console.log('sim:', JSON.stringify(a))
const b = await (await fetch(base + '/study/api/library/create', { method: 'POST', headers, body: JSON.stringify({ name: '数学', force: true }) })).json()
console.log('force:', JSON.stringify(b))
