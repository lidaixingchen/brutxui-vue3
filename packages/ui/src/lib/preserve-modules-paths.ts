const SOURCE_PREFIX = './packages/ui/src/'
const JS_EXTENSIONS = new Set(['.js', '.cjs', '.mjs'])
const VIRTUAL_EXPORT_HELPER_RE = /(['"])[^'"]*?_virtual\/_plugin-vue_export-helper\.(js|cjs|mjs)\1/g

function normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+$/, '')
}

function getDirname(path: string): string {
    const normalized = normalizePath(path)
    const index = normalized.lastIndexOf('/')
    return index === -1 ? '.' : normalized.slice(0, index)
}

function getRelativeToDistRoot(filePath: string, distDir: string): string {
    const fileDir = getDirname(filePath)
    const normalizedDistDir = normalizePath(distDir)
    if (fileDir === normalizedDistDir) return ''
    if (!fileDir.startsWith(`${normalizedDistDir}/`)) return ''

    const nestedPath = fileDir.slice(normalizedDistDir.length + 1)
    const depth = nestedPath.split('/').filter(Boolean).length
    return Array.from({ length: depth }, () => '..').join('/')
}

function getDistRootPrefix(filePath: string, distDir: string): string {
    const relToDistRoot = getRelativeToDistRoot(filePath, distDir)
    return relToDistRoot ? `${relToDistRoot}/` : './'
}

function getVirtualHelperPrefix(filePath: string, distDir: string): string {
    const relToDistRoot = getRelativeToDistRoot(filePath, distDir)
    if (!relToDistRoot) return '.'
    return relToDistRoot
}

export function isJsOutputFile(fileName: string): boolean {
    const ext = fileName.slice(fileName.lastIndexOf('.'))
    return JS_EXTENSIONS.has(ext)
}

export function rewriteFlattenedChunkImports(content: string, filePath: string, distDir: string): string {
    let rewritten = content.replaceAll(SOURCE_PREFIX, './')

    const distRootPrefix = getDistRootPrefix(filePath, distDir)
    rewritten = rewritten.replace(/(["'])(\.\.\/)+(_virtual|node_modules)\//g, `$1${distRootPrefix}$3/`)

    const virtualHelperPrefix = getVirtualHelperPrefix(filePath, distDir)
    return rewritten.replace(VIRTUAL_EXPORT_HELPER_RE, (_match, quote: string, helperExt: string) => {
        return `${quote}${virtualHelperPrefix}/_virtual/_plugin-vue_export-helper.${helperExt}${quote}`
    })
}
