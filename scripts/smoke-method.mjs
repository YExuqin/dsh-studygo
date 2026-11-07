
import { mountStudy } from '../lib/host.js'
import { readFile } from 'node:fs/promises'
const VAULT = 'E:\\DSH题库插件\\vault'
const tools = {}
await mountStudy({ tools: { register: (x) => { tools[x.name] = x } }, effect: () => () => {} }, { vault: VAULT })
const r = await tools.study_add_question.execute({
  library: '数学-导数',
  stem: '求 f(x)=x³-3x 在 [-2,2] 上的最值。',
  title: '三次函数闭区间最值（方法标签样例）',
  topic: ['导数', '闭区间最值'],
  steps: [
    { title: '求导', method: 'derivation', intent: '化为驻点问题', body: "f'(x)=3x²-3" },
    { title: '驻点', method: 'critical_point', intent: '找候选点', body: 'x=±1' },
    { title: '比较', method: 'endpoint_compare', intent: '端点与驻点一起比', body: 'f(-2)=-2, f(2)=2, f(-1)=2, f(1)=-2' }
  ]
})
console.log('id:', r.id)
const text = await readFile(r.path, 'utf8')
console.log(text.split('\n').slice(0, 14).join('\n'))
