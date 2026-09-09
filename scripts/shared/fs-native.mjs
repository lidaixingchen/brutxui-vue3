import fs from 'node:fs'
import path from 'node:path'
import { getRepoRoot } from './path.mjs'

/**
 * 标准化物理路径：剥离 Windows \\?\ 与 \\?\UNC\ 扩展前缀，并规范为 Posix 斜杠
 * @param {string} p
 * @returns {string}
 */
export function normalizeRealPath(p) {
  return path.normalize(p)
    .replace(/^\\\\\?\\UNC\\/i, '//')
    .replace(/^\\\\\?\\/, '')
    .replace(/\\/g, '/')
}

/**
 * 跨平台大小写严格存在性核验（抹平 Windows 11 NTFS 假阳性，穿透全路径祖先层级）
 * @param {string} absPath 目标绝对路径
 * @param {string} [repoRoot] 仓库绝对根路径
 * @returns {{ exists: boolean, exactCase: boolean, realPath: string | null }}
 */
export function verifyCaseSync(absPath, repoRoot = getRepoRoot()) {
  if (!fs.existsSync(absPath)) {
    return { exists: false, exactCase: false, realPath: null }
  }

  try {
    const rawReal = fs.realpathSync.native(absPath)
    const normReal = normalizeRealPath(rawReal)
    const normInput = normalizeRealPath(absPath)

    const formatDrive = (p) => p.replace(/^[a-zA-Z]:/, (m) => m.toUpperCase())
    const driveNormInput = formatDrive(normInput)
    const driveNormReal = formatDrive(normReal)

    // 对 repoRoot 同样进行物理路径真实解析，确保两者在同一物理坐标系下进行前缀比对
    let physicalRepoRoot = repoRoot
    try {
      physicalRepoRoot = fs.realpathSync.native(repoRoot)
    } catch {}
    const normRoot = formatDrive(normalizeRealPath(physicalRepoRoot))

    if (driveNormInput.startsWith(normRoot + '/') && driveNormReal.startsWith(normRoot + '/')) {
      const relInput = driveNormInput.slice(normRoot.length + 1)
      const relReal = driveNormReal.slice(normRoot.length + 1)
      return { exists: true, exactCase: relInput === relReal, realPath: normReal }
    }

    const exactCase = driveNormInput === driveNormReal
    return { exists: true, exactCase, realPath: normReal }
  } catch {
    return { exists: false, exactCase: false, realPath: null }
  }
}

/**
 * 便捷判断文件是否存在且路径大小写完全吻合
 * @param {string} absPath
 * @param {string} [repoRoot]
 * @returns {boolean}
 */
export function existsExactCaseSync(absPath, repoRoot = getRepoRoot()) {
  const result = verifyCaseSync(absPath, repoRoot)
  return result.exists && result.exactCase
}
