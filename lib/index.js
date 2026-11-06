import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

/** 默认题库根目录（vault）。可在 profile 配置里覆盖。 */
const DEFAULT_VAULT = 'E:\\DSH题库插件\\vault'

function today() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

function slug(name) {
  return String(name).trim().replace(/[\\/:*?"<>|]/g, '-')
}

/**
 * 建库：在 vault 下创建 <库名>/index.md。
 * 幂等：同名库已存在时只刷新 updated，不重复创建。
 */
async function createLibrary(vault, name) {
  const dir = join(vault, slug(name))
  const file = join(dir, 'index.md')
  await mkdir(dir, { recursive: true })
  const stamp = today()
  let created = true
  try {
    await readFile(file, 'utf8')
    created = false
  } catch {
    created = true
  }
  const body = [
    '---',
    'title: ' + name,
    'created: ' + stamp,
    'updated: ' + stamp,
    'kind: library',
    '---',
    '',
    '# ' + name,
    '',
    '## 题目',
    '',
    '## 知识卡',
    ''
  ].join('\n')
  await writeFile(file, body, 'utf8')
  return { path: file, created }
}

export const name = 'studygo'
export const inject = ['tools']

/**
 * 宿主半边：注册题库相关 agent 工具。
 * G0 只注册建库工具，验证「工具可调用 + 数据可落盘」。
 */
export function apply(ctx, config = {}) {
  const vault = resolve(config.vault || DEFAULT_VAULT)

  ctx.tools.register({
    name: 'study_create_library',
    description: '在 DSH 题库中创建一个库（按科目/来源归类题目）。同名库已存在时幂等，返回文件路径。',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '库名，例如「数学-导数」' }
      },
      required: ['name'],
      additionalProperties: false
    },
    output: {
      schema: { type: 'string' },
      render(_args, value) {
        return [{ type: 'text', text: String(value) }]
      }
    },
    async execute(args) {
      const r = await createLibrary(vault, args.name)
      return (r.created ? '已创建：' : '已存在（已刷新）：') + r.path
    }
  })
}
