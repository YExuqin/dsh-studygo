
import { mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join, basename } from 'node:path'

/** 库名合法化：去掉 Windows 非法字符，压缩空白。 */
export function slug(name) {
  return String(name).trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ')
}

export function today(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

/** 极简 YAML 子集：只解析本插件自己写的形态（key: value / key: [a, b]）。 */
export function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!m) return { data: {}, body: text }
  const data = {}
  for (const line of m[1].split(/\r?\n/)) {
    const mm = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line)
    if (!mm) continue
    const key = mm[1]
    let raw = mm[2].trim()
    if (raw === '') { data[key] = ''; continue }
    if (raw.startsWith('[') && raw.endsWith(']')) {
      data[key] = raw.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
      continue
    }
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1)
    }
    data[key] = raw
  }
  return { data, body: text.slice(m[0].length) }
}

/** 把对象写成 frontmatter，字段顺序固定，便于 git diff。 */
export function stringifyFrontmatter(data) {
  const order = ['id', 'library', 'title', 'created', 'updated', 'kind', 'subject', 'source',
    'topic', 'difficulty', 'source_book', 'source_page', 'source_no', 'formatVersion']
  const keys = order.filter((k) => data[k] !== undefined)
  for (const k of Object.keys(data)) if (!keys.includes(k) && data[k] !== undefined) keys.push(k)
  const lines = ['---']
  for (const k of keys) {
    const v = data[k]
    if (Array.isArray(v)) lines.push(k + ': [' + v.join(', ') + ']')
    else lines.push(k + ': ' + v)
  }
  lines.push('---', '')
  return lines.join('\n')
}

async function exists(p) {
  try { await stat(p); return true } catch { return false }
}

export function libraryDir(vault, name) { return join(vault, slug(name)) }
export function questionPath(vault, lib, id) { return join(vault, slug(lib), id + '.md') }

/** 建库（幂等）。返回 { path, created }。 */
export async function createLibrary(vault, name, opts = {}) {
  const dir = libraryDir(vault, name)
  const file = join(dir, 'index.md')
  const created = !(await exists(file))
  await mkdir(dir, { recursive: true })
  const stamp = today()
  if (created) {
    const data = { title: slug(name), created: stamp, updated: stamp, kind: 'library', formatVersion: 1 }
    if (opts.subject) data.subject = opts.subject
    if (opts.source) data.source = opts.source
    const body = '# ' + slug(name) + '\n\n## 知识卡\n'
    await writeFile(file, stringifyFrontmatter(data) + body, 'utf8')
  }
  return { path: file, created, id: slug(name) }
}

/** 列出所有库。 */
export async function listLibraries(vault) {
  let names = []
  try { names = await readdir(vault, { withFileTypes: true }) } catch { return [] }
  const out = []
  for (const d of names) {
    if (!d.isDirectory()) continue
    if (d.name === '.index' || d.name.startsWith('.')) continue
    const file = join(vault, d.name, 'index.md')
    if (!(await exists(file))) continue
    const text = await readFile(file, 'utf8')
    const { data } = parseFrontmatter(text)
    out.push({ name: d.name, title: data.title || d.name, subject: data.subject || '', updated: data.updated || '' })
  }
  return out.sort((a, b) => String(b.updated).localeCompare(String(a.updated)))
}

/** 生成下一个题目 id：q-YYYYMMDD-NNNN，按当天已有编号递增。 */
export async function nextQuestionId(vault, lib) {
  const dir = libraryDir(vault, lib)
  const day = today().replace(/-/g, '')
  let seq = 0
  try {
    for (const f of await readdir(dir)) {
      const m = /^q-(\d{8})-(\d{4})\.md$/.exec(f)
      if (m && m[1] === day) seq = Math.max(seq, Number(m[2]))
    }
  } catch {}
  return 'q-' + day + '-' + String(seq + 1).padStart(4, '0')
}

