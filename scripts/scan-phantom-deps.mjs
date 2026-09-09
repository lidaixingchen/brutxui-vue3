#!/usr/bin/env node
/**
 * Monorepo 幽灵依赖扫描守卫（工作区自感知，零硬编码映射）
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { getRepoRoot, toPosixPath } from './shared/path.mjs'
import { discoverWorkspacePackages } from './shared/workspace.mjs'

const ROOT = getRepoRoot()
const isJson = process.argv.includes('--json')
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')

const BUILTINS = new Set([
  'fs', 'path', 'os', 'crypto', 'child_process', 'module', 'url',
  'util', 'stream', 'events', 'http', 'https', 'net', 'tls',
  'zlib', 'querystring', 'string_decoder', 'tty', 'dgram', 'dns',
  'cluster', 'readline', 'repl', 'vm', 'assert', 'process',
])

const SKIP_DIR_NAMES = new Set([
  'node_modules', 'dist', 'cache', '.temp', 'coverage', '.nuxt', '.output',
])

function extractPkgName(spec) {
  if (spec.startsWith('node:')) return null
  if (spec.startsWith('.')) return null
  if (spec.startsWith('@/')) return null
  if (spec.startsWith('~')) return null
  if (spec.startsWith('#')) return null
  if (spec.startsWith('virtual:')) return null
  if (spec.startsWith('/')) return null
  if (spec.includes('${')) return null
  if (spec.startsWith('@')) {
    const parts = spec.split('/')
    return parts.slice(0, 2).join('/')
  }
  return spec.split('/')[0]
}

function tokenize(src) {
  const segs = []
  let buf = ''
  let i = 0
  const n = src.length
  const flush = () => { if (buf) { segs.push({ t: 'code', v: buf }); buf = '' } }

  while (i < n) {
    const c = src[i]
    const c2 = src[i + 1]

    if (c === '/' && c2 === '/') {
      flush()
      const end = src.indexOf('\n', i)
      i = end === -1 ? n : end
      continue
    }
    if (c === '/' && c2 === '*') {
      flush()
      const end = src.indexOf('*/', i + 2)
      i = end === -1 ? n : end + 2
      continue
    }
    if (c === '/' && c2 !== '/' && c2 !== '*') {
      const trimmed = buf.trimEnd()
      const lastChar = trimmed.slice(-1)
      const isRegexContext = !lastChar || /[=([,{:;!&|?~^%*+\-<>]$/.test(lastChar) || /\b(?:return|case|delete|throw|typeof|void|yield)\b$/.test(trimmed)
      if (isRegexContext) {
        flush()
        i++
        while (i < n) {
          if (src[i] === '\\' && i + 1 < n) {
            i += 2
            continue
          }
          if (src[i] === '[') {
            i++
            while (i < n && src[i] !== ']') {
              if (src[i] === '\\' && i + 1 < n) i += 2
              else i++
            }
            if (i < n) i++
            continue
          }
          if (src[i] === '/') {
            i++
            while (i < n && /[a-z]/i.test(src[i])) i++
            break
          }
          i++
        }
        continue
      }
    }
    if (c === '"' || c === "'" || c === '`') {
      flush()
      const quote = c
      let body = ''
      i++
      while (i < n) {
        if (src[i] === '\\' && i + 1 < n) {
          body += src[i + 1]
          i += 2
          continue
        }
        if (src[i] === quote) { i++; break }
        body += src[i]
        i++
      }
      segs.push({ t: 'string', v: body, quote })
      continue
    }
    buf += c
    i++
  }
  flush()
  return segs
}

function extractImports(src) {
  const segs = tokenize(src)
  const specs = []
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]
    if (seg.t !== 'code') continue
    const fromMatch = seg.v.match(/\b(?:import|export)\b[\s\S]*\bfrom\s*$/)
    if (fromMatch && segs[i + 1]?.t === 'string') {
      specs.push(segs[i + 1].v)
      continue
    }
    const importMatch = seg.v.match(/\bimport\s*$/)
    if (importMatch && segs[i + 1]?.t === 'string') {
      specs.push(segs[i + 1].v)
      continue
    }
    const dynMatch = seg.v.match(/\bimport\s*\(\s*$/)
    if (dynMatch && segs[i + 1]?.t === 'string') {
      specs.push(segs[i + 1].v)
      continue
    }
  }
  return specs
}

