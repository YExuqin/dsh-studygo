const base = process.argv[2], token = process.argv[3]
const fs = await import('node:fs')
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const data = 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,' + fs.readFileSync('C:/Users/ASUS/Documents/deepseek-harness/default-workspace/sample.docx').toString('base64')
const r = await (await fetch(base + '/study/api/ingest/docx', { method: 'POST', headers, body: JSON.stringify({ name: 'sample.docx', data }) })).json()
console.log('ok', r.ok, '| chars', (r.text || '').length)
console.log((r.text || '').slice(0, 200))
