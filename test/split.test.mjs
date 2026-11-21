import test from 'node:test'
import assert from 'node:assert/strict'
import { splitQuestions } from '../lib/split.js'

test('编号题按题号切分', () => {
  const t = '1. 求极限 lim(x->0) sin x / x 的值。\n2. 计算定积分 ∫0^1 x dx。\n3. 讨论 f(x)=x^2 的单调性。'
  const parts = splitQuestions(t)
  assert.equal(parts.length, 3)
  assert.match(parts[0].text, /^1\./)
  assert.match(parts[2].text, /^3\./)
})

test('选择题的选项不会被当成新题', () => {
  const t = '1. 下列哪个是质数？（ ）\n（A）4 （B）6 （C）7 （D）9\n2. 下列哪个是偶数？（ ）\n（A）3 （B）5 （C）8 （D）11'
  const parts = splitQuestions(t)
  assert.equal(parts.length, 2)
  assert.ok(parts[0].text.includes('（A）4'))
})

test('单题不切分', () => {
  const t = '求函数 f(x)=x^2-4x+3 在闭区间 [0,5] 上的最大值与最小值，并说明理由。'
  assert.equal(splitQuestions(t).length, 1)
})

test('连接词可作为题界', () => {
  const t = '设函数 f(x)=x^3-3x，讨论单调性。第二道：已知 a1=1，an+1=2an+1，求通项。'
  assert.equal(splitQuestions(t).length, 2)
})
