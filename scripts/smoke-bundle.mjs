const base = 'http://127.0.0.1:6313', token = process.argv[2]
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const c = await (await fetch(base + '/plugins/dsh-studygo/client.js', { headers: { cookie } })).text()
console.log('len', c.length, '| has setMode in openItem:', /function openItem[\s\S]{0,120}setMode/.test(c))
console.log('| treeBox guarded:', c.indexOf('mode === "view" && treeRoots.length') >= 0)
