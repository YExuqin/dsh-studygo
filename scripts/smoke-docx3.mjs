import { docxToText } from '../lib/docx.js'
import { readFileSync } from 'node:fs'
const t = docxToText(readFileSync('C:/Users/ASUS/Documents/deepseek-harness/default-workspace/sample.docx'))
console.log('chars', t.length)
console.log(t.slice(0, 200))
