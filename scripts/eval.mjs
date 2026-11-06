
import { openIndex, search, stats } from '../lib/index-db.js'

const VAULT = process.env.STUDY_VAULT || 'E:\\DSH题库插件\\vault'
const db = await openIndex(VAULT)

const cases = [
  ['最值', ['最大值', '最小值']],
  ['导数 单调', ['单调']],
  ['切线方程', ['切线']],
  ['数列通项', ['通项']],
  ['裂项相消', ['裂项', '前 n 项和']],
  ['三角函数 周期', ['周期']],
  ['数学期望', ['期望']],
  ['牛顿第二定律', ['加速度']],
  ['动量守恒', ['碰后速度', '动量']],
  ['欧姆定律 路端电压', ['路端电压', '欧姆']],
  ['加速度', ['加速度']],
  ['分布列', ['分布列']],
  ['闭区间', ['最大值']],
  ['摩擦因数', ['摩擦']],
]

let hit = 0
for (const [q, want] of cases) {
  const rows = search(db, q, 5)
  const ok = rows.some((r) => want.some((w) => (r.title + ' ' + r.stem).includes(w)))
  if (ok) hit++
  console.log((ok ? 'HIT ' : 'MISS') + ' | ' + q + ' -> ' + rows.length + ' | ' + (rows[0] ? rows[0].title.slice(0, 40) : '-'))
}
console.log('命中率 ' + hit + '/' + cases.length + ' = ' + Math.round(hit / cases.length * 100) + '%')
console.log(JSON.stringify(stats(db)))
