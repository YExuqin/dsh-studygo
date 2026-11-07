const base = process.argv[2]
const token = process.argv[3]
const r0 = await fetch(base + '/?token=' + token)
const cookie = (r0.headers.get('set-cookie') || '').split(';')[0]
const headers = { 'content-type': 'application/json', cookie }

const card = {
  title: '闭环传递函数与结构图（图示测试）',
  gist: '前向通道乘反馈串并联，先用方框图化简再写传递函数。',
  topic: ['结构图', '传递函数'],
  method: ['block_reduce'],
  stem: '已知结构图如右：前向 $G(s)=\\$frac{10}{s+1}$，反馈 $H(s)=1$，求闭环传递函数。',
  form: 'proof',
  style: 'guided',
  course: 'physics',
  steps: [
    { title: '识别环节', method: 'block_reduce', intent: '分清前向与反馈', explain: '方框图先认串并联。', body: '前向通道：$G(s)$；反馈：$H(s)=1$。', keyExpr: '' },
    { title: '套用公式', method: 'block_reduce', intent: '用闭环公式', explain: '负反馈标准式。', body: '$$\\Phi(s)=\\frac{G(s)}{1+G(s)H(s)}$$', keyExpr: '' }
  ],
  figures: [{
    type: 'block', direction: 'LR',
    nodes: [ { id: 'r', label: 'R(s)' }, { id: 's', label: 'Σ', shape: 'circle' }, { id: 'g', label: 'G(s)' }, { id: 'c', label: 'C(s)' }, { id: 'h', label: 'H(s)' } ],
    edges: [ { from: 'r', to: 's' }, { from: 's', to: 'g', label: 'E' }, { from: 'g', to: 'c' }, { from: 'c', to: 'h' }, { from: 'h', to: 's' } ]
  }],
  badge: { status: 'ok', text: '已验算' }
}
const saved = await (await fetch(base + '/study/api/commit', { method: 'POST', headers, body: JSON.stringify({ library: '示例-100题', card }) })).json()
console.log('saved:', saved.id, saved.path)
