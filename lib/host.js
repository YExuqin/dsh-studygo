import { readFile, writeFile, mkdir, readdir, rm, rmdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  addQuestion, listLibraries, listQuestions,
  questionPath, readQuestion, slug, createLibrary, threadLines, parseKnowledge, upsertKnowledge, renderQuestion,
} from './store.js'
import { openIndex, upsertQuestion, search, searchConcepts, stats, prune } from './index-db.js'
import { loadCourses, pickCourse, detectCourse, detectForm } from './courses.js'
import { solveCard } from './solve.js'
import { complete } from './llm.js'
import { relations } from './relations.js'
import { docxToText } from './docx.js'
import { readLinks, writeLinks } from './links.js'
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

/** 编辑距离，用于库名相似判断。 */
function levenshtein(a, b) {
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = new Array(n + 1)
  let cur = new Array(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j
  for (let i = 1; i <= m; i++) {
    cur[0] = i
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    const tmp = prev; prev = cur; cur = tmp
  }
  return prev[n]
}

/** 把一页 OCR 文本切成多道题：按「1.」「2、」「（1）」「第3题」「例4」等题号切。 */
export function splitQuestions(text) {
  let src = String(text || '').replace(/\r/g, '')
  if (src.indexOf('\n') < 0) src = src.replace(/([。；;\s])\s*(?=\d{1,2}\s*[.、．])/g, '$1\n')
  src = src.replace(/([。！？])\s*(?=(?:第二题|第二道|下一题)[，,：:]?)/g, '$1\n')
  const lines = src.split('\n')
  const numHead = /^\s*([Il1-9]\d?)\s*[.、．)]\s*(.*)$/
  const cnHead = /^\s*(?:第\s*[一二三四五六七八九十\d]{1,3}\s*(?:题|道)|下一题|例\s*\d{1,2}|习题\s*\d{1,2})/
  const optLine = /^\s*[（(]?\s*[A-DＡ-Ｄ]\s*[）)]/
  const segs = []
  let cur = []
  const curLen = () => cur.join(' ').trim().length
  const push = () => { const s = cur.join('\n').trim(); if (s) segs.push(s); cur = [] }
  for (const line of lines) {
    const isOpt = optLine.test(line)
    const mh = numHead.exec(line)
    const headBody = mh ? mh[2].trim() : ''
    const isNumHead = !!mh && !isOpt && headBody.length >= 6 && !/^[（(]?\s*[A-D]\s*[）)]/.test(headBody)
    const isHead = !isOpt && (isNumHead || cnHead.test(line))
    if (isHead && curLen() > 4) push()
    cur.push(line)
  }
  push()
  const clean = segs.filter((s) => s.replace(/\s/g, '').length >= 2)
  if (!clean.length) return [{ index: 0, text: src.trim() }]
  return clean.map((s, i) => ({ index: i, text: s, title: s.split('\n')[0].slice(0, 30) }))
}

/** 先放大再 OCR（Windows OCR 对小字号很差），返回文字。 */
async function ocrWithUpscale(file, pyPath, ocrScript, tmpDir) {
  let target = file
  let temp = ''
  try {
    const out = join(tmpDir, 'up-' + Date.now() + '.png')
    const ok = await new Promise((resolve) => {
      const p = spawn(pyPath, [join(HERE, '..', 'scripts', 'upscale.py'), file, out], { windowsHide: true })
      p.on('error', () => resolve(false))
      p.on('close', (code) => resolve(code === 0))
    })
    if (ok) { target = out; temp = out }
  } catch {}
  const text = await new Promise((resolve) => {
    const tmpOut = join(tmpDir, 'ocr-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.txt')
    const b64 = Buffer.from(target, 'utf8').toString('base64')
    const p = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ocrScript, '-PathB64', b64, '-OutPath', tmpOut], { windowsHide: true })
    p.on('error', () => resolve(''))
    p.on('close', async () => {
      try {
        const t = await readFile(tmpOut, 'utf8')
        await rm(tmpOut, { force: true })
        resolve(t.trim())
      } catch { resolve('') }
    })
  })
  if (temp) await rm(temp, { force: true }).catch(() => {})
  return text
}

