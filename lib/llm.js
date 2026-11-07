import { writeFileSync } from 'node:fs'

const LOG = 'E:/DSH题库插件/plugin/artifacts/llm-debug.log'

async function once(ctx, req) {
  let text = ''
  let reason = ''
  const tally = {}
  let usage = null
  try {
    for await (const chunk of ctx.llm.stream(req)) {
      if (!chunk) continue
      tally[chunk.type] = (tally[chunk.type] || 0) + 1
      if (chunk.type === 'text-delta') text += (chunk.text || '')
      else if (chunk.type === 'text') text += (chunk.text || '')
      else if (chunk.type === 'finish') { reason = (chunk.reason && chunk.reason.kind) || 'finish'; break }
      else if (chunk.type === 'error') { reason = 'error' }
    }
  } catch (e) {
    reason = 'throw: ' + String((e && e.message) || e).slice(0, 120)
  }
  return { text, reason, tally, usage }
}

/** ctx.llm 的薄封装：收集文本块；推理型模型吃 token 时自动加预算重试一次。 */
export async function complete(ctx, opts) {
  const { system, user, provider, model, maxTokens = 12000, effort } = opts
  const messages = []
  if (system) messages.push({ role: 'system', content: [{ type: 'text', text: system }] })
  messages.push({ role: 'user', content: [{ type: 'text', text: user }] })
  const base = { messages }
  if (effort) base.reasoningEffort = effort
  if (provider) base.provider = provider
  if (model) base.model = model

  const first = await once(ctx, { ...base, maxTokens })
  let text = first.text
  let reason = first.reason
  if (!text && reason === 'max-tokens') {
    const second = await once(ctx, { ...base, maxTokens: Math.min(maxTokens * 2, 32000) })
    text = second.text
    reason = second.reason
    try { writeFileSync(LOG, JSON.stringify({ retried: true, tally: second.tally, usage: second.usage, reason, chars: text.length }, null, 1)) } catch {}
  } else {
    try { writeFileSync(LOG, JSON.stringify({ retried: false, tally: first.tally, usage: first.usage, reason, chars: text.length, head: text.slice(0, 80) }, null, 1)) } catch {}
  }
  return { text, reason }
}

const FENCE = String.fromCharCode(96, 96, 96)

/** 从回复里抠出 JSON（容忍代码块包裹）。 */
export function parseJson(text) {
  if (!text) return null
  let raw = String(text)
  const i = raw.indexOf(FENCE)
  if (i >= 0) {
    const j = raw.indexOf(FENCE, i + 3)
    if (j > i) raw = raw.slice(i + 3, j).replace(/^json\s*/i, '')
  }
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try { return JSON.parse(raw.slice(start, end + 1)) } catch { return null }
}