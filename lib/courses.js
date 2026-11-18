import { readFile, readdir, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseYaml } from './yaml.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const BUILTIN = join(HERE, '..', 'courses')

/** 读取内置包 + 用户包（vault/.meta/courses），同 id 用户覆盖内置。 */
export async function loadCourses(vault) {
  const map = new Map()
  const read = async (dir) => {
    let files = []
    try { files = await readdir(dir) } catch { return }
    for (const f of files) {
      if (!/\.ya?ml$/.test(f)) continue
      try {
        const txt = await readFile(join(dir, f), 'utf8')
        const pack = parseYaml(txt)
        if (pack && pack.id) map.set(pack.id, pack)
      } catch {}
    }
  }
  await read(BUILTIN)
  await read(join(vault, '.meta', 'courses'))
  return map
}


/** 关键词表：用于无模型时判断科目（零成本、可解释）。 */
const KEYWORDS = [
  ['linalg', ['矩阵', '行列式', '特征值', '秩', '向量组', '线性方程组', '初等变换']],
  ['autocontrol', ['传递函数', '拉氏变换', '结构图', '梅森', '闭环', '开环', '根轨迹', '稳定性判据', '伯德']],
  ['physics', ['速度', '加速度', '受力', '动量', '能量守恒', '电动势', '电阻', '电场', '磁场', '角动量', '牛顿']],
  ['chemistry', ['化学', '反应', '配平', '溶液', '摩尔', '氧化', '还原', '滴定', '有机物', '方程式']],
  ['biology', ['细胞', '遗传', '基因', '蛋白质', '光合', '呼吸作用', '生态', '种群', '酶']],
  ['english', ['translate', 'translation', 'essay', 'composition', 'grammar', '英语作文', '翻译', '阅读', '英文报', 'opinion', 'writing', '词数', '短文', '投稿', '英语', '英文']],
  ['chinese', ['文言', '古诗', '修辞', '散文', '阅读题', '作文题', '赏析']],
  ['cs', ['算法', '复杂度', '伪代码', '数据结构', '二叉树', '排序算法', '指针', '程序', '编译', '进程', '线程', '数据库', '索引', '操作系统', '信号量', '互斥', '临界区', '死锁', '自旋', '并发', '调度', '同步', '原子', '缓冲区', '管程', '竞态', '共享变量']],
  ['math', ['求导', '积分', '极限', '导数', '函数', '方程', '不等式', '最值', '最大值', '最小值', '极值', '极大', '极小', '单调', '概率', '数列', '向量', '曲线', '连续', '正态', '检验', '方差', '样本', '置信', '统计']],
]

/** 按关键词判断课程包 id；判断不出返回 '_default'。 */
export function detectCourse(stem) {
  const s = String(stem || '')
  let best = null
  let bestScore = 0
  for (const [id, words] of KEYWORDS) {
    let score = 0
    for (const w of words) if (s.includes(w)) score += w.length
    if (score > bestScore) { bestScore = score; best = id }
  }
  const latin = (s.match(/[A-Za-z]/g) || []).length
  if (best !== 'english' && latin >= 80 && latin / Math.max(1, s.length) > 0.28) best = 'english'
  return bestScore >= 1 || best ? best : '_default'
}

/** 按题干特征判断答案形态。 */
export function detectForm(stem) {
  const s = String(stem || '')
  if (/画|绘制|作图|结构图|流程图|E-R|ER 图|示意图/.test(s)) return 'diagram'
  if (/作文|翻译|书面表达|英文写作|改写/.test(s)) return 'essay'
  if (/简述|说明|分析|解释|为什么|比较|论述/.test(s)) return 'analysis'
  return 'proof'
}

export function pickCourse(packs, id) {
  return packs.get(id) || packs.get('_default') || { id: '_default', name: '通用', form: 'proof', style: 'guided', methods: [] }
}

export async function ensureCoursesDir(vault) {
  await mkdir(join(vault, '.meta', 'courses'), { recursive: true })
}