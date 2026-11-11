const base = process.argv[2], token = process.argv[3]
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const card = { title: '合并测试题', gist: 'x', topic: ['测试'], method: ['other'], stem: '测试题干 $x^2$', form: 'proof', style: 'guided', course: 'math', steps: [{ title: '一步', method: 'other', intent: '', explain: '', body: '$x=1$', keyExpr: '' }], figures: [], verify: [] }
await fetch(base + '/study/api/library/create', { method: 'POST', headers, body: JSON.stringify({ name: '临时-合并' }) })
const c = await (await fetch(base + '/study/api/commit', { method: 'POST', headers, body: JSON.stringify({ library: '临时-合并', card }) })).json()
console.log('created in temp:', c.id)
const m = await (await fetch(base + '/study/api/library/merge', { method: 'POST', headers, body: JSON.stringify({ from: '临时-合并', to: '数学-导数' }) })).json()
console.log('merge ok', m.ok, '| moved', m.moved, '| err', m.error || '')
const libs = await (await fetch(base + '/study/api/libraries', { headers })).json()
console.log('libs:', (libs.libs || []).map((l) => l.name + '(' + l.count + ')').join(', '))
