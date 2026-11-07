const base = 'http://127.0.0.1:6313'
const token = 'G1EqqUtQl-N4gzXdfBl4jco7XLdipSTSGZ54SUI4F4Y'
const fs = await import('node:fs')
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const up = await (await fetch(base + '/study/api/upload', { method: 'POST', headers, body: JSON.stringify({ name: 'q3.jpg', data: 'data:image/jpeg;base64,' + fs.readFileSync('E:/DSH题库插件/参考题型和答题形式/答题/题三.jpg').toString('base64') }) })).json()
const ocr = await (await fetch(base + '/study/api/ocr', { method: 'POST', headers, body: JSON.stringify({ path: up.path }) })).json()
const clean = String(ocr.text || '').replace(/\s+/g, ' ').replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, '$1').trim()
fs.writeFileSync('E:/DSH题库插件/plugin/artifacts/ocr-sample.txt', clean, 'utf8')
console.log('chars', clean.length)
