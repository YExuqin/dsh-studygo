/** 关系计算：同考点 / 同套路 / 形似神不似。只做同库，精度优先。 */

function lcs(a, b) {
  const n = a.length, m = b.length
  if (!n || !m) return 0
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[n][m]
}

function methodSim(a, b) {
  const x = (a || []).filter(Boolean)
  const y = (b || []).filter(Boolean)
  if (!x.length || !y.length) return 0
  return lcs(x, y) / Math.max(x.length, y.length)
}

function topicOverlap(a, b) {
  const x = (a || []).filter(Boolean)
  const y = new Set((b || []).filter(Boolean))
  const hit = x.filter((t) => y.has(t))
  return { hit, score: hit.length / Math.max(1, Math.min(x.length, y.size)) }
}

/**
 * @param base 当前题 { id, topic, method }
 * @param pool 同库其它题 [{ id, title, topic, method }]
 * @returns [{ id, title, kind, score, reason }]
 */
export function relations(base, pool, opts = {}) {
  const out = []
  for (const other of pool) {
    if (!other || other.id === base.id) continue
    const t = topicOverlap(base.topic, other.topic)
    const m = methodSim(base.method, other.method)
    if (t.hit.length && m < 0.4) {
      out.push({ id: other.id, title: other.title, kind: 'false-friend', score: 0.9, reason: '形似神不似：都涉及 ' + t.hit.join('、') + '，但解法不同' })
      continue
    }
    if (m >= 0.7) {
      out.push({ id: other.id, title: other.title, kind: 'same-method', score: 0.6 + m * 0.35, reason: '同套路：' + (t.hit.length ? t.hit.join('、') + ' · ' : '') + '解法骨架相近' })
      continue
    }
    if (t.hit.length) {
      out.push({ id: other.id, title: other.title, kind: 'same-topic', score: 0.5 + t.score * 0.2, reason: '同考点：' + t.hit.join('、') })
    }
  }

  out.sort((a, b) => b.score - a.score)
  return out.slice(0, opts.limit || 5)
}