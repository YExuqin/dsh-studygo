
import { DatabaseSync } from 'node:sqlite'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * 中文二元组（bigram）切分：SQLite 的 unicode61 不认识中文词，
 * 所以入索引前把中文串切成两字一组，查询时同样切，靠 FTS 做精确匹配。
 */
export function grams(s) {
  const out = []
  const parts = String(s || '').match(/[\u4e00-\u9fff]+|[A-Za-z0-9_]+/g) || []
  for (const p of parts) {
    if (/^[A-Za-z0-9_]+$/.test(p)) { out.push(p.toLowerCase()); continue }
    if (p.length === 1) { out.push(p); continue }
    for (let i = 0; i + 1 < p.length; i++) out.push(p.slice(i, i + 2))
  }
  return out
}

function toQuery(s) {
  const g = grams(s)
  if (!g.length) return ''
  return g.map((x) => '"' + x.replace(/"/g, '') + '"').join(' AND ')
}

export async function openIndex(vault) {
  const dir = join(vault, '.index')
  await mkdir(dir, { recursive: true })
  const db = new DatabaseSync(join(dir, 'study.db'))
  db.exec([
    'CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, lib TEXT, title TEXT, stem TEXT, topic TEXT, updated TEXT)',
    'CREATE TABLE IF NOT EXISTS concepts (lib TEXT, name TEXT, body TEXT, PRIMARY KEY (lib, name))',
    "CREATE VIRTUAL TABLE IF NOT EXISTS q_fts USING fts5(id UNINDEXED, grams, tokenize='unicode61')",
    "CREATE VIRTUAL TABLE IF NOT EXISTS c_fts USING fts5(lib UNINDEXED, name, grams, tokenize='unicode61')",
  ].join(';'))
  return db
}

export function upsertQuestion(db, q) {
  const topic = Array.isArray(q.topic) ? q.topic.join(' ') : (q.topic || '')
  const stem = q.stem || ''
  const body = [q.title, stem, topic, ...(q.steps || []).map((s) => [s.title, s.intent, s.keyExpr, s.body].join(' '))].join(' ')
  db.prepare('INSERT OR REPLACE INTO questions (id, lib, title, stem, topic, updated) VALUES (?, ?, ?, ?, ?, ?)')
    .run(q.id, q.library || '', q.title || '', stem, topic, q.updated || '')
  db.prepare('DELETE FROM q_fts WHERE id = ?').run(q.id)
  db.prepare('INSERT INTO q_fts (id, grams) VALUES (?, ?)').run(q.id, grams(body).join(' '))
}

export function upsertConcept(db, lib, name, body) {
  db.prepare('INSERT OR REPLACE INTO concepts (lib, name, body) VALUES (?, ?, ?)').run(lib, name, body)
  db.prepare('DELETE FROM c_fts WHERE lib = ? AND name = ?').run(lib, name)
  db.prepare('INSERT INTO c_fts (lib, name, grams) VALUES (?, ?, ?)').run(lib, name, grams(name + ' ' + body).join(' '))
}

export function removeQuestion(db, id) {
  db.prepare('DELETE FROM questions WHERE id = ?').run(id)
  db.prepare('DELETE FROM q_fts WHERE id = ?').run(id)
}

/** 检索；先 AND（精确），无结果再 OR（召回）。 */
export function search(db, text, limit = 20) {
  const q = toQuery(text)
  if (!q) return []
  const run = (expr) => db.prepare(
    'SELECT q.id, q.lib, q.title, q.stem, bm25(q_fts) AS score FROM q_fts JOIN questions q ON q.id = q_fts.id WHERE q_fts MATCH ? ORDER BY score LIMIT ?'
  ).all(expr, limit)
  let rows = run(q)
  if (!rows.length) {
    const or = grams(text).map((x) => '"' + x.replace(/"/g, '') + '"').join(' OR ')
    if (or) rows = run(or)
  }
  return rows
}

export function searchConcepts(db, text, limit = 10) {
  const q = toQuery(text)
  if (!q) return []
  return db.prepare(
    'SELECT c.lib, c.name, bm25(c_fts) AS score FROM c_fts JOIN concepts c ON c.lib = c_fts.lib AND c.name = c_fts.name WHERE c_fts MATCH ? ORDER BY score LIMIT ?'
  ).all(q, limit)
}

export function stats(db) {
  const one = (sql) => db.prepare(sql).get()
  return {
    questions: one('SELECT COUNT(*) AS n FROM questions').n,
    concepts: one('SELECT COUNT(*) AS n FROM concepts').n,
  }
}

export function reset(db) {
  db.exec('DELETE FROM questions; DELETE FROM q_fts; DELETE FROM concepts; DELETE FROM c_fts;')
}