/**
 * 针对 .vue 文件仅提取 <script> 与 <script setup> 内部代码，规避 <template> 正文文本误报
 * @param {string} content
 * @returns {string}
 */
function extractVueScripts(content) {
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
  const scripts = []
  let m
  while ((m = scriptRegex.exec(content)) !== null) {
    scripts.push(m[1])
  }
  return scripts.join('\n')
}

function scanDir(dir, declaredDeps) {
  const phantoms = new Map()
  function walk(d) {
    let entries
    try { entries = readdirSync(d) } catch { return }
    for (const f of entries) {
      const p = path.join(d, f)
      const rel = toPosixPath(path.relative(ROOT, p))
      const segs = rel.split('/')
      if (segs.some((seg) => SKIP_DIR_NAMES.has(seg))) continue

      let s
      try { s = statSync(p) } catch { continue }
      if (s.isDirectory()) {
        walk(p)
      } else if (/\.(ts|vue|tsx|mjs|js)$/.test(path.extname(p))) {
        let content
        try { content = readFileSync(p, 'utf8') } catch { continue }
        if (p.endsWith('.vue')) {
          content = extractVueScripts(content)
        }
        for (const spec of extractImports(content)) {
          const pkg = extractPkgName(spec)
          if (!pkg) continue
          if (BUILTINS.has(pkg)) continue
          if (!declaredDeps.has(pkg)) {
            if (!phantoms.has(pkg)) phantoms.set(pkg, [])
            if (!phantoms.get(pkg).includes(rel)) {
              phantoms.get(pkg).push(rel)
            }
          }
        }
      }
    }
  }
  walk(dir)
  return phantoms
}

// 动态发现工作区内所有包
const workspacePackages = discoverWorkspacePackages(ROOT)
const scanResults = []
const diagnostics = []

for (const pkgInfo of workspacePackages) {
  const manifest = pkgInfo.manifest
  const declaredDeps = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ])

  const phantoms = scanDir(pkgInfo.dir, declaredDeps)
  scanResults.push({
    name: pkgInfo.name,
    relDir: pkgInfo.relDir,
    phantoms,
  })

  for (const [dep, files] of phantoms.entries()) {
    for (const file of files) {
      diagnostics.push({
        file,
        line: 1,
        ruleId: 'phantom-deps/undeclared-dependency',
        message: `包 ${pkgInfo.name} 引入了未在 package.json 声明的依赖: ${dep}`,
        severity: 'error',
      })
    }
  }
}

let totalPhantoms = 0
for (const { phantoms } of scanResults) {
  totalPhantoms += phantoms.size
}

const isClean = diagnostics.length === 0

if (isJson) {
  const envelope = {
    status: isClean ? 'success' : 'error',
    summary: isClean
      ? `Phantom dependencies: 0 detected (${workspacePackages.length} packages clean)`
      : `Phantom dependencies: ${totalPhantoms} undeclared dependencies detected`,
    diagnostics,
  }
  console.log(JSON.stringify(envelope, null, 2))
  process.exit(isClean ? 0 : 1)
}

if (isClean && !isVerbose) {
  console.log(`✓ Phantom dependencies: 0 detected (${workspacePackages.length} packages clean)`)
  process.exit(0)
}

console.log('=== Phantom Dependency Scan ===\n')
for (const { name, relDir, phantoms } of scanResults) {
  console.log(`[${name}] (${relDir})`)
  if (phantoms.size === 0) {
    console.log('  none')
  } else {
    for (const [dep, files] of [...phantoms.entries()].sort()) {
      console.log(`  PHANTOM: ${dep}`)
      for (const f of files.slice(0, 10)) {
        console.log(`    -> ${f}`)
      }
      if (files.length > 10) console.log(`    ... and ${files.length - 10} more`)
    }
  }
  console.log()
}

console.log(`Total phantom candidates: ${totalPhantoms}`)
if (totalPhantoms > 0) {
  process.exit(1)
}
