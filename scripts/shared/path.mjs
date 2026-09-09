import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * 获取 Monorepo 仓库绝对根路径
 * @returns {string}
 */
export function getRepoRoot() {
  return path.resolve(fileURLToPath(new URL('../../', import.meta.url)))
}

/**
 * 将任意路径转换为标准 Posix 斜杠格式（跨平台无差别替换反斜杠）
 * @param {string} p
 * @returns {string}
 */
export function toPosixPath(p) {
  return p.replace(/\\/g, '/')
}

/**
 * 将 file:/// URL 或常规相对/绝对路径解析为操作系统绝对路径
 * 自动剥离 URL 中的 fragment (#) 与 query (?)，防止 fileURLToPath 抛错
 * @param {string} targetPathOrUrl
 * @returns {string}
 */
export function normalizeAbsPath(targetPathOrUrl) {
  if (typeof targetPathOrUrl === 'string' && targetPathOrUrl.startsWith('file:')) {
    const cleanUrl = targetPathOrUrl.split(/[?#]/)[0]
    return path.resolve(fileURLToPath(cleanUrl))
  }
  return path.resolve(targetPathOrUrl)
}
