import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'

const ROOT = process.cwd()

const PKG_ROOTS = [
    { dir: 'packages/ui/src', pkg: 'brutx-ui-vue' },
    { dir: 'packages/ui/scripts', pkg: 'brutx-ui-vue' },
    { dir: 'packages/cli/src', pkg: 'brutx-vue' },
    { dir: 'packages/registry/scripts', pkg: 'brutx-registry-vue' },
    { dir: 'packages/shared/src', pkg: 'brutx-shared-vue' },
    { dir: 'apps/docs/.vitepress', pkg: 'docs' },
]

// 包名 → package.json 相对路径映射。新增包时只需在此登记路径，
// declared 依赖集合会在运行时从对应 package.json 自动读取（deps + devDeps），
// 避免硬编码白名单与 package.json 双源漂移。
const PKG_JSON = {
    'brutx-ui-vue': 'packages/ui/package.json',
    'brutx-vue': 'packages/cli/package.json',
    'brutx-registry-vue': 'packages/registry/package.json',
    'brutx-shared-vue': 'packages/shared/package.json',
    'docs': 'apps/docs/package.json',
}

function loadDeclared(pkgName) {
    const pkgPath = PKG_JSON[pkgName]
    if (!pkgPath) {
        console.error(`[scan-phantom-deps] 未登记包 \`${pkgName}\` 的 package.json 路径，请在 PKG_JSON 中补充。`)
        return new Set()
    }
    let pkg
    try {
        pkg = JSON.parse(readFileSync(join(ROOT, pkgPath), 'utf8'))
    } catch (err) {
        console.error(`[scan-phantom-deps] 无法读取 ${pkgPath}: ${err.message}`)
        return new Set()
    }
    // 包含 peerDependencies 与 optionalDependencies：UI 库源码导入 peerDep 是合法模式
    //（consumer 提供实现），不应报为 phantom。
    return new Set([
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {}),
        ...Object.keys(pkg.peerDependencies ?? {}),
        ...Object.keys(pkg.optionalDependencies ?? {}),
    ])
}

const DECLARED = Object.fromEntries(
    Object.keys(PKG_JSON).map(pkg => [pkg, loadDeclared(pkg)]),
)

const BUILTINS = new Set([
    'fs', 'path', 'os', 'crypto', 'child_process', 'module', 'url',
    'util', 'stream', 'events', 'http', 'https', 'net', 'tls',
    'zlib', 'querystring', 'string_decoder', 'tty', 'dgram', 'dns',
    'cluster', 'readline', 'repl', 'vm', 'assert', 'process',
])

// Directories to skip — build artifacts / caches that contain generated imports.
const SKIP_DIRS = [
    'node_modules', 'dist', '.vitepress/cache', '.vitepress/.temp',
    '.temp', 'coverage', '.nuxt', '.output',
]

function extractPkgName(spec) {
    if (spec.startsWith('node:')) return null
    if (spec.startsWith('.')) return null
    if (spec.startsWith('@/')) return null  // path alias
    if (spec.startsWith('~')) return null
    if (spec.startsWith('#')) return null
    if (spec.startsWith('virtual:')) return null
    if (spec.startsWith('/')) return null
    if (spec.includes('${')) return null  // template literal substitution — not a real spec
    if (spec.startsWith('@')) {
        const parts = spec.split('/')
        return parts.slice(0, 2).join('/')
    }
    return spec.split('/')[0]
}

/**
 * Tokenize source into a list of segments, each tagged as:
 *   - 'code'    : raw JS/TS code (comments stripped, but code structure intact)
 *   - 'string'  : a real string literal (value preserved without delimiters)
 *
 * This lets us match `from <string>` / `import <string>` only when the string
 * is an actual literal in code, not text inside a template literal body.
 */
