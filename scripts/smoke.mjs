import { pathToFileURL } from 'node:url'
const url = pathToFileURL('E:/DSH题库插件/plugin/lib/index.js').href
const mod = await import(url)
const registered = []
const ctx = { tools: { register: (t) => registered.push(t) } }
mod.apply(ctx, {})
const tool = registered[0]
console.log('name:', tool.name)
console.log('params:', JSON.stringify(tool.parameters))
console.log('output:', JSON.stringify(tool.output.schema))
const r1 = await tool.execute({ name: '数学-导数' })
const r2 = await tool.execute({ name: '数学-导数' })
console.log('first :', r1)
console.log('second:', r2)
console.log('render:', JSON.stringify(tool.output.render({}, r1)))
