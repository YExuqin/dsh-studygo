import { readQuestion, listQuestions } from '../lib/store.js'
import { relations } from '../lib/relations.js'
const V = 'E:\\DSH题库插件\\vault'
const lib = '数学-导数'
const items = await listQuestions(V, lib)
console.log('items:', items.map((i) => i.id).join(','))
const a = await readQuestion(V, lib, 'q-20261107-0003')
const b = await readQuestion(V, lib, 'q-20261107-0004')
console.log('a topic', JSON.stringify(a.topic), 'method', JSON.stringify(a.method), a.steps.map(s => s.method))
console.log('b topic', JSON.stringify(b.topic), 'method', JSON.stringify(b.method), b.steps.map(s => s.method))
const pool = [b].map((q) => ({ id: q.id, title: q.title, topic: q.topic, method: q.method || q.steps.map(s => s.method) }))
console.log('rel:', JSON.stringify(relations({ id: a.id, topic: a.topic, method: a.method || a.steps.map(s => s.method) }, pool)))
