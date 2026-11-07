const base = process.argv[2] + '', token = process.argv[3]
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
let k = await (await fetch(base + '/study/api/knowledge?lib=' + encodeURIComponent('数学-导数'), { headers })).json()
console.log('cards', k.cards.length, 'topics', k.topics.length)
const d = await (await fetch(base + '/study/api/knowledge/draft', { method: 'POST', headers, body: JSON.stringify({ lib: '数学-导数' }) })).json()
console.log('draft made', d.made)
k = await (await fetch(base + '/study/api/knowledge?lib=' + encodeURIComponent('数学-导数'), { headers })).json()
console.log('cards now', k.cards.length, '|', k.cards.slice(0, 3).map((c) => c.name).join(', '))
