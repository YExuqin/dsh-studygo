import test from 'node:test'
import assert from 'node:assert/strict'
import { relations } from '../lib/relations.js'

const base = { id: 'a', topic: ['闭区间最值', '驻点'], method: ['critical_point', 'endpoint_compare'] }

test('同套路：方法骨架一致', () => {
  const pool = [{ id: 'b', title: 'B', topic: ['最值'], method: ['critical_point', 'endpoint_compare'] }]
  const r = relations(base, pool)
  assert.equal(r.length, 1)
  assert.equal(r[0].kind, 'same-method')
})

test('形似神不似：考点重合但解法不同', () => {
  const pool = [{ id: 'c', title: 'C', topic: ['闭区间最值'], method: ['graph', 'table'] }]
  const r = relations(base, pool)
  assert.equal(r[0].kind, 'false-friend')
})

test('无关题不返回', () => {
  const pool = [{ id: 'd', title: 'D', topic: ['文言实词'], method: ['translate'] }]
  assert.equal(relations(base, pool).length, 0)
})
