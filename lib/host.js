import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  addQuestion, listLibraries, listQuestions,
  questionPath, readQuestion, slug, createLibrary, threadLines,
} from './store.js'
import { openIndex, upsertQuestion, search, searchConcepts, stats } from './index-db.js'
import { loadCourses, pickCourse, detectCourse, detectForm } from './courses.js'
import { solveCard } from './solve.js'
import { complete } from './llm.js'
import { verifyEquations, badgeOf } from './verify.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const VERIFY_PY = join(HERE, '..', 'scripts', 'verify.py')

function json(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(body)
}

function readBody(req, limit = 4 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) { reject(new Error('body too large')); req.destroy(); return }
      chunks.push(c)
    })
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      try { resolve(text ? JSON.parse(text) : {}) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

async function appendThread(vault, lib, id, anchor, question, answer, parentText) {
  const file = questionPath(vault, lib, id)
  const text = await readFile(file, 'utf8')
  const hasSection = /^##\s*追问\s*$/m.test(text)
  let lines = text.split(/\r?\n/)

  if (!hasSection) {
    return appendNewSection(file, text, anchor, question, answer)
  }

  if (!parentText) {
    // 顶层：插到「## 追问」段末尾
    const start = lines.findIndex((l) => /^##\s*追问\s*$/.test(l))
    let end = lines.length
    for (let i = start + 1; i < lines.length; i++) if (/^##\s/.test(lines[i])) { end = i; break }
    const block = threadLines(anchor, question, answer, 0)
    while (end > start + 1 && !lines[end - 1].trim()) end--
    lines.splice(end, 0, ...block, '')
    await writeFile(file, lines.join('\n'), 'utf8')
    return file
  }

  // 子追问：找到父节点行，插到其子树末尾
  const idx = lines.findIndex((l) => {
    const m = /^(\s*)-\s*(?:问：|@\S+\s+)(.*)$/.exec(l)
    return m && m[2].trim() === String(parentText).trim()
  })
  if (idx < 0) return appendThread(vault, lib, id, anchor, question, answer, null)
  const parentIndent = lines[idx].length - lines[idx].trimStart().length
  let end = idx + 1
  while (end < lines.length) {
    const l = lines[end]
    if (!l.trim()) { end++; continue }
    const ind = l.length - l.trimStart().length
    if (ind <= parentIndent) break
    end++
  }
  const block = threadLines('', question, answer, parentIndent / 2 + 1)
  lines.splice(end, 0, ...block)
  await writeFile(file, lines.join('\n'), 'utf8')
  return file
}

async function appendNewSection(file, text, anchor, question, answer) {
  const block = threadLines(anchor, question, answer, 0)
  await writeFile(file, text.trimEnd() + '\n\n## 追问\n\n' + block.join('\n') + '\n', 'utf8')
  return file
}

export async function mountStudy(ctx, config) {
  const vault = config.vault
  const provider = config.provider
  const model = config.model
  const db = await openIndex(vault)
  let packs = await loadCourses(vault)

  for (const lib of await listLibraries(vault)) {
    for (const q of await listQuestions(vault, lib.name)) {
      try { upsertQuestion(db, await readQuestion(vault, lib.name, q.id)) } catch {}
    }
  }

  const llmOpts = { provider: config.provider, model: config.model }

  async function makeCard(args) {
    const stem = String(args.stem || '').trim()
    if (!stem) return { ok: false, error: '题干为空' }
    const courseId = args.course || detectCourse(stem)
    const pack = pickCourse(packs, courseId)
    const r = await solveCard(ctx, {
      stem,
      pack,
      form: args.form || detectForm(stem) || pack.form || 'proof',
      style: args.style || pack.style || 'guided',
      effort: args.effort || 'low',
      ...llmOpts,
    })
    if (!r.ok) return r
    const card = r.card
    const v = await verifyEquations(card.verify, { script: VERIFY_PY })
    card.badge = badgeOf(v)
    return { ok: true, card }
  }

  async function saveCard(library, card) {
    const saved = await addQuestion(vault, { ...card, library })
    upsertQuestion(db, await readQuestion(vault, slug(library), saved.id))
    return saved
  }

  ctx.tools.register({
    name: 'study_solve',
    description: '按课程骨架与书写档位生成一张完整题目卡（含步骤/讲解/一句话/验算），并直接写入题库。',
    parameters: {
      type: 'object',
      properties: {
        library: { type: 'string' },
        stem: { type: 'string', description: '题干原文' },
        course: { type: 'string', description: '课程包 id，如 math / physics；缺省 _default' },
        form: { type: 'string', description: 'proof / analysis' },
        style: { type: 'string', description: 'strict / guided / free' },
      },
      required: ['library', 'stem'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'string' },
      render(_a, v) { return [{ type: 'text', text: v }] },
    },
    async execute(args) {
      const r = await makeCard(args)
      if (!r.ok) return '生成失败：' + r.error
      const saved = await saveCard(args.library, r.card)
      return '已生成并入库：' + saved.id + '（' + r.card.badge.text + '）'
    },
  })

  ctx.tools.register({
    name: 'study_add_question',
    description: '把一道题按给定结构写进题库（不调用模型，直接落盘）。library 不存在会自动建库。',
    parameters: {
      type: 'object',
      properties: {
        library: { type: 'string' },
        stem: { type: 'string' },
        title: { type: 'string' },
        topic: { type: 'array', items: { type: 'string' } },
        difficulty: { type: 'string' },
        form: { type: 'string' },
        course: { type: 'string' },
        gist: { type: 'string' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' }, method: { type: 'string' }, intent: { type: 'string' },
              explain: { type: 'string' }, body: { type: 'string' }, keyExpr: { type: 'string' },
            },
          },
        },
      },
      required: ['library', 'stem'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', properties: { id: { type: 'string' }, path: { type: 'string' } }, required: ['id', 'path'] },
      render(_a, v) { return [{ type: 'text', text: '已入库：' + v.id + ' → ' + v.path }] },
    },
    async execute(args) {
      const q = { ...args, title: args.title || String(args.stem).slice(0, 30) }
      const r = await addQuestion(vault, q)
      upsertQuestion(db, await readQuestion(vault, slug(args.library), r.id))
      return r
    },
  })

  ctx.tools.register({
    name: 'study_followup',
    description: '给某道题的某个步骤追加一条追问（及可选回答）。anchor 传 S1/P1… 或 Q。',
    parameters: {
      type: 'object',
      properties: {
        library: { type: 'string' }, id: { type: 'string' }, anchor: { type: 'string' },
        question: { type: 'string' }, answer: { type: 'string' },
      },
      required: ['library', 'id', 'anchor', 'question'],
      additionalProperties: false,
    },
    output: { schema: { type: 'string' }, render(_a, v) { return [{ type: 'text', text: v }] } },
    async execute(args) {
      const file = await appendThread(vault, slug(args.library), args.id, args.anchor, args.question, args.answer)
      upsertQuestion(db, await readQuestion(vault, slug(args.library), args.id))
      return '已追加追问到 ' + file
    },
  })

  ctx.tools.register({
    name: 'study_search',
    description: '在题库里检索题目与知识点（中文按二元组匹配）。',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' }, limit: { type: 'number' } },
      required: ['query'], additionalProperties: false,
    },
    output: { schema: { type: 'string' }, render(_a, v) { return [{ type: 'text', text: v }] } },
    async execute(args) {
      const rows = search(db, args.query, args.limit || 10)
      if (!rows.length) return '没有匹配的题目'
      return rows.map((r, i) => (i + 1) + '. [' + r.lib + '] ' + r.id + ' ' + r.title).join('\n')
    },
  })

  ctx.effect(() => () => { try { db.close() } catch {} }, 'dsh-studygo: close db')
  return { vault, db, packs, makeCard, saveCard, provider, model }
}

export function mountRoutes(ctx, state) {
  const { vault, db, webServer } = state
  if (!webServer) { console.error('[dsh-studygo] webServer 不可用'); return }
  ctx.effect(() => webServer.register({
    kind: 'prefix',
    path: '/study/static',
    handler: async (req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://study.internal')
        const rel = decodeURIComponent(url.pathname.replace(/^\/study\/static\//, ''))
        if (!rel || rel.includes('..')) { res.writeHead(400); res.end('bad'); return }
        const file = join(HERE, '..', 'vendor', 'katex', rel)
        const buf = await readFile(file)
        const ext = rel.split('.').pop().toLowerCase()
        const types = { js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf' }
        res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'max-age=86400' })
        res.end(buf)
      } catch {
        res.writeHead(404); res.end('not found')
      }
    },
  }), 'dsh-studygo: katex static')

  ctx.effect(() => webServer.register({
    kind: 'prefix',
    path: '/study/api',
    handler: async (req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://study.internal')
        const path = url.pathname.replace(/^\/study\/api/, '')
        const method = req.method || 'GET'

        if (path === '/libraries' && method === 'GET') {
          const libs = await listLibraries(vault)
          const out = []
          for (const l of libs) out.push({ ...l, count: (await listQuestions(vault, l.name)).length })
          return json(res, 200, { ok: true, libs: out, stats: stats(db) })
        }
        if (path === '/courses' && method === 'GET') {
          return json(res, 200, { ok: true, courses: [...state.packs.values()].map((p) => ({ id: p.id, name: p.name, form: p.form, style: p.style })) })
        }
        if (path === '/questions' && method === 'GET') {
          return json(res, 200, { ok: true, items: await listQuestions(vault, url.searchParams.get('lib') || '') })
        }
        if (path === '/question' && method === 'GET') {
          const lib = url.searchParams.get('lib') || ''
          const id = url.searchParams.get('id') || ''
          const q = await readQuestion(vault, lib, id)
          const seen = new Set()
          const related = search(db, (q.title || '') + ' ' + (q.stem || '').slice(0, 40), 12)
            .filter((r) => r.id !== q.id)
            .filter((r) => { const k = r.title || r.id; if (seen.has(k)) return false; seen.add(k); return true })
            .slice(0, 5)
          return json(res, 200, { ok: true, question: q, related })
        }
        if (path === '/search' && method === 'GET') {
          const q = url.searchParams.get('q') || ''
          return json(res, 200, { ok: true, items: search(db, q, 20), concepts: searchConcepts(db, q, 10) })
        }
        if (path === '/upload' && method === 'POST') {
          const body = await readBody(req)
          const raw = String(body.data || '').replace(/^data:[^;]+;base64,/, '')
          const buf = Buffer.from(raw, 'base64')
          if (!buf.length) return json(res, 400, { ok: false, error: '空文件' })
          const day = new Date().toISOString().slice(0, 10)
          const dir = join(vault, '附件', day)
          await mkdir(dir, { recursive: true })
          const safe = String(body.name || 'image.png').replace(/[^\w.\-]/g, '_')
          const file = join(dir, Date.now() + '-' + safe)
          await writeFile(file, buf)
          return json(res, 200, { ok: true, path: file, bytes: buf.length })
        }
        if (path === '/ocr' && method === 'POST') {
          const body = await readBody(req)
          const file = String(body.path || '')
          if (!file) return json(res, 400, { ok: false, error: '缺少 path' })
          const b64 = Buffer.from(file, 'utf8').toString('base64')
          const script = join(HERE, '..', 'scripts', 'ocr.ps1')
          const tmpOut = join(tmpdir(), 'study-ocr-' + Date.now() + '.txt')
          const out = await new Promise((resolve) => {
            const p = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-PathB64', b64, '-OutPath', tmpOut], { windowsHide: true })
            let so = ''
            let se = ''
            p.stdout.on('data', (d) => { so += d.toString('utf8') })
            p.stderr.on('data', (d) => { se += d.toString('utf8') })
            p.on('error', () => resolve({ text: '', error: 'spawn failed' }))
            p.on('close', async (code) => {
              let text = so.trim()
              try { const fs2 = await import('node:fs/promises'); text = (await fs2.readFile(tmpOut, 'utf8')).trim(); await fs2.rm(tmpOut, { force: true }) } catch {}
              resolve({ text, error: code === 0 ? '' : se.slice(0, 300) })
            })
          })
          return json(res, 200, { ok: true, text: out.text, error: out.error })
        }
        if (path === '/followup' && method === 'POST') {
          const body = await readBody(req)
          const lib = String(body.library || '')
          const id = String(body.id || '')
          const anchor = String(body.anchor || 'Q')
          const question = String(body.question || '').trim()
          if (!question) return json(res, 400, { ok: false, error: '问题为空' })
          const q = await readQuestion(vault, lib, id)
          const idx = Number(String(anchor).replace(/[^0-9]/g, '')) - 1
          const step = idx >= 0 ? (q.steps || [])[idx] : null
          const prompt = [
            '你是助教。学生在做下面这道题时，对「' + anchor + '」这一步有疑问。',
            '',
            '题干：' + q.stem,
            step ? '该步标题：' + step.title : '',
            step && step.intent ? '该步意图：' + step.intent : '',
            step && step.body ? '该步内容：' + step.body : '',
            '',
            '学生的问题：' + question,
            '',
            '要求：只回答这个疑问，3–6 句，必要时用 $...$ 写公式；不要重复整题解答，不要客套。',
          ].join('\n')
          const { text } = await complete(ctx, { provider: state.provider, model: state.model, user: prompt, effort: 'low', maxTokens: 8000 })
          const answer = String(text || '').trim()
          if (!answer) return json(res, 500, { ok: false, error: '模型没有返回内容' })
          await appendThread(vault, slug(lib), id, anchor, question, answer, body.parent)
          return json(res, 200, { ok: true, answer })
        }
        if (path === '/solve' && method === 'POST') {
          const body = await readBody(req)
          const r = await state.makeCard(body)
          return json(res, r.ok ? 200 : 400, r)
        }
        if (path === '/commit' && method === 'POST') {
          const body = await readBody(req)
          const saved = await state.saveCard(body.library || '收件箱', body.card)
          return json(res, 200, { ok: true, ...saved })
        }
        return json(res, 404, { ok: false, error: 'unknown endpoint' })
      } catch (e) {
        return json(res, 500, { ok: false, error: String((e && e.message) || e) })
      }
    },
  }), 'dsh-studygo: /study/api')
}