export function splitQuestions(text) {
  let src = String(text || '').replace(/\r/g, '')
  if (src.indexOf('\n') < 0) src = src.replace(/([。；;\s])\s*(?=\d{1,2}\s*[.、．])/g, '$1\n')
  src = src.replace(/([。！？])\s*(?=(?:第二题|第二道|下一题)[，,：:]?)/g, '$1\n')
  const lines = src.split('\n')
  const numHead = /^\s*([Il1-9]\d?)\s*[.、．)]\s*(.*)$/
  const cnHead = /^\s*(?:第\s*[一二三四五六七八九十\d]{1,3}\s*(?:题|道)|下一题|例\s*\d{1,2}|习题\s*\d{1,2})/
  const optLine = /^\s*[（(]?\s*[A-DＡ-Ｄ]\s*[）)]/
  const segs = []
  let cur = []
  const curLen = () => cur.join(' ').trim().length
  const push = () => { const s = cur.join('\n').trim(); if (s) segs.push(s); cur = [] }
  for (const line of lines) {
    const isOpt = optLine.test(line)
    const mh = numHead.exec(line)
    const headBody = mh ? mh[2].trim() : ''
    const isNumHead = !!mh && !isOpt && headBody.length >= 6 && !/^[（(]?\s*[A-D]\s*[）)]/.test(headBody)
    const isHead = !isOpt && (isNumHead || cnHead.test(line))
    if (isHead && curLen() > 4) push()
    cur.push(line)
  }
  push()
  const clean = segs.filter((s) => s.replace(/\s/g, '').length >= 2)
  if (!clean.length) return [{ index: 0, text: src.trim() }]
  return clean.map((s, i) => ({ index: i, text: s, title: s.split('\n')[0].slice(0, 30) }))
}
