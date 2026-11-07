const base = process.argv[2]
const token = process.argv[3]
const lib = process.argv[4] || '数学-导数'
const stem = process.argv[5] || '求 f(x)=x^3-3x 在 [-2,2] 上的最大值与最小值。'
const course = process.argv[6] || 'math'

const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }

const solve = await (await fetch(base + '/study/api/solve', { method: 'POST', headers, body: JSON.stringify({ library: lib, stem, course }) })).json()
if (!solve.ok) { console.log('SOLVE_FAIL', solve.error); process.exit(1) }
const c = solve.card
console.log('card:', c.title, '| steps', (c.steps || []).length, '| badge', JSON.stringify(c.badge))
const saved = await (await fetch(base + '/study/api/commit', { method: 'POST', headers, body: JSON.stringify({ library: lib, card: c }) })).json()
console.log('saved:', saved.id, saved.path)
