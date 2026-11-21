import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseFrontmatter, stringifyFrontmatter, renderQuestion, parseQuestion, parseKnowledge, upsertKnowledge, addQuestion, readQuestion } from '../lib/store.js'

test('frontmatter 往返', () => {
  const data = { id: 'q-1', title: '测试', topic: ['a', 'b'], verify: 'ok' }
  const text = stringifyFrontmatter(data) + '\n正文'
  const back = parseFrontmatter(text)
  assert.equal(back.data.id, 'q-1')
  assert.deepEqual(back.data.topic, ['a', 'b'])
  assert.match(back.body, /正文/)
})

test('题目渲染与解析往返（步骤）', () => {
  const q = {
    id: 'q-20260101-0001', library: '数学', title: '最值', topic: ['最值'], method: ['critical_point'],
    stem: '求 $f(x)=x^2$ 在 $[0,1]$ 的最小值。', form: 'proof', style: 'guided', course: 'math',
    steps: [{ title: '求导', method: 'critical_point', intent: '找驻点', explain: '因为可导', body: '$f\'(x)=2x$', keyExpr: '' }],
    verify: ['$f(0)=0$'], figures: [], threads: [],
  }
  const md = renderQuestion(q)
  const parsed = parseQuestion(md, 'q-20260101-0001.md')
  assert.equal(parsed.id, 'q-20260101-0001')
  assert.equal(parsed.steps.length, 1)
  assert.equal(parsed.steps[0].title, '求导')
  assert.equal(parsed.form, 'proof')
})

test('essay 段落写入 ## 段落 并可读回', () => {
  const q = {
    id: 'q-20260101-0002', library: '英语', title: '作文', topic: ['写作'], method: ['structure'],
    stem: 'Write an essay.', form: 'essay', style: 'guided', course: 'english',
    points: [{ title: '第1段', method: 'structure', intent: '改写点', explain: '理由', body: 'Hello world.' }],
    verify: [], figures: [], threads: [],
  }
  const md = renderQuestion(q)
  assert.match(md, /## 段落/)
  const parsed = parseQuestion(md, 'q-20260101-0002.md')
  assert.equal(parsed.steps.length, 1)
  assert.equal(parsed.steps[0].body, 'Hello world.')
})

test('知识卡读写', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'study-test-'))
  try {
    await upsertKnowledge(dir, '数学', '导数', '- 定义：变化率')
    await upsertKnowledge(dir, '数学', '驻点', '- 定义：f\'(x)=0')
    await upsertKnowledge(dir, '数学', '导数', '- 定义：瞬时变化率')
    const md = await readFile(join(dir, '数学', 'index.md'), 'utf8')
    const cards = parseKnowledge(md)
    assert.equal(cards.length, 2)
    assert.match(cards[0].body, /瞬时变化率/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('addQuestion / readQuestion 往返', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'study-test-'))
  try {
    const r = await addQuestion(dir, { library: '数学', stem: '求 $x$。', title: '小测' })
    const q = await readQuestion(dir, '数学', r.id)
    assert.equal(q.title, '小测')
    assert.match(q.stem, /求/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
