
import { createLibrary, addQuestion } from '../lib/store.js'
import { openIndex, upsertQuestion, search, stats, reset } from '../lib/index-db.js'

const VAULT = process.env.STUDY_VAULT || 'E:\\DSH题库插件\\vault'
const LIB = '示例-100题'

const topics = [
  { t: ['导数', '单调性'], s: (i) => '讨论 f(x)=x^3-' + (3 + i % 4) + 'x 的单调区间', steps: ['求导', '解 f\'(x)=0', '列表判号', '写结论'] },
  { t: ['导数', '闭区间最值'], s: (i) => '求 f(x)=x^3-3x 在 [' + (-2 - i % 2) + ',2] 上的最大值与最小值', steps: ['求导', '找驻点', '算端点与驻点', '比较取最值'] },
  { t: ['导数', '切线'], s: (i) => '求曲线 y=x^2 在 x=' + (1 + i % 3) + ' 处的切线方程', steps: ['求导得斜率', '点斜式', '化简'] },
  { t: ['数列', '通项'], s: (i) => '已知 a1=' + (i % 3 + 1) + '，a(n+1)=2a(n)+1，求通项', steps: ['构造等比', '求公比', '写通项'] },
  { t: ['数列', '求和'], s: (i) => '求数列 {1/(n(n+1))} 的前 n 项和', steps: ['裂项', '相消', '化简'] },
  { t: ['三角函数', '周期'], s: (i) => '求 y=sin(' + (2 + i % 3) + 'x+π/6) 的最小正周期与单调增区间', steps: ['用 2π/ω 求周期', '解不等式求区间'] },
  { t: ['概率', '期望'], s: (i) => '袋中 ' + (3 + i % 3) + ' 红 ' + (2 + i % 2) + ' 白，任取 2 球，求红球数的分布列与期望', steps: ['定分布', '算概率', '算期望'] },
  { t: ['力学', '牛顿第二定律'], s: (i) => '质量 ' + (2 + i % 3) + 'kg 的物体受水平恒力 ' + (6 + i % 5) + 'N，摩擦因数 0.2，求加速度', steps: ['受力分析', '列牛顿第二定律', '代入求 a'] },
  { t: ['力学', '动量守恒'], s: (i) => '小球以 ' + (3 + i % 4) + 'm/s 撞静止小球并粘在一起，求碰后速度', steps: ['选系统', '动量守恒', '解 v'] },
  { t: ['电磁学', '欧姆定律'], s: (i) => '电源电动势 6V 内阻 0.5Ω，外接 ' + (2 + i % 4) + 'Ω 电阻，求电流与路端电压', steps: ['闭合电路欧姆定律', '求电流', '求路端电压'] },
]

const n = 100
const db = await openIndex(VAULT)
reset(db)
await createLibrary(VAULT, LIB, { subject: '测试' })

for (let i = 1; i <= n; i++) {
  const k = topics[i % topics.length]
  const steps = k.steps.map((title, j) => ({
    title,
    intent: '第 ' + (j + 1) + ' 步：' + title,
    body: '（示例题 ' + i + ' 的推导过程，略）',
  }))
  const q = {
    library: LIB,
    title: k.s(i),
    stem: k.s(i) + '。',
    topic: k.t,
    difficulty: ['易', '中', '难'][i % 3],
    steps,
  }
  const r = await addQuestion(VAULT, q)
  const { readQuestion } = await import('../lib/store.js')
  upsertQuestion(db, await readQuestion(VAULT, LIB, r.id))
}

const queries = [
  ['最值', ['闭区间最值']],
  ['导数 单调', ['导数']],
  ['切线方程', ['导数']],
  ['数列通项', ['数列']],
  ['裂项相消', ['数列']],
  ['三角函数 周期', ['三角函数']],
  ['数学期望', ['概率']],
  ['牛顿第二定律', ['力学']],
  ['动量守恒', ['力学']],
  ['欧姆定律 路端电压', ['电磁学']],
  ['加速度', ['力学']],
  ['分布列', ['概率']],
]

let hit = 0
for (const [q, want] of queries) {
  const rows = search(db, q, 5)
  const ok = rows.some((r) => want.some((w) => (r.title + r.stem).includes(w)))
  if (ok) hit++
  console.log((ok ? 'HIT ' : 'MISS') + ' | ' + q + ' -> ' + rows.length + ' | ' + (rows[0] ? rows[0].title : '-'))
}
console.log('命中率 ' + hit + '/' + queries.length, JSON.stringify(stats(db)))
