const base = process.argv[2], token = process.argv[3]
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const card = { title: '闭环传递函数（自动建库测试）', gist: '前向/(1+前向×反馈)', topic: ['传递函数'], method: ['transfer_func'], stem: '已知 G(s)=$\\frac{10}{s+1}$，H(s)=1，求闭环传递函数。', form: 'proof', style: 'guided', course: 'autocontrol', steps: [{ title: '套公式', method: 'transfer_func', intent: '用负反馈公式', explain: '标准式', body: '$\\Phi(s)=\\frac{G}{1+GH}$', keyExpr: '' }], figures: [], verify: [] }
const s = await (await fetch(base + '/study/api/commit', { method: 'POST', headers, body: JSON.stringify({ library: '自动控制原理', card }) })).json()
console.log('commit ok', s.ok, '| id', s.id)
const libs = await (await fetch(base + '/study/api/libraries', { headers })).json()
console.log('libs:', (libs.libs || []).map((l) => l.name + '(' + l.count + ')').join(', '))
