import test from 'node:test'
import assert from 'node:assert/strict'

let mod = null
try { mod = await import('../lib/index-db.js') } catch { mod = null }

// 说明：只测纯函数 grams()。SQLite 的增删查在 Windows 上会锁文件（EBUSY），
// 且 node:sqlite 在 Node 22 需实验标志，放进 CI 不稳定，改为在冒烟脚本里人工验证。

test('grams 中文二元组', { skip: !mod && 'node:sqlite 不可用' }, () => {
  const g = mod.grams('导数应用')
  assert.ok(Array.isArray(g))
  assert.deepEqual(g, ['导数', '数应', '应用'])
})

test('grams 英文按词保留', { skip: !mod && 'node:sqlite 不可用' }, () => {
  assert.deepEqual(mod.grams('Fourier Transform'), ['fourier', 'transform'])
})
