const base='http://127.0.0.1:6313'
const token = process.argv[2]
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const r = await fetch(base + '/study/api/related?lib=' + encodeURIComponent('数学-导数') + '&id=q-20261107-0003', { headers })
console.log('status', r.status)
console.log((await r.text()).slice(0, 400))
