import { parseThreads } from '../lib/store.js'
import { readFile } from 'node:fs/promises'
const md = await readFile('E:/DSH题库插件/vault/数学-导数/q-20261107-0003.md', 'utf8')
const sec = md.split('## 追问')[1] || ''
console.log(JSON.stringify(parseThreads(sec), null, 1).slice(0, 700))
