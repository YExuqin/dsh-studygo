import { inflateRawSync } from 'node:zlib'

/** 极简 zip 解析：只取一个条目（word/document.xml）。 */
function readEntry(buf, wanted) {
  const minEocd = 22
  let eocd = -1
  for (let i = buf.length - minEocd; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) return null
  const count = buf.readUInt16LE(eocd + 10)
  let off = buf.readUInt32LE(eocd + 16)
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break
    const method = buf.readUInt16LE(off + 10)
    const compSize = buf.readUInt32LE(off + 20)
    const nameLen = buf.readUInt16LE(off + 28)
    const extraLen = buf.readUInt16LE(off + 30)
    const commentLen = buf.readUInt16LE(off + 32)
    const localOff = buf.readUInt32LE(off + 42)
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen)
    if (name === wanted) {
      const lNameLen = buf.readUInt16LE(localOff + 26)
      const lExtraLen = buf.readUInt16LE(localOff + 28)
      const start = localOff + 30 + lNameLen + lExtraLen
      const data = buf.subarray(start, start + compSize)
      return method === 0 ? data : inflateRawSync(data)
    }
    off += 46 + nameLen + extraLen + commentLen
  }
  return null
}

/** 从 .docx 抽取正文文本（按段落换行）。 */
export function docxToText(buf) {
  const xml = readEntry(buf, 'word/document.xml')
  if (!xml) return ''
  const src = xml.toString('utf8')
    .replace(/<w:tab[^>]*\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
  const text = src
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  return text.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')
}
