import { resolve, join } from 'node:path'
import { homedir } from 'node:os'
import { mountStudy, mountRoutes } from './host.js'

/** 默认题库根目录（vault）。可在 profile 配置里覆盖。 */
const DEFAULT_VAULT = join(homedir(), '.dsh', 'study-vault')

export const name = 'studygo'
export const inject = ['tools', 'llm']

/**
 * 宿主半边：题库服务（vault 读写 + SQLite 检索 + 生成管线 + agent 工具 + 面板 API）。
 * webServer 是可选依赖：用 ctx.inject 等它就绪再挂路由，缺了也不影响工具。
 */
export async function apply(ctx, config = {}) {
  const vault = resolve(config.vault || process.env.DSH_STUDY_VAULT || DEFAULT_VAULT)
  const provider = config.provider || 'deepseek-account'
  const model = config.model || 'deepseek-flash'
  const state = await mountStudy(ctx, { ...config, vault, provider, model })
  ctx.inject(['webServer'], (inner) => {
    const ws = (typeof inner.get === 'function' ? inner.get('webServer') : inner.webServer) || null
    mountRoutes(inner, { ...state, webServer: ws })
  })
}
