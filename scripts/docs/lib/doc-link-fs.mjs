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

  async stat(filePath) {
    const s = await fsp.stat(filePath)
    return {
      isDirectory: () => s.isDirectory(),
      isFile: () => s.isFile(),
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
    const raw = fs.realpathSync.native(filePath)
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
  constructor(initialFiles = {}) {
    /** 存储规范化小写键到节点对象的映射：Map<lowerPath, { path, content, isDir }> */
    this.nodes = new Map()
    // 根目录初始化
    this.ensureDir('/')

    for (const [p, content] of Object.entries(initialFiles)) {
      this.writeFileSync(p, content)
    }
  }

  normalizeKey(p) {
    const resolved = path.resolve(p).replace(/\\/g, '/')
    return resolved.toLowerCase()
  }

  ensureDir(dirPath) {
    let cur = path.resolve(dirPath).replace(/\\/g, '/')
    while (cur && cur !== path.dirname(cur).replace(/\\/g, '/')) {
      const key = cur.toLowerCase()
      if (!this.nodes.has(key)) {
        this.nodes.set(key, {
          path: cur,
          isDir: true,
        })
      }
      cur = path.dirname(cur).replace(/\\/g, '/')
    }
  }

  writeFileSync(filePath, content) {
    const resolved = path.resolve(filePath).replace(/\\/g, '/')
    this.ensureDir(path.dirname(resolved))
    const key = this.normalizeKey(resolved)
    this.nodes.set(key, {
      path: resolved,
      content: typeof content === 'string' ? content : String(content),
      isDir: false,
    })
  }

  async readFile(filePath) {
    const key = this.normalizeKey(filePath)
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
    const key = this.normalizeKey(filePath)
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
          isFile: () => !node.isDir,
        })
      } else {
        results.push(baseName)
      }
    }
    return results
  }

  async stat(filePath) {
    const key = this.normalizeKey(filePath)
    const node = this.nodes.get(key)
    if (!node) {
      throw new Error(`ENOENT: no such file or directory, stat '${filePath}'`)
    }
    return {
      isDirectory: () => node.isDir,
      isFile: () => !node.isDir,
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
   * 模拟 OS 真实路径返回：返回节点创建时的原始大小写物理路径
   */
  async realpath(filePath) {
    const key = this.normalizeKey(filePath)
    const node = this.nodes.get(key)
    if (!node) {
      throw new Error(`ENOENT: no such file or directory, realpath '${filePath}'`)
    }
    return node.path
  }
}
