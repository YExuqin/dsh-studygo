import { readQuestion } from '../lib/store.js'
const q = await readQuestion('E:\\DSH题库插件\\vault', '数学-导数', 'q-20261107-0003')
console.log('method:', JSON.stringify(q.method))
