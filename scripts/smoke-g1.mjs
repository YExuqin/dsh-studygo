
import { mountStudy } from '../lib/host.js'
const VAULT = 'E:\\DSH题库插件\\vault'
const tools = {}
const state = await mountStudy({ tools: { register: (t) => { tools[t.name] = t } }, effect: () => () => {} }, { vault: VAULT })
console.log('mounted, tools:', Object.keys(tools).join(','))

const add = tools['study_add_question']
const fol = tools['study_followup']
const sea = tools['study_search']

const r = await add.execute({ library: '数学-导数', stem: '已知 f(x)=x³−3x，求 f 在 [−2,2] 上的最大值与最小值。', title: '三次函数闭区间最值', topic: ['导数', '闭区间最值'], difficulty: '中', steps: [{ title: '求导', intent: '化为驻点问题', body: "f'(x)=3x²−3=3(x−1)(x+1)" }, { title: '驻点', intent: '找候选点', body: 'x=±1' }] })
console.log('add:', JSON.stringify(r))
const f = await fol.execute({ library: '数学-导数', id: r.id, anchor: 'S1', question: '为什么一定要先求导？', answer: '闭区间最值只可能在驻点或端点取得。' })
console.log('followup:', f)
const s = await sea.execute({ query: '闭区间最值', limit: 3 })
console.log('search:\n' + s)
