import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const FILE = (vault) => join(vault, '.meta', 'links.json')

export async function readLinks(vault) {
  try {
    const t = await readFile(FILE(vault), 'utf8')
    const d = JSON.parse(t)
    return { version: 1, deny: d.deny || [], pins: d.pins || [], votes: d.votes || {} }
  } catch {
    return { version: 1, deny: [], pins: [], votes: {} }
  }
}

export async function writeLinks(vault, data) {
  await mkdir(join(vault, '.meta'), { recursive: true })
  await writeFile(FILE(vault), JSON.stringify({ version: 1, deny: data.deny || [], pins: data.pins || [], votes: data.votes || {} }, null, 2), 'utf8')
}
