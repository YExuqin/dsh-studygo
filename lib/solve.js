import { complete, parseJson } from './llm.js'
import { SKELETONS, STYLE_RULES } from './styles.js'
import { pickCourse } from './courses.js'

const SYSTEM = [
  '你是一名严格按学科书写规范作答的助教。',
  '你只输出一个 JSON 对象，不要解释，不要 Markdown 代码块以外的任何文字。',
  '公式用 LaTeX 存（行内 $...$，独立成行 $$...$$）。',
].join('\n')

function buildPrompt({ stem, pack, form, style }) {
  const skeleton = (SKELETONS[pack.id] || SKELETONS._default).join('\n')
  const schema = form === 'analysis'
    ? '{"title":"短标题","gist":"一句话","topic":["知识点"],"method":["方法id"],"stem":"题干","points":[{"title":"结论","basis":"依据","body":"说明"}],"figures":[],"verify":[]}'
    : '{"title":"短标题","gist":"一句话","topic":["知识点"],"method":["方法id"],"stem":"题干","steps":[{"title":"步骤名","method":"方法id","intent":"这步在干什么","explain":"为什么能这么做","body":"卷面写法（公式与文字）","keyExpr":"关键式"}],"figures":[],"verify":["可验算的等式"]}'
  return [
    '课程：' + (pack.name || pack.id),
    '形态：' + form,
    '方法词表（method 只能从中选）：' + (pack.methods || []).map((m) => m.id).join(', '),
    '',
    '书写骨架：',
    skeleton,
    '',
    '要求：' + (STYLE_RULES[style] || STYLE_RULES.guided),
    '',
    '题干：',
    stem,
    '',
    '输出 JSON，字段如下：',
    schema,
    '注意：',
    '1. steps 里每步都要能被单独判分；body 是卷面写法，explain 是讲解；',
    '2. verify 只放「能写成 A = B = C 的等式」，供程序用 sympy 核对，不要放不等式或含导数的式子；',
    '3. 没有图就 figures 给空数组；有图用 {"type":"block|flow|er","direction":"LR","nodes":[{"id","label"}],"edges":[{"from","to","label"}]}。',
  ].join('\n')
}

function normalize(data, { stem, form, style, pack }) {
  const steps = (data.steps || []).map((s, i) => ({
    title: String(s.title || ('步骤 ' + (i + 1))).slice(0, 40),
    method: String(s.method || 'other'),
    intent: String(s.intent || ''),
    explain: String(s.explain || ''),
    body: String(s.body || ''),
    keyExpr: String(s.keyExpr || ''),
  }))
  const points = (data.points || []).map((p, i) => ({
    title: String(p.title || ('要点 ' + (i + 1))).slice(0, 40),
    method: String(p.method || 'other'),
    intent: String(p.basis || ''),
    explain: String(p.body || ''),
    body: String(p.body || ''),
  }))
  const validMethods = new Set((pack.methods || []).map((m) => m.id))
  const fix = (arr) => arr.map((s) => (validMethods.size && !validMethods.has(s.method) ? { ...s, method: 'other' } : s))
  return {
    title: String(data.title || stem.slice(0, 30)),
    gist: String(data.gist || ''),
    topic: Array.isArray(data.topic) ? data.topic.map(String) : [],
    method: Array.isArray(data.method) ? data.method.map((m) => (validMethods.has(m) ? m : 'other')) : [],
    stem: String(data.stem || stem),
    form,
    style,
    course: pack.id,
    steps: fix(steps),
    points: form === 'analysis' ? points : [],
    figures: Array.isArray(data.figures) ? data.figures.slice(0, 3) : [],
    verify: Array.isArray(data.verify) ? data.verify.map(String).slice(0, 12) : [],
  }
}

/** 调模型生成一张题目卡。 */
export async function solveCard(ctx, opts) {
  const { stem, pack, form = pack.form || 'proof', style = pack.style || 'guided', provider, model, effort } = opts
  const prompt = buildPrompt({ stem, pack, form, style })
  const { text } = await complete(ctx, { system: SYSTEM, user: prompt, provider, model, effort, maxTokens: 12000 })
  const data = parseJson(text)
  if (!data) return { ok: false, error: '模型没有返回合法 JSON', raw: String(text).slice(0, 400) }
  return { ok: true, card: normalize(data, { stem, form, style, pack }) }
}