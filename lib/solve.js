import { complete, parseJson } from './llm.js'
import { SKELETONS, STYLE_RULES } from './styles.js'
import { pickCourse } from './courses.js'

const SYSTEM = [
  '你是一名严格按学科书写规范作答的助教。',
  '你只输出一个 JSON 对象，不要任何解释文字。',
  '行内公式必须写成 $...$，独立成行写成 $$...$$。',
  '严禁裸 LaTeX（没有被 $ 包裹的 \pm、\sqrt、x^2 等），否则前端无法渲染。',
].join('\n')

function buildPrompt({ stem, pack, form, style, refs }) {
  const skeleton = (SKELETONS[pack.id] || SKELETONS._default).join('\n')
  const schema = form === 'essay'
    ? '{"title":"短标题","gist":"一句话要点","topic":["考点"],"method":["structure"],"stem":"题目要求","paragraphs":[{"title":"第1段 · 开头","method":"structure","rewrite":"改写要点（中文）","why":"为什么这样改（中文）","body":"英文段落原文"}],"figures":[],"verify":[]}'
    : form === 'analysis'
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
    form === 'essay'
      ? '要求：按' + '"' + '段落' + '"' + '组织，3–5 段；每段 body 是可直接抄的英文，rewrite 用中文说清改了什么（词汇升级/句式/衔接），why 说清为什么这样更得分。不要逐句翻译题目。'
      : '要求：' + (STYLE_RULES[style] || STYLE_RULES.guided),
    (refs && refs.length) ? ('\n同库参考题（可引用为「与 q-xxx 同套路」）：\n' + refs.map((r) => '- ' + r.id + ' ' + (r.title || '')).join('\n')) : '',
    '',
    '题干：',
    stem,
    '',
    '输出 JSON，字段如下：',
    schema,
    '注意：',
    '1. steps 里每步都要能被单独判分；body 是卷面写法，explain 是讲解；',
    '2. 所有数学式子必须用 $...$ 包裹；独立成行的公式用 $$...$$；',
    '3. verify 只放「能写成 A = B = C 的等式」，供程序用 sympy 核对；',
    '4. 没有图就 figures 给空数组。有图时选一种：',
    '   - 流程/结构/关系：{type:"flow",nodes:[{id,label,shape?}],edges:[{from,to,label?}]}（shape 可 diamond=判断、circle=起点/终点）',
    '   - 表格：{type:"table",head:["列名"],rows:[["单元格"]]}',
    '   - 函数图像：{type:"plot",points:[[x,y],...],xlabel:"x",ylabel:"y"}（自己采样 30–60 个点，x 递增）',
    (refs && refs.length) ? '5. 如果某一步与上面某道参考题的做法相同或不同，在该步 explain 末尾加一句「（与 q-xxx 同套路 / 与 q-xxx 不同：…）」。' : '',
  ].filter(Boolean).join('\n')
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
  const paragraphs = form === 'essay' ? (data.paragraphs || []).map((p, i) => ({
    title: String(p.title || ('第 ' + (i + 1) + ' 段')).slice(0, 40),
    method: String(p.method || 'structure'),
    intent: String(p.rewrite || ''),
    explain: String(p.why || ''),
    body: String(p.body || ''),
  })) : []
  const points = form === 'essay' ? paragraphs : (data.points || []).map((p, i) => ({
    title: String(p.title || ('要点 ' + (i + 1))).slice(0, 40),
    method: String(p.method || 'other'),
    intent: String(p.basis || ''),
    explain: String(p.body || ''),
    body: String(p.body || ''),
  }))
  const valid = new Set((pack.methods || []).map((m) => m.id))
  const fix = (arr) => arr.map((s) => (valid.size && !valid.has(s.method) ? Object.assign({}, s, { method: 'other' }) : s))
  return {
    title: String(data.title || stem.slice(0, 30)),
    gist: String(data.gist || ''),
    topic: Array.isArray(data.topic) ? data.topic.map(String) : [],
    method: Array.isArray(data.method) ? data.method.map((m) => (valid.has(m) ? m : 'other')) : [],
    stem: String(data.stem || stem),
    form,
    style,
    course: pack.id,
    steps: fix(steps),
    points: (form === 'analysis' || form === 'essay') ? points : [],
    figures: Array.isArray(data.figures) ? data.figures.slice(0, 3) : [],
    verify: Array.isArray(data.verify) ? data.verify.map(String).slice(0, 12) : [],
  }
}

function needsMathFix(data) {
  const re = /\\[a-zA-Z]+|[a-zA-Z0-9]\^|_[{]/
  const fields = []
  for (const s of data.steps || []) fields.push(s.body || '', s.explain || '')
  for (const p of data.points || []) fields.push(p.body || '')
  fields.push(data.stem || '')
  let bad = 0
  let total = 0
  for (const f of fields) {
    if (!f) continue
    total++
    if (f.indexOf('$') < 0 && re.test(f)) bad++
  }
  return total > 0 && bad / total >= 0.4
}

/** 调模型生成一张题目卡（公式不合规时重试一次）。 */
export async function solveCard(ctx, opts) {
  const { stem, pack, form, style, provider, model, effort, refs } = opts
  const f = form || pack.form || 'proof'
  const st = style || pack.style || 'guided'
  const prompt = buildPrompt({ stem, pack, form: f, style: st, refs })
  let data = null
  let p = prompt
  for (let attempt = 0; attempt < 2; attempt++) {
    const { text } = await complete(ctx, { system: SYSTEM, user: p, provider, model, effort, maxTokens: 12000 })
    data = parseJson(text)
    if (!data) { p = prompt + '\n\n（上次输出不是合法 JSON，请只输出 JSON 对象。）'; continue }
    if (!needsMathFix(data)) break
    p = prompt + '\n\n重要：上次输出里有公式没有用 $ 包裹。请重写：所有数学式子一律 $...$，独立成行 $$...$$，不得出现裸 LaTeX。'
  }
  if (!data) return { ok: false, error: '模型没有返回合法 JSON' }
  return { ok: true, card: normalize(data, { stem, form: f, style: st, pack }) }
}
