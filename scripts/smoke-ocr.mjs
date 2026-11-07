const base = 'http://127.0.0.1:6313'
const token = 'rS-T4QZiWmG5i4vZp9wvEzemx1ribyViz2D2mqIJvcY'
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const fs = await import('node:fs')
const bytes = fs.readFileSync('E:/DSH题库插件/参考题型和答题形式/答题/题三.jpg')
const up = await (await fetch(base + '/study/api/upload', { method: 'POST', headers, body: JSON.stringify({ name: '题三.jpg', data: 'data:image/jpeg;base64,' + bytes.toString('base64') }) })).json()
console.log('upload:', up.ok, up.path)
const ocr = await (await fetch(base + '/study/api/ocr', { method: 'POST', headers, body: JSON.stringify({ path: up.path }) })).json()
console.log('ocr chars:', (ocr.text || '').length)
console.log((ocr.text || '').slice(0, 200))
