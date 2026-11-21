import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadCourses, detectCourse, detectForm, pickCourse } from '../lib/courses.js'

test('内置课程包可加载', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'study-courses-'))
  try {
    const packs = await loadCourses(dir)
    assert.ok(packs.has('math'))
    assert.ok(packs.has('english'))
    assert.equal(packs.get('english').form, 'essay')
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('判科：数学 / 英语 / 操作系统', () => {
  assert.equal(detectCourse('求 f(x)=x^2 在闭区间上的最小值'), 'math')
  assert.equal(detectCourse('Write a short essay about college life. ' + 'a'.repeat(90)), 'english')
  assert.equal(detectCourse('若信号量 S 初值为 1，线程进入临界区前需 wait(S)'), 'cs')
})

test('判形态：作文/推导', () => {
  assert.equal(detectForm('请写一篇短文投稿'), 'essay')
  assert.equal(detectForm('求导并讨论单调性'), 'proof')
})

test('pickCourse 回落到 _default', () => {
  const p = pickCourse(new Map(), 'unknown')
  assert.equal(p.id, '_default')
})
