/**
 * 文档链接检查引擎 - 文件系统适配层（VFS）
 *
 * 遵循 brutx-shared-vue/fs 的 FileSystemAdapter 契约：
 * 1. DiskFileSystemAdapter: 生产运行使用，集成 node:fs 并利用 fs.realpathSync.native 穿透大小写
 * 2. MemoryFileSystemAdapter: 单元测试与演练沙箱使用，纯内存虚拟文件树，支持微秒级零 I/O 执行
 */

import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

const MAX_SYMLINK_DEPTH = 32

/**
 * 磁盘文件系统适配器
 */
export class DiskFileSystemAdapter {
  async readFile(filePath, encoding = 'utf-8') {
    return fsp.readFile(filePath, encoding)
  }

  async writeFile(filePath, content, encoding = 'utf-8') {
    await fsp.mkdir(path.dirname(filePath), { recursive: true })
    await fsp.writeFile(filePath, content, encoding)
  }

  async pathExists(filePath) {
    try {
      await fsp.access(filePath)
      return true
    } catch {
      return false
    }
  }

  async readdir(dirPath, options = {}) {
    return fsp.readdir(dirPath, options)
  }

  async mkdir(dirPath, options = { recursive: true }) {
    await fsp.mkdir(dirPath, options)
  }

  async stat(filePath) {
    const s = await fsp.stat(filePath)
    return {
      isDirectory: () => s.isDirectory(),
      isFile: () => s.isFile(),
      isSymbolicLink: () => false,
    }
  }

  async lstat(filePath) {
    const s = await fsp.lstat(filePath)
    return {
      isDirectory: () => s.isDirectory(),
      isFile: () => s.isFile(),
      isSymbolicLink: () => s.isSymbolicLink(),
    }
  }

  async rename(oldPath, newPath) {
    await fsp.mkdir(path.dirname(newPath), { recursive: true })
    await fsp.rename(oldPath, newPath)
  }

  async unlink(filePath) {
    await fsp.unlink(filePath)
  }

  /**
   * 原生物理路径解析：穿透所有中间目录与文件名，返回操作系统注册的真实大小写形式（剥离 Win32 扩展前缀）
   */
  async realpath(filePath) {
    const raw = fs.realpathSync.native ? fs.realpathSync.native(filePath) : fs.realpathSync(filePath)
    return path.normalize(raw)
      .replace(/^\\\\\?\\UNC\\/i, '//')
      .replace(/^\\\\\?\\/, '')
      .replace(/\\/g, '/')
  }
}

/**
 * 纯内存虚拟文件系统适配器（供 Vitest 与 Dry-Run 沙箱使用）
 */
export class MemoryFileSystemAdapter {
  constructor(initialFiles = {}, options = {}) {
    /** 存储规范化键到节点对象的映射：Map<normalizedPath, { path, content, isDir }> */
    this.nodes = new Map()
    this.platform = options.platform ?? process.platform
    this.caseSensitive = options.caseSensitive ?? false
    // 根目录初始化
    this.ensureDir('/')

    for (const [p, content] of Object.entries(initialFiles)) {
      this.writeFileSync(p, content)
    }
  }

  normalizeKey(p) {
    const isWin = this.platform === 'win32'
    const pathImpl = isWin ? path.win32 : path.posix
    let resolved = pathImpl.resolve(p)
    if (isWin) {
      resolved = resolved.replace(/\\/g, '/')
    }
    return this.caseSensitive ? resolved : resolved.toLowerCase()
  }

  ensureDir(dirPath) {
    const isWin = this.platform === 'win32'
    const pathImpl = isWin ? path.win32 : path.posix
    let cur = isWin ? path.win32.resolve(dirPath).replace(/\\/g, '/') : path.posix.resolve(dirPath)
    while (cur && cur !== pathImpl.dirname(cur).replace(/\\/g, '/')) {
      const key = this.normalizeKey(cur)
      if (!this.nodes.has(key)) {
        this.nodes.set(key, {
          path: cur,
          isDir: true,
        })
      }
      cur = isWin ? path.win32.dirname(cur).replace(/\\/g, '/') : path.posix.dirname(cur)
    }
  }

  writeFileSync(filePath, content) {
    const isWin = this.platform === 'win32'
    const resolved = isWin ? path.win32.resolve(filePath).replace(/\\/g, '/') : path.posix.resolve(filePath)
    const dir = isWin ? path.win32.dirname(resolved).replace(/\\/g, '/') : path.posix.dirname(resolved)
    this.ensureDir(dir)
    const key = this.normalizeKey(resolved)
    this.nodes.set(key, {
      path: resolved,
      content: typeof content === 'string' ? content : String(content),
      isDir: false,
    })
  }

  async mkdir(dirPath) {
    this.ensureDir(dirPath)
  }

  async symlink(target, linkPath) {
    const isWin = this.platform === 'win32'
    const resolved = isWin ? path.win32.resolve(linkPath).replace(/\\/g, '/') : path.posix.resolve(linkPath)
    const dir = isWin ? path.win32.dirname(resolved).replace(/\\/g, '/') : path.posix.dirname(resolved)
    this.ensureDir(dir)
    const key = this.normalizeKey(resolved)
    this.nodes.set(key, {
      path: resolved,
      target,
      isDir: false,
      isSymlink: true,
    })
  }

