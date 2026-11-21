import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

/** 调 PyMuPDF 抽取 PDF：有文本层的页返回文字，扫描页渲染成 PNG。 */
export function extractPdf(file, opts = {}) {
  const py = opts.python || 'python'
  const outdir = opts.outdir
  const script = join(HERE, '..', 'scripts', 'pdf.py')
  return new Promise((resolve) => {
    let out = ''
    let err = ''
    let child
    try {
      child = spawn(py, [script, file, outdir], { windowsHide: true })
    } catch (e) {
      return resolve({ ok: false, error: String(e && e.message || e) })
    }
    child.stdout.on('data', (d) => { out += d.toString('utf8') })
    child.stderr.on('data', (d) => { err += d.toString('utf8') })
    child.on('error', (e) => resolve({ ok: false, error: String(e && e.message || e) }))
    child.on('close', () => {
      try {
        const j = JSON.parse(out.trim())
        if (j.error) return resolve({ ok: false, error: j.error })
        resolve({ ok: true, pages: j.pages || [], total: j.total || 0, truncated: !!j.truncated })
      } catch {
        resolve({ ok: false, error: (err || 'PDF 解析失败').slice(0, 200) })
      }
    })
  })
}
