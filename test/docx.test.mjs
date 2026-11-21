import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { docxToText } from '../lib/docx.js'

const here = dirname(fileURLToPath(import.meta.url))

test('docx 抽文本', async () => {
  const buf = await readFile(join(here, 'fixtures', 'sample.docx'))
  const text = docxToText(buf)
  assert.ok(text.includes('第一段'))
  assert.ok(text.includes('第二段'))
  assert.ok(text.split('\n').length >= 2)
})

test('非 docx 返回空串', () => {
  assert.equal(docxToText(Buffer.from('not a zip')), '')
})
