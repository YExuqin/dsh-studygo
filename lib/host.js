
import { readFile, writeFile } from 'node:fs/promises'
import {
  addQuestion, listLibraries, listQuestions,
  questionPath, readQuestion, slug,
} from './store.js'
import { openIndex, upsertQuestion, search, searchConcepts, stats } from './index-db.js'

function json(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(body)
}

/** 在题目 md 的「## 追问」段追加一条，保留其余内容不动。 */
async function appendThread(vault, lib, id, anchor, question, answer) {
  const file = questionPath(vault, lib, id)
  const text = await readFile(file, 'utf8')
  const line = '- @' + anchor + ' ' + question.trim() + (answer ? '\n  - ' + String(answer).trim().replace(/\n/g, '\n    ') : '')
  if (/^##\s*追问\s*$/m.test(text)) {
    const withLine = text.replace(/^(##\s*追问\s*)$/m, '$1\n\n' + line)
    await writeFile(file, withLine.endsWith('\n') ? withLine : withLine + '\n', 'utf8')
  } else {
    const withSection = text.trimEnd() + '\n\n## 追问\n\n' + line + '\n'
    await writeFile(file, withSection, 'utf8')
  }
  return file
}

/** 挂宿主服务、工具、索引。返回面板 API 需要的状态。 */
export async function mountStudy(ctx, config) {
  const vault = config.vault
  const db = await openIndex(vault)

  // 首次挂载时把 vault 已有题目补进索引（幂等）
  for (const lib of await listLibraries(vault)) {
    for (const q of await listQuestions(vault, lib.name)) {
      try { upsertQuestion(db, await readQuestion(vault, lib.name, q.id)) } catch {}
    }
  }

  ctx.tools.register({
    name: 'study_add_question',
    description: '把一道题写进 DSH 题库（vault）。library 不存在会自动建库。返回题目 id 与文件路径。',
    parameters: {
      type: 'object',
      properties: {
        library: { type: 'string', description: '库名，如「数学-导数」' },
        stem: { type: 'string', description: '题干' },
        title: { type: 'string', description: '短标题，缺省取题干前 30 字' },
        topic: { type: 'array', items: { type: 'string' }, description: '知识点' },
        difficulty: { type: 'string', description: '易 / 中 / 难' },
        steps: {
          type: 'array',
          description: '结构化步骤；没有解析的题可以不给',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              intent: { type: 'string' },
              body: { type: 'string' },
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
    description: '给题库里某道题的某个步骤追加一条追问（及可选回答）。anchor 传 S1/S2… 或 Q（整题）。',
    parameters: {
      type: 'object',
      properties: {
        library: { type: 'string' },
        id: { type: 'string', description: '题目 id，如 q-20261107-0001' },
        anchor: { type: 'string', description: 'S1 / S2 / … 或 Q' },
        question: { type: 'string' },
        answer: { type: 'string' },
      },
      required: ['library', 'id', 'anchor', 'question'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'string' },
      render(_a, v) { return [{ type: 'text', text: v }] },
    },
    async execute(args) {
      const file = await appendThread(vault, slug(args.library), args.id, args.anchor, args.question, args.answer)
      upsertQuestion(db, await readQuestion(vault, slug(args.library), args.id))
      return '已追加追问到 ' + file
    },
  })

  ctx.tools.register({
    name: 'study_search',
    description: '在题库里检索题目与知识点（中文按二元组匹配）。用于「相关题」和跨题记忆。',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number', description: '默认 10' },
      },
      required: ['query'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'string' },
      render(_a, v) { return [{ type: 'text', text: v }] },
    },
    async execute(args) {
      const rows = search(db, args.query, args.limit || 10)
      if (!rows.length) return '没有匹配的题目'
      return rows.map((r, i) => (i + 1) + '. [' + r.lib + '] ' + r.id + ' ' + r.title).join('\n')
    },
  })

  ctx.effect(() => () => { try { db.close() } catch {} }, 'dsh-studygo: close db')
  return { vault, db }
}

/** 面板用的只读 HTTP 路由（等 webServer 就绪后再挂）。 */
export function mountRoutes(ctx, state) {
  const { vault, db, webServer } = state
  if (!webServer) { console.error('[dsh-studygo] webServer 不可用，面板数据接口未启用'); return }
  ctx.effect(() => webServer.register({
    kind: 'prefix',
    path: '/study/api',
    handler: async (req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://study.internal')
        const path = url.pathname.replace(/^\/study\/api/, '')
        if (path === '/libraries') {
          const libs = await listLibraries(vault)
          const out = []
          for (const l of libs) out.push({ ...l, count: (await listQuestions(vault, l.name)).length })
          return json(res, 200, { ok: true, libs: out, stats: stats(db) })
        }
        if (path === '/questions') {
          const lib = url.searchParams.get('lib') || ''
          return json(res, 200, { ok: true, items: await listQuestions(vault, lib) })
        }
        if (path === '/question') {
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
        if (path === '/search') {
          const q = url.searchParams.get('q') || ''
          return json(res, 200, { ok: true, items: search(db, q, 20), concepts: searchConcepts(db, q, 10) })
        }
        return json(res, 404, { ok: false, error: 'unknown endpoint' })
      } catch (e) {
        return json(res, 500, { ok: false, error: String((e && e.message) || e) })
      }
    },
  }), 'dsh-studygo: /study/api')
}
