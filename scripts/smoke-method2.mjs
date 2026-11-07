
import { readQuestion } from '../lib/store.js'
const q = await readQuestion('E:\\DSH题库插件\\vault', '数学-导数', 'q-20261107-0002')
console.log('steps:', q.steps.map((s) => s.n + ':' + s.method).join(' '))
console.log('body S1:', JSON.stringify(q.steps[0].body))
