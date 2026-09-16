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
 * 格式化路径为 Posix 斜杠形式
 * @param {string} p
 * @param {{ hostSepOnly?: boolean }} [options]
 * @returns {string}
 */
export function formatPosixPath(p, options = {}) {
  if (options?.hostSepOnly) {
    return p.split(path.sep).join('/')
  }
  return p.replace(/\\/g, '/')
}

/**
 * 对输入路径进行类别识别
 * @param {string} input
 * @param {{ platform?: string }} [options]
 * @returns {'empty' | 'url' | 'unc' | 'device' | 'win32-drive-relative' | 'win32-root-relative' | 'win32-drive-absolute' | 'posix-absolute' | 'portable-relative'}
 */
export function categorizePathInput(input, options = {}) {
  if (typeof input !== 'string' || !input.trim()) {
    return 'empty'
  }

  const raw = input.trim()

  // 1. URL 协议（file://, http://, https://, data:, javascript: 等）
  if (/^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/|file:|[a-zA-Z][a-zA-Z0-9+.-]+:)/i.test(raw)) {
    return 'url'
  }

  // 2. Windows 设备 / 扩展长度路径前缀（\\?\, //?\, \\.\, //./, \??\）
  if (/^[/\\]{2}(\?|\.)[/\\]/.test(raw) || /^[/\\]\?\?[/\\]/.test(raw)) {
    return 'device'
  }

  // 3. UNC 路径（\\host\share 或 //host/share）
  if (/^[/\\]{2}/.test(raw)) {
    return 'unc'
  }

  const platform = options.platform ?? process.platform

  // 4. Windows 驱动器路径（C:relative 或 C:\absolute 或 C:/absolute）
  const driveMatch = raw.match(/^([a-zA-Z]):(.*)$/)
  if (driveMatch) {
    const rest = driveMatch[2]
    if (!rest.startsWith('/') && !rest.startsWith('\\')) {
      return 'win32-drive-relative'
    }
    return 'win32-drive-absolute'
  }

  // 5. 跨平台统一拦截根相对路径与异系统路径（防止 Linux 下 \foo 逃逸）
  if (/^[/\\]/.test(raw)) {
    if (platform === 'win32') {
      return 'win32-root-relative'
    }
    if (raw.startsWith('/')) {
      return 'posix-absolute'
    }
    return 'win32-root-relative'
  }

  // 6. 可移植相对路径
  return 'portable-relative'
}

/**
 * 解析声明接受可移植输入的路径
 * @param {string} baseDir
 * @param {string} input
 * @param {{ platform?: string, pathImpl?: any, allowAbsolute?: boolean, checkInsideBase?: boolean }} [options]
 * @returns {string}
 */
export function resolvePortablePath(baseDir, input, options = {}) {
  const platform = options.platform ?? process.platform
  const pathImpl = options.pathImpl ?? path
  const category = categorizePathInput(input, { platform })

  switch (category) {
    case 'empty':
      throw new Error('路径参数不能为空')
    case 'url':
      throw new Error(`不支持 URL 格式路径: ${input}`)
    case 'unc':
      throw new Error(`不支持 UNC 路径: ${input}`)
    case 'device':
      throw new Error(`不支持设备或扩展长度路径: ${input}`)
    case 'win32-drive-relative':
      throw new Error(`不支持 Windows 驱动器相对路径: ${input}`)
    case 'win32-root-relative':
      throw new Error(`不支持隐式当前驱动器的根相对路径: ${input}`)
    case 'win32-drive-absolute':
      if (platform !== 'win32') {
        throw new Error(`不支持跨操作系统绝对路径: ${input}`)
      }
      if (!options.allowAbsolute) {
        throw new Error(`当前上下文不允许使用绝对路径: ${input}`)
      }
      return validateBoundary(baseDir, pathImpl.resolve(input), options)
    case 'posix-absolute':
      if (platform === 'win32') {
        throw new Error(`不支持跨操作系统绝对路径: ${input}`)
      }
      if (!options.allowAbsolute) {
        throw new Error(`当前上下文不允许使用绝对路径: ${input}`)
      }
      return validateBoundary(baseDir, pathImpl.resolve(input), options)
    case 'portable-relative': {
      const normalized = toPosixPath(input.trim()).replace(/^\.\//, '')
      const resolved = pathImpl.resolve(baseDir, normalized)
      return validateBoundary(baseDir, resolved, options)
    }
  }
}

function validateBoundary(baseDir, resolvedAbs, options) {
  if (options.checkInsideBase) {
    const pathImpl = options.pathImpl ?? path
    const rel = pathImpl.relative(baseDir, resolvedAbs)
    const normalizedRel = toPosixPath(rel)
    if (normalizedRel.startsWith('../') || normalizedRel === '..' || pathImpl.isAbsolute(rel)) {
      throw new Error(`路径越界，必须位于基准目录内: ${resolvedAbs}`)
    }
  }
  return resolvedAbs
}

/**
 * 校验 targetPath 是否处于 parentDir 目录范围内
 * @param {string} parentDir
 * @param {string} targetPath
 * @param {{ pathImpl?: any }} [options]
 * @returns {boolean}
 */
export function isInsideDir(parentDir, targetPath, options = {}) {
  const pathImpl = options?.pathImpl ?? path
  const rel = pathImpl.relative(pathImpl.resolve(parentDir), pathImpl.resolve(targetPath))
  const normalizedRel = toPosixPath(rel)
  return normalizedRel === '' || (!normalizedRel.startsWith('../') && normalizedRel !== '..' && !pathImpl.isAbsolute(rel))
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
