const base = 'http://127.0.0.1:6313'
const token = 'vUtRQ9fiuxcA94qMyk0vS8-8ABbGKQabsqrjlpHt6cs'
const fs = await import('node:fs')
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }
const LOG = 'E:/DSH题库插件/plugin/artifacts/llm-debug.log'
async function run(effort, stem) {
  const t0 = Date.now()
  const r = await (await fetch(base + '/study/api/solve', { method: 'POST', headers, body: JSON.stringify({ stem, effort }) })).json()
  const ms = Date.now() - t0
  let dbg = {}
  try { dbg = JSON.parse(fs.readFileSync(LOG, 'utf8')) } catch {}
  const u = dbg.usage || {}
  console.log((effort || 'default').padEnd(8), '| ok', r.ok, '|', (ms/1000).toFixed(1) + 's', '| in', u.inputTokens || u.promptTokens || '?', '| out', u.outputTokens || '?', '| reasoning', u.reasoningTokens || '?', '| steps', (r.card && r.card.steps || []).length)
}
const stem = '求 f(x)=x^3-3x 在 [0,2] 上的最小值。'
await run('low', stem)
await run(undefined, stem)
