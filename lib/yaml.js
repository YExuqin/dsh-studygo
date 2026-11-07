/** 极简 YAML 子集解析：只支持本插件课程包用到的形态。
 *  - 顶层 key: value
 *  - 嵌套两层（key 下缩进 2 空格的子键）
 *  - 行内数组 [a, b]
 *  - 对象数组：- { id: x, label: y }
 *  - 注释 #
 */
export function parseYaml(text) {
  const root = {}
  let cur = null
  let curIndent = -1
  const lines = String(text).replace(/\r\n/g, '\n').split('\n')
  for (const raw of lines) {
    if (!raw.trim() || /^\s*#/.test(raw)) continue
    const indent = raw.length - raw.trimStart().length
    const line = raw.trim()
    if (line.startsWith('- ')) {
      const item = line.slice(2).trim()
      const parsed = parseItem(item)
      if (!cur || curIndent >= indent) continue
      cur.value.push(parsed)
      continue
    }
    const m = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line)
    if (!m) continue
    const key = m[1]
    const val = m[2].trim()
    if (val === '') {
      cur = { value: [] }
      curIndent = indent
      root[key] = cur.value
      continue
    }
    root[key] = parseScalar(val)
    cur = null
  }
  return root
}

function parseScalar(v) {
  if (v.startsWith('[') && v.endsWith(']')) {
    return v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean).map(stripQuotes)
  }
  if (v === 'true') return true
  if (v === 'false') return false
  if (/^-?\d+$/.test(v)) return Number(v)
  return stripQuotes(v)
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1)
  return s
}

function parseItem(item) {
  if (item.startsWith('{') && item.endsWith('}')) {
    const obj = {}
    for (const part of item.slice(1, -1).split(',')) {
      const mm = /^\s*([\w-]+)\s*:\s*(.*)$/.exec(part)
      if (mm) obj[mm[1]] = parseScalar(mm[2].trim())
    }
    return obj
  }
  return stripQuotes(item)
}
