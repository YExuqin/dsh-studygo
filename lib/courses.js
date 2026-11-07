import { readFile, readdir, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseYaml } from './yaml.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const BUILTIN = join(HERE, '..', 'courses')

/** 读取内置包 + 用户包（vault/.meta/courses），同 id 用户覆盖内置。 */
export async function loadCourses(vault) {
  const map = new Map()
  const read = async (dir) => {
    let files = []
    try { files = await readdir(dir) } catch { return }
    for (const f of files) {
      if (!/\.ya?ml$/.test(f)) continue
      try {
        const txt = await readFile(join(dir, f), 'utf8')
        const pack = parseYaml(txt)
        if (pack && pack.id) map.set(pack.id, pack)
      } catch {}
    }
  }
  await read(BUILTIN)
  await read(join(vault, '.meta', 'courses'))
  return map
}

export function pickCourse(packs, id) {
  return packs.get(id) || packs.get('_default') || { id: '_default', name: '通用', form: 'proof', style: 'guided', methods: [] }
}

export async function ensureCoursesDir(vault) {
  await mkdir(join(vault, '.meta', 'courses'), { recursive: true })
}