function tokenize(src) {
    const segs = []
    let buf = ''
    let i = 0
    const n = src.length
    const flush = () => { if (buf) { segs.push({ t: 'code', v: buf }); buf = '' } }

    while (i < n) {
        const c = src[i]
        const c2 = src[i + 1]

        // line comment
        if (c === '/' && c2 === '/') {
            flush()
            const end = src.indexOf('\n', i)
            i = end === -1 ? n : end
            continue
        }
        // block comment
        if (c === '/' && c2 === '*') {
            flush()
            const end = src.indexOf('*/', i + 2)
            i = end === -1 ? n : end + 2
            continue
        }
        // string literal — capture its body as a 'string' segment
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
            // For template literals, substitutions make the spec non-literal —
            // we still emit the body but extractPkgName() rejects specs containing ${.
            // Note: this loses text in substitutions, but that text would never be
            // a valid static import spec anyway.
            segs.push({ t: 'string', v: body, quote })
            continue
        }
        buf += c
        i++
    }
    flush()
    return segs
}

/**
 * Extract static import specs by scanning the token stream.
 * Recognizes:
 *   import 'spec'
 *   import ... from 'spec'
 *   export ... from 'spec'
 *   import('spec')            (dynamic with literal arg)
 * Dynamic import with template literal is filtered by extractPkgName (rejects `${`).
 */
function extractImports(src) {
    const segs = tokenize(src)
    const specs = []
    for (let i = 0; i < segs.length; i++) {
        const seg = segs[i]
        if (seg.t !== 'code') continue
        // Trailing `from` or `import` (possibly followed by whitespace/paren) → next seg is the spec.
        // Use word-boundary regex on the code segment's tail.
        // Case A: code ends with `from` (export ... from / import ... from)
        const fromMatch = seg.v.match(/\bfrom\s*$/)
        if (fromMatch && segs[i + 1]?.t === 'string') {
            specs.push(segs[i + 1].v)
            continue
        }
        // Case B: code ends with `import` (bare side-effect import)
        const importMatch = seg.v.match(/\bimport\s*$/)
        if (importMatch && segs[i + 1]?.t === 'string') {
            specs.push(segs[i + 1].v)
            continue
        }
        // Case C: code ends with `import(` (dynamic import with literal arg)
        const dynMatch = seg.v.match(/\bimport\s*\(\s*$/)
        if (dynMatch && segs[i + 1]?.t === 'string') {
            specs.push(segs[i + 1].v)
            continue
        }
    }
    return specs
}

function scanDir(dir, pkgName) {
    const phantoms = new Map()
    function walk(d) {
        let entries
        try { entries = readdirSync(d) } catch { return }
        for (const f of entries) {
            const p = join(d, f)
            const rel = relative(ROOT, p).replace(/\\/g, '/')
            if (SKIP_DIRS.some(skip => rel.includes(skip))) continue
            let s
            try { s = statSync(p) } catch { continue }
            if (s.isDirectory()) {
                walk(p)
            } else if (/\.(ts|vue|tsx|mjs|js)$/.test(extname(p))) {
                let content
                try { content = readFileSync(p, 'utf8') } catch { continue }
                for (const spec of extractImports(content)) {
                    const pkg = extractPkgName(spec)
                    if (!pkg) continue
                    if (BUILTINS.has(pkg)) continue
                    const declared = DECLARED[pkgName]
                    if (!declared || !declared.has(pkg)) {
                        if (!phantoms.has(pkg)) phantoms.set(pkg, [])
                        const relPath = relative(ROOT, p).replace(/\\/g, '/')
                        if (!phantoms.get(pkg).includes(relPath)) {
                            phantoms.get(pkg).push(relPath)
                        }
                    }
                }
            }
        }
    }
    walk(dir)
    return phantoms
}

console.log('=== Phantom Dependency Scan ===\n')
let totalPhantoms = 0
for (const { dir, pkg } of PKG_ROOTS) {
    const phantoms = scanDir(join(ROOT, dir), pkg)
    console.log(`[${pkg}] (${dir})`)
    if (phantoms.size === 0) {
        console.log('  none')
    } else {
        for (const [dep, files] of [...phantoms.entries()].sort()) {
            totalPhantoms++
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
