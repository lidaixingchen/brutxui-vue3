import fs from 'node:fs'
import path from 'node:path'
import { getRepoRoot, toPosixPath } from './path.mjs'

/**
 * 从 pnpm-workspace.yaml 内容中提取 packages glob 清单（纯状态机解析，规避其他 yaml 字段干扰）
 * @param {string} yamlContent
 * @returns {string[]}
 */
export function parseWorkspaceGlobs(yamlContent) {
  const patterns = []
  let inPackagesBlock = false

  for (const rawLine of yamlContent.split('\n')) {
    // 剥离未被引号包裹的行内注释
    let line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    // 简单剥离行尾注释
    const hashIdx = line.indexOf('#')
    if (hashIdx !== -1) {
      const beforeHash = line.slice(0, hashIdx).trim()
      if (beforeHash) line = beforeHash
    }

    if (/^packages:\s*$/.test(line)) {
      inPackagesBlock = true
      continue
    }

    if (inPackagesBlock) {
      if (/^[a-zA-Z0-9_-]+:/.test(line)) {
        inPackagesBlock = false
        continue
      }
      const m = line.match(/^-\s*['"]?([^'"]+)['"]?/)
      if (m) {
        const pattern = m[1].trim()
        // 过滤排除规则
        if (!pattern.startsWith('!')) {
          patterns.push(pattern)
        }
      }
    }
  }
  return patterns
}

/**
 * 动态发现并解析工作区内所有包的元数据
 * @param {string} [root]
 * @returns {Array<{ name: string, dir: string, relDir: string, packageJsonPath: string, manifest: Record<string, any> }>}
 */
export function discoverWorkspacePackages(root = getRepoRoot()) {
  const workspaceYamlPath = path.join(root, 'pnpm-workspace.yaml')
  if (!fs.existsSync(workspaceYamlPath)) return []

  const patterns = parseWorkspaceGlobs(fs.readFileSync(workspaceYamlPath, 'utf-8'))
  const packages = []

  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const baseDir = pattern.replace(/\/\*.*$/, '')
      const absBase = path.join(root, baseDir)
      if (!fs.existsSync(absBase)) continue

      const entries = fs.readdirSync(absBase, { withFileTypes: true })
      for (const ent of entries) {
        if (!ent.isDirectory()) continue
        const pkgDir = path.join(absBase, ent.name)
        const packageJsonPath = path.join(pkgDir, 'package.json')
        if (fs.existsSync(packageJsonPath)) {
          try {
            const json = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
            packages.push({
              name: json.name,
              dir: pkgDir,
              relDir: toPosixPath(path.relative(root, pkgDir)),
              packageJsonPath,
              manifest: json,
            })
          } catch (err) {
            console.error(`[workspace] 无法解析包配置 ${packageJsonPath}:`, err.message)
          }
        }
      }
    } else {
      // 直接声明的具体子目录
      const pkgDir = path.join(root, pattern)
      const packageJsonPath = path.join(pkgDir, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        try {
          const json = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
          packages.push({
            name: json.name,
            dir: pkgDir,
            relDir: toPosixPath(path.relative(root, pkgDir)),
            packageJsonPath,
            manifest: json,
          })
        } catch (err) {
          console.error(`[workspace] 无法解析包配置 ${packageJsonPath}:`, err.message)
        }
      }
    }
  }
  return packages
}
