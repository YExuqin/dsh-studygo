
import { DatabaseSync } from 'node:sqlite'
const db = new DatabaseSync(':memory:')
db.exec("CREATE VIRTUAL TABLE t USING fts5(title, body, tokenize='trigram')")
db.prepare('INSERT INTO t (title, body) VALUES (?, ?)').run('三次函数最值', '已知 f(x)=x³-3x，求闭区间上的最大值与最小值')
for (const q of ['最值', '三次函数', '闭区间', '求最大值', '导数']) {
  try {
    const rows = db.prepare('SELECT title FROM t WHERE t MATCH ?').all(q)
    console.log(q, '->', rows.length)
  } catch (e) { console.log(q, 'ERR', String(e.message).slice(0, 80)) }
}
