const base = 'http://127.0.0.1:6313'
const token = '6KAqsktS_IENNNTYXG-jWK86r5oKtiG9XdUvsbYREhw'
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
for (const p of ['/study/static/katex.min.js', '/study/static/katex.min.css', '/study/static/fonts/KaTeX_Main-Regular.woff2']) {
  const r = await fetch(base + p, { headers: { cookie } })
  console.log(p, r.status, (await r.arrayBuffer()).byteLength)
}
const c = await (await fetch(base + '/plugins/dsh-studygo/client.js', { headers: { cookie } })).text()
console.log('client has MathText:', c.includes('MathText'), '| has katex:', c.includes('katex.min.js'))