export async function mountStudy(ctx, config) {
  const vault = config.vault
  const provider = config.provider
  const model = config.model
  const db = await openIndex(vault)
  let packs = await loadCourses(vault)

  const seen = []
  for (const lib of await listLibraries(vault)) {
    for (const q of await listQuestions(vault, lib.name)) {
      seen.push(q.id)
      try { upsertQuestion(db, await readQuestion(vault, lib.name, q.id)) } catch {}
    }
  }
  try { const n = prune(db, seen); if (n) console.log('[dsh-studygo] 清理索引孤儿', n) } catch {}

  const llmOpts = { provider: config.provider, model: config.model }
  const links = await readLinks(vault)

  async function makeCard(args) {
    const stem = String(args.stem || '').trim()
    if (!stem) return { ok: false, error: '题干为空' }
    const courseId = args.course || detectCourse(stem)
    const pack = pickCourse(packs, courseId)
    let refs = []
    try {
      const seen = new Set()
      refs = search(db, stem, 6)
        .filter((r) => String(r.lib) === slug(args.library || ''))
        .filter((r) => { if (seen.has(r.title)) return false; seen.add(r.title); return true })
        .slice(0, 3)
        .map((r) => ({ id: r.id, title: r.title, topic: '' }))
    } catch {}
    const r = await solveCard(ctx, {
      stem,
      pack,
      form: (function () {
        if (args.form) return args.form
        if (pack.form === 'essay') return 'essay'
        const d = detectForm(stem)
        if (d && d !== 'proof') return d
        return pack.form || d || 'proof'
      })(),
      style: args.style || pack.style || 'guided',
      refs,
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
  return { vault, db, packs, makeCard, saveCard, provider, model, python: config.python || '' }
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

        if (path === '/related' && method === 'GET') {
          const links = await readLinks(vault)
          const lib = url.searchParams.get('lib') || ''
          const id = url.searchParams.get('id') || ''
          const q = await readQuestion(vault, lib, id)
          const pool = []
          for (const it of await listQuestions(vault, lib)) {
            if (it.id === id) continue
            try {
              const fq = await readQuestion(vault, lib, it.id)
              pool.push({ id: fq.id, title: fq.title, topic: fq.topic, method: fq.method || (fq.steps || []).map((s) => s.method) })
            } catch {}
          }
          const cur = { id: q.id, topic: q.topic, method: q.method || (q.steps || []).map((s) => s.method) }
          const deny = new Set((links.deny || []).map((p) => p.replace(/^(.+)\|(.+)$/, (m, a, b) => a < b ? a + '|' + b : b + '|' + a)))
          const pair = (a, b) => (a < b ? a + '|' + b : b + '|' + a)
          const all = relations(cur, pool)
          const list = all.filter((r) => !deny.has(pair(cur.id, r.id)))
          const hidden = all.filter((r) => deny.has(pair(cur.id, r.id))).map((r) => ({ id: r.id, title: r.title }))
          return json(res, 200, { ok: true, items: list, hidden })
        }
        if (path === '/feedback' && method === 'POST') {
          const links = await readLinks(vault)
          const body = await readBody(req)
          const a = String(body.id || '')
          const b = String(body.other || '')
          const action = String(body.action || '')
          const pair = a < b ? a + '|' + b : b + '|' + a
          if (action === 'deny') {
            links.deny = Array.from(new Set([...(links.deny || []), pair]))
          } else if (action === 'allow') {
            links.deny = (links.deny || []).filter((p) => p !== pair)
          } else if (action === 'up' || action === 'down') {
            links.votes = links.votes || {}
            links.votes[pair] = action
          }
          await writeLinks(vault, links)
          return json(res, 200, { ok: true })
        }
        if (path === '/compare' && method === 'POST') {
          const body = await readBody(req)
          const lib = String(body.lib || '')
          const qa = await readQuestion(vault, lib, String(body.a || ''))
          const qb = await readQuestion(vault, lib, String(body.b || ''))
          const ask = String(body.question || '').trim()
          const brief = (q) => [
            '题目：' + (q.title || q.id),
            '题干：' + q.stem,
            '解法步骤：' + (q.steps || []).map((s, i) => (i + 1) + '. ' + s.title + '（' + s.method + '）').join(' | '),
          ].join('\n')
          const prompt = [
            '你是助教。下面两道题，请对比它们的解法。',
            '',
            '[A] ' + brief(qa),
            '',
            '[B] ' + brief(qb),
            '',
            ask ? '学生的具体问题：' + ask : '请说明：两者的解法哪里一样、哪里不同，为什么。',
            '',
            '要求：先一句总结（同套路 / 形似神不似），再逐条对比差异，最后点出学生容易混的地方。200–350 字，用 $...$ 写公式。',
          ].join('\n')
          const { text } = await complete(ctx, { provider: state.provider, model: state.model, user: prompt, effort: 'low', maxTokens: 8000 })
          return json(res, 200, { ok: true, answer: String(text || '').trim() })
        }
        if (path === '/knowledge' && method === 'GET') {
          const lib = url.searchParams.get('lib') || ''
          let text = ''
          try { text = await readFile(join(vault, slug(lib), 'index.md'), 'utf8') } catch {}
          const cards = parseKnowledge(text)
          const topics = new Map()
          for (const it of await listQuestions(vault, lib)) {
            try {
              const q = await readQuestion(vault, lib, it.id)
              for (const t of q.topic || []) topics.set(t, (topics.get(t) || 0) + 1)
            } catch {}
          }
          return json(res, 200, {
            ok: true,
            cards,
            topics: [...topics.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 20),
          })
        }
        if (path === '/knowledge/save' && method === 'POST') {
          const body = await readBody(req)
          const r = await upsertKnowledge(vault, String(body.lib || ''), String(body.name || ''), String(body.body || ''))
          return json(res, 200, { ok: true, ...r })
        }
        if (path === '/knowledge/draft' && method === 'POST') {
          const body = await readBody(req)
          const lib = String(body.lib || '')
          const facts = []
          const topicMap = new Map()
          for (const it of await listQuestions(vault, lib)) {
            try {
              const q = await readQuestion(vault, lib, it.id)
              for (const t of q.topic || []) {
                const cur = topicMap.get(t) || { count: 0, ids: [], steps: [] }
                cur.count++
                if (cur.ids.length < 3) cur.ids.push(q.id)
                for (const s of q.steps || []) if (cur.steps.length < 4) cur.steps.push(s.title)
                topicMap.set(t, cur)
              }
            } catch {}
          }
          if (!topicMap.size) return json(res, 200, { ok: true, made: 0 })
          const list = [...topicMap.entries()].slice(0, 8).map(([name, v]) => ({ name, count: v.count, ids: v.ids, steps: v.steps }))
          const prompt = [
            '你在为一个题库编写「知识卡」。下面是这个库里出现的知识点（附题量与典型步骤）。',
            '',
            list.map((x) => '- ' + x.name + '（' + x.count + ' 题，步骤：' + x.steps.join('/') + '）').join('\n'),
            '',
            '为每个知识点写一张卡，格式严格 JSON：',
            '{"cards":[{"name":"知识点名","body":"- 定义：…\\n- 方法：…\\n- 易错：…"}]}',
            '要求：每条 3 行以内，中文，具体，不要空话；结合上面给出的步骤示例。',
          ].join('\n')
          let made = 0
          try {
            const { text } = await complete(ctx, { provider: state.provider, model: state.model, user: prompt, effort: 'low', maxTokens: 12000 })
            const parsed = JSON.parse((String(text).match(/\{[\s\S]*\}/) || ['{}'])[0])
            for (const c of parsed.cards || []) {
              if (!c || !c.name) continue
              await upsertKnowledge(vault, lib, String(c.name), String(c.body || ''))
              made++
            }
          } catch (e) {
            for (const x of list) {
              await upsertKnowledge(vault, lib, x.name, '- 涉及 ' + x.count + ' 道题：' + x.ids.join('、') + '\n- （模型生成失败，待手动补充）')
              made++
            }
          }
          return json(res, 200, { ok: true, made })
        }
        if (path === '/library/create' && method === 'POST') {
          const body = await readBody(req)
          const name = String(body.name || '').trim()
          if (!name) return json(res, 400, { ok: false, error: '库名为空' })
          const libs = await listLibraries(vault)
          const target = name.replace(/\s+/g, '')
          const similar = []
          for (const l of libs) {
            const cur = l.name.replace(/\s+/g, '')
            if (cur === target) continue
            let score = 0
            if (cur.indexOf(target) >= 0 || target.indexOf(cur) >= 0) score = 0.9
            else {
              const d = levenshtein(cur, target)
              score = 1 - d / Math.max(cur.length, target.length)
            }
            if (score >= 0.6) similar.push({ name: l.name, score: Number(score.toFixed(2)) })
          }
          similar.sort((a, b) => b.score - a.score)
          if (similar.length && !body.force) return json(res, 200, { ok: false, needsConfirm: true, similar: similar.slice(0, 3) })
          const r = await createLibrary(vault, name, { subject: body.subject || '' })
          return json(res, 200, { ok: true, library: r.id })
        }
        if (path === '/suggest-library' && method === 'POST') {
          const body = await readBody(req)
          const stem = String(body.stem || '')
          const course = detectCourse(stem)
          const pack = state.packs.get(course)
          const libs = await listLibraries(vault)
          const best = { name: '', score: 0 }
          for (const l of libs) {
            const hits = search(db, stem, 8).filter((x) => x.lib === l.name)
            if (hits.length <= best.score) continue
            const tally = {}
            for (const it of await listQuestions(vault, l.name)) {
              try {
                const q = await readQuestion(vault, l.name, it.id)
                const c = q.course && q.course !== '_default' ? q.course : ''
                if (c) tally[c] = (tally[c] || 0) + 1
              } catch {}
            }
            let dom = ''
            let n = 0
            for (const k of Object.keys(tally)) if (tally[k] > n) { n = tally[k]; dom = k }
            if (dom && course !== '_default' && dom !== course) continue
            best.name = l.name
            best.score = hits.length
          }
          if (best.name && best.score >= 2) return json(res, 200, { ok: true, library: best.name, reason: '同库已有相似题 ' + best.score + ' 道' })
          const base = (pack && pack.name) || '收件箱'
          const same = libs.find((l) => l.name === base)
          if (same) return json(res, 200, { ok: true, library: base, reason: '同科目库已存在' })
          const prefixed = libs.find((l) => l.name.indexOf(base + '-') === 0)
          if (prefixed) return json(res, 200, { ok: true, library: prefixed.name, reason: '同科目库已存在（' + prefixed.name + '）' })
          return json(res, 200, { ok: true, library: '', reason: '没有科目相同且相近的库', newName: base })
        }
        if (path === '/ingest/batch' && method === 'POST') {
          const body = await readBody(req, 40 * 1024 * 1024)
          const items = Array.isArray(body.items) ? body.items : []
          const out = []
          const day = new Date().toISOString().slice(0, 10)
          const dir = join(vault, '附件', day)
          await mkdir(dir, { recursive: true })
          for (let i = 0; i < items.length; i++) {
            const it = items[i]
            try {
              const raw = String(it.data || '').replace(/^data:[^;]+;base64,/, '')
              const buf = Buffer.from(raw, 'base64')
              const safe = String(it.name || ('image-' + i + '.png')).replace(/[^\w.\-]/g, '_')
              const file = join(dir, Date.now() + '-' + i + '-' + safe)
              await writeFile(file, buf)
              const script = join(HERE, '..', 'scripts', 'ocr.ps1')
              const text = await ocrWithUpscale(file, state.python || 'python', script, tmpdir())
              out.push({ id: 'ing-' + Date.now() + '-' + i, path: file, name: it.name || '', text })
            } catch (e) {
              out.push({ id: 'ing-' + Date.now() + '-' + i, path: '', name: it.name || '', text: '', error: String(e && e.message || e) })
            }
          }
          return json(res, 200, { ok: true, items: out })
        }
        if (path === '/ingest/queue' && method === 'GET') {
          try {
            const q = JSON.parse(await readFile(join(vault, '.meta', 'queue.json'), 'utf8'))
            return json(res, 200, { ok: true, rows: Array.isArray(q.rows) ? q.rows : [] })
          } catch { return json(res, 200, { ok: true, rows: [] }) }
        }
        if (path === '/ingest/queue' && method === 'POST') {
          const body = await readBody(req, 8 * 1024 * 1024)
          const dir = join(vault, '.meta')
          await mkdir(dir, { recursive: true })
          await writeFile(join(dir, 'queue.json'), JSON.stringify({ rows: Array.isArray(body.rows) ? body.rows : [] }), 'utf8')
          return json(res, 200, { ok: true })
        }
        if (path === '/ingest/split' && method === 'POST') {
          const body = await readBody(req)
          const text = String(body.text || '')
          let parts = splitQuestions(text)
          if (parts.length === 1 && text.length > 260 && body.ai !== false) {
            try {
              const prompt = [
                '下面是一页题目的 OCR 文本，可能含多道题，也可能只有一道。',
                '请按题意切成若干道独立的题目，严格 JSON：{"items":["第一题全文","第二题全文"]}',
                '规则：不要改写、不要补全、不要丢内容；如果只有一道题就返回一项。',
                '',
                text.slice(0, 4000),
              ].join('\n')
              const { text: out } = await complete(ctx, { provider: state.provider, model: state.model, user: prompt, effort: 'low', maxTokens: 4000 })
              const parsed = JSON.parse((String(out).match(/\{[\s\S]*\}/) || ['{}'])[0])
              const arr = (parsed.items || []).map((s) => String(s || '').trim()).filter((s) => s.length > 6)
              if (arr.length > 1) parts = arr.map((s, i) => ({ index: i, text: s, title: s.split('\n')[0].slice(0, 30) }))
            } catch {}
          }
          return json(res, 200, { ok: true, items: parts })
        }
        if (path === '/ingest/docx' && method === 'POST') {
          const body = await readBody(req, 40 * 1024 * 1024)
          const raw = String(body.data || '').replace(/^data:[^;]+;base64,/, '')
          const buf = Buffer.from(raw, 'base64')
          if (!buf.length) return json(res, 400, { ok: false, error: '空文件' })
          const text = docxToText(buf)
          if (!text) return json(res, 200, { ok: false, error: '没抽到文字（可能是扫描版或旧 .doc）' })
          return json(res, 200, { ok: true, text })
        }
        if (path === '/library/merge' && method === 'POST') {
          const body = await readBody(req)
          const from = slug(String(body.from || ''))
          const to = slug(String(body.to || ''))
          if (!from || !to || from === to) return json(res, 400, { ok: false, error: '参数不合法' })
          await createLibrary(vault, to)
          const src = join(vault, from)
          let moved = 0
          try {
            for (const f of await readdir(src)) {
              if (!/^q-\d{8}-\d{4}\.md$/.test(f)) continue
              const text = await readFile(join(src, f), 'utf8')
              const fixed = text.replace(/^library:\s*.*$/m, 'library: ' + to)
              await writeFile(questionPath(vault, to, f.replace(/\.md$/, '')), fixed, 'utf8')
              await rm(join(src, f))
              moved++
            }
            await rm(join(src, 'index.md'), { force: true })
            await rmdir(src).catch(() => {})
          } catch (e) {
            return json(res, 500, { ok: false, error: String(e && e.message || e), moved })
          }
          try { const seen = []; for (const l of await listLibraries(vault)) for (const q of await listQuestions(vault, l.name)) { seen.push(q.id); upsertQuestion(db, await readQuestion(vault, l.name, q.id)) } prune(db, seen) } catch {}
          return json(res, 200, { ok: true, moved })
        }
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
          const all = await listQuestions(vault, url.searchParams.get('lib') || '')
          const offset = Number(url.searchParams.get('offset') || 0)
          const limit = Number(url.searchParams.get('limit') || 0)
          const items = limit > 0 ? all.slice(offset, offset + limit) : all
          return json(res, 200, { ok: true, items, total: all.length, offset })
        }
        if (path === '/attachment' && method === 'GET') {
          const p = String(url.searchParams.get('path') || '')
          if (!p || !p.startsWith(vault)) return json(res, 403, { ok: false, error: '不允许的路径' })
          try {
            const buf = await readFile(p)
            res.writeHead(200, { 'content-type': p.endsWith('.png') ? 'image/png' : 'image/jpeg' })
            res.end(buf)
          } catch {
            json(res, 404, { ok: false, error: '文件不存在' })
          }
          return
        }
        if (path === '/export' && method === 'GET') {
          const lib = url.searchParams.get('lib') || ''
          const items = await listQuestions(vault, lib)
          const parts = []
          for (const it of items) {
            try {
              const q = await readQuestion(vault, lib, it.id)
              parts.push(renderQuestion(q))
            } catch {}
          }
          const header = '# ' + lib + '\n\n导出时间：' + new Date().toISOString().slice(0, 10) + ' · 共 ' + items.length + ' 题\n\n---\n\n'
          const body = header + parts.join('\n---\n\n')
          return json(res, 200, { ok: true, filename: lib + '.md', text: body })
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