  resolveSymlinkTarget(targetPath, depth = 0) {
    if (depth > MAX_SYMLINK_DEPTH) throw new Error(`Too many symbolic links: ${targetPath}`)
    const isWin = this.platform === 'win32'
    const pathImpl = isWin ? path.win32 : path.posix
    const key = this.normalizeKey(targetPath)
    const node = this.nodes.get(key)
    if (node?.isSymlink) {
      const next = pathImpl.isAbsolute(node.target)
        ? (isWin ? path.win32.resolve(node.target).replace(/\\/g, '/') : path.posix.resolve(node.target))
        : (isWin
            ? path.win32.resolve(path.win32.dirname(targetPath), node.target).replace(/\\/g, '/')
            : path.posix.resolve(path.posix.dirname(targetPath), node.target))
      return this.resolveSymlinkTarget(next, depth + 1)
    }
    const parent = isWin ? path.win32.dirname(targetPath).replace(/\\/g, '/') : path.posix.dirname(targetPath)
    if (parent && parent !== targetPath) {
      const resolvedParent = this.resolveSymlinkTarget(parent, depth + 1)
      if (resolvedParent !== parent) {
        const rel = isWin ? path.win32.relative(parent, targetPath).replace(/\\/g, '/') : path.posix.relative(parent, targetPath)
        const reconstructed = isWin ? path.win32.resolve(resolvedParent, rel).replace(/\\/g, '/') : path.posix.resolve(resolvedParent, rel)
        return this.resolveSymlinkTarget(reconstructed, depth + 1)
      }
    }
    return targetPath
  }

  async readFile(filePath) {
    const resolved = this.resolveSymlinkTarget(filePath)
    const key = this.normalizeKey(resolved)
    const node = this.nodes.get(key)
    if (!node || node.isDir) {
      throw new Error(`ENOENT: no such file: ${filePath}`)
    }
    return node.content
  }

  async writeFile(filePath, content) {
    this.writeFileSync(filePath, content)
  }

  async pathExists(filePath) {
    const resolved = this.resolveSymlinkTarget(filePath)
    const key = this.normalizeKey(resolved)
    return this.nodes.has(key)
  }

  async readdir(dirPath, options = {}) {
    const resolved = path.resolve(dirPath).replace(/\\/g, '/')
    const dirKey = this.normalizeKey(resolved)
    const withTypes = Boolean(options?.withFileTypes)
    const results = []

    const prefix = dirKey === '/' ? '/' : `${dirKey}/`
    const prefixLen = prefix.length

    for (const [k, node] of this.nodes.entries()) {
      if (k === dirKey || !k.startsWith(prefix)) continue
      const rest = k.slice(prefixLen)
      // 仅下一级子项
      if (rest.includes('/')) continue

      const baseName = path.basename(node.path)
      if (withTypes) {
        results.push({
          name: baseName,
          isDirectory: () => node.isDir,
          isFile: () => !node.isDir && !node.isSymlink,
          isSymbolicLink: () => Boolean(node.isSymlink),
        })
      } else {
        results.push(baseName)
      }
    }
    return results
  }

  async stat(filePath) {
    const resolved = this.resolveSymlinkTarget(filePath)
    const key = this.normalizeKey(resolved)
    const node = this.nodes.get(key)
    if (!node) {
      throw new Error(`ENOENT: no such file or directory, stat '${filePath}'`)
    }
    return {
      isDirectory: () => node.isDir,
      isFile: () => !node.isDir && !node.isSymlink,
      isSymbolicLink: () => false,
    }
  }

  resolvePathForLstat(p) {
    const isWin = this.platform === 'win32'
    const pathImpl = isWin ? path.win32 : path.posix
    const parent = isWin ? path.win32.dirname(p).replace(/\\/g, '/') : path.posix.dirname(p)
    if (parent && parent !== p) {
      const resolvedParent = this.resolveSymlinkTarget(parent)
      const baseName = isWin ? path.win32.basename(p) : path.posix.basename(p)
      return isWin
        ? path.win32.resolve(resolvedParent, baseName).replace(/\\/g, '/')
        : path.posix.resolve(resolvedParent, baseName)
    }
    return p
  }

  async lstat(filePath) {
    const target = this.resolvePathForLstat(filePath)
    const key = this.normalizeKey(target)
    const node = this.nodes.get(key)
    if (!node) {
      throw new Error(`ENOENT: no such file or directory, lstat '${filePath}'`)
    }
    return {
      isDirectory: () => Boolean(node.isDir),
      isFile: () => !node.isDir && !node.isSymlink,
      isSymbolicLink: () => Boolean(node.isSymlink),
    }
  }

  async unlink(filePath) {
    const key = this.normalizeKey(filePath)
    this.nodes.delete(key)
  }

  async rename(oldPath, newPath) {
    const content = await this.readFile(oldPath)
    await this.writeFile(newPath, content)
    await this.unlink(oldPath)
  }

  /**
   * 模拟 OS 真实路径返回：穿透符号链接，返回节点物理路径
   */
  async realpath(filePath) {
    const resolved = this.resolveSymlinkTarget(filePath)
    const key = this.normalizeKey(resolved)
    const node = this.nodes.get(key)
    if (!node) {
      throw new Error(`ENOENT: no such file or directory, realpath '${filePath}'`)
    }
    return node.path
  }
}
