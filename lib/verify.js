import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

const CANDIDATES = [
  process.env.STUDY_PYTHON,
  'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python312\\python.exe',
  'python',
  'python3',
]

export function pythonPath() {
  for (const p of CANDIDATES) if (p && existsSync(p)) return p
  return 'python'
}

/** 调 sympy 校验一组等式；失败返回 null（不臆造结论）。 */
export function verifyEquations(equations, opts = {}) {
  const list = (equations || []).filter(Boolean).slice(0, 20)
  if (!list.length) return Promise.resolve({ ok: true, items: [] })
  const py = opts.python || pythonPath()
  const script = opts.script
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(py, [script], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    } catch {
      return resolve(null)
    }
    let out = ''
    let err = ''
    const timer = setTimeout(() => { try { child.kill() } catch {} }, opts.timeoutMs || 8000)
    child.stdout.on('data', (d) => { out += d.toString('utf8') })
    child.stderr.on('data', (d) => { err += d.toString('utf8') })
    child.on('error', () => { clearTimeout(timer); resolve(null) })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) return resolve(null)
      try {
        const parsed = JSON.parse(out.slice(out.indexOf('{')))
        resolve(parsed)
      } catch { resolve(null) }
    })
    try { child.stdin.end(JSON.stringify({ equations: list })) } catch { resolve(null) }
  })
}

/** 汇总成徽章状态：ok / warn / none。 */
export function badgeOf(result) {
  if (!result) return { status: 'none', text: '未验算', failed: [] }
  const items = result.items || []
  if (!items.length) return { status: 'none', text: '未验算', failed: [] }
  const failed = items.filter((i) => i.status === 'fail')
  const okAll = items.every((i) => i.status === 'ok')
  if (failed.length) return { status: 'warn', text: '存疑', failed }
  if (okAll) return { status: 'ok', text: '已验算', failed: [] }
  return { status: 'half', text: '部分已验算', failed: [] }
}