/** 由结构化对象渲染题目 Markdown。 */
export function renderQuestion(q) {
  const stamp = today()
  const data = {
    id: q.id,
    library: q.library,
    title: q.title || '',
    created: q.created || stamp,
    updated: stamp,
    topic: q.topic,
    difficulty: q.difficulty,
    source_book: q.sourceBook,
    source_page: q.sourcePage,
    source_no: q.sourceNo,
  }
  for (const k of Object.keys(data)) if (data[k] === undefined || data[k] === '') delete data[k]
  const lines = [stringifyFrontmatter(data).trimEnd(), '', '## 题干', '', q.stem || '']
  if (q.steps && q.steps.length) {
    lines.push('', '## 步骤', '')
    q.steps.forEach((s, i) => {
      lines.push('### S' + (i + 1) + ' ' + (s.title || ('步骤 ' + (i + 1))))
      if (s.intent) lines.push('- 意图：' + s.intent)
      if (s.keyExpr) lines.push('- 关键式：' + s.keyExpr)
      lines.push('')
      if (s.body) lines.push(String(s.body).trimEnd())
      lines.push('')
    })
  }
  if (q.threads && q.threads.length) {
    lines.push('## 追问', '')
    for (const t of q.threads) lines.push('- ' + t)
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

/** 解析题目 Markdown。 */
export function parseQuestion(text, file) {
  const { data, body } = parseFrontmatter(text)
  const sections = {}
  let cur = null
  const buf = []
  const flush = () => { if (cur) sections[cur] = buf.join('\n').trim() }
  for (const line of body.split(/\r?\n/)) {
    const h = /^##\s+(.+)$/.exec(line)
    if (h) { flush(); cur = h[1].trim(); buf.length = 0; continue }
    if (cur) buf.push(line)
  }
  flush()
  const stepsText = sections['步骤'] || ''
  const steps = []
  let s = null
  const sbuf = []
  const pushStep = () => { if (s) { s.body = sbuf.join('\n').trim(); steps.push(s) } }
  for (const line of stepsText.split(/\r?\n/)) {
    const h = /^###\s+S(\d+)\s*(.*)$/.exec(line)
    if (h) {
      pushStep(); sbuf.length = 0
      s = { n: Number(h[1]), title: h[2].trim(), intent: '', keyExpr: '', body: '' }
      continue
    }
    if (!s) continue
    const it = /^-\s*意图[:：]\s*(.*)$/.exec(line)
    if (it) { s.intent = it[1]; continue }
    const kx = /^-\s*关键式[:：]\s*(.*)$/.exec(line)
    if (kx) { s.keyExpr = kx[1]; continue }
    sbuf.push(line)
  }
  pushStep()
  return {
    id: data.id || (file ? basename(file, '.md') : ''),
    library: data.library || '',
    title: data.title || '',
    created: data.created || '',
    updated: data.updated || '',
    topic: Array.isArray(data.topic) ? data.topic : (data.topic ? [data.topic] : []),
    difficulty: data.difficulty || '',
    stem: sections['题干'] || '',
    steps,
    threads: (sections['追问'] || '').split(/\r?\n/).filter((l) => /^-\s/.test(l)).map((l) => l.replace(/^-\s/, '')),
  }
}

/** 写题（自动分配 id、自动建库）。 */
export async function addQuestion(vault, input) {
  const lib = slug(input.library || '收件箱')
  await createLibrary(vault, lib)
  const id = input.id || (await nextQuestionId(vault, lib))
  const q = { ...input, id, library: lib }
  const file = questionPath(vault, lib, id)
  await writeFile(file, renderQuestion(q), 'utf8')
  return { id, path: file }
}

/** 读一道题。 */
export async function readQuestion(vault, lib, id) {
  const file = questionPath(vault, lib, id)
  const text = await readFile(file, 'utf8')
  return parseQuestion(text, file)
}

/** 列一个库的题目（只读 frontmatter + 题干首行，够列表用）。 */
export async function listQuestions(vault, lib) {
  const dir = libraryDir(vault, lib)
  let files = []
  try { files = await readdir(dir) } catch { return [] }
  const out = []
  for (const f of files) {
    if (!/^q-\d{8}-\d{4}\.md$/.test(f)) continue
    const p = join(dir, f)
    const text = await readFile(p, 'utf8')
    const { data, body } = parseFrontmatter(text)
    const stem = (/##\s*题干\r?\n+([^\n]+)/.exec(body) || [, ''])[1]
    out.push({
      id: data.id || basename(f, '.md'),
      title: data.title || stem.slice(0, 30),
      topic: Array.isArray(data.topic) ? data.topic : (data.topic ? [data.topic] : []),
      difficulty: data.difficulty || '',
      updated: data.updated || '',
      stem: stem.slice(0, 80),
    })
  }
  return out.sort((a, b) => String(b.id).localeCompare(String(a.id)))
}
