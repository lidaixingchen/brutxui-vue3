import MagicString from 'magic-string'
import { parse } from 'acorn'
import { simple } from 'acorn-walk'

const SOURCE_PREFIX = './packages/ui/src/'
const JS_EXTENSIONS = new Set(['.js', '.cjs', '.mjs'])

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

interface LiteralNode {
    type: string
    value: string
    start: number
    end: number
}

function rewriteSpecifier(
    s: MagicString,
    sourceNode: LiteralNode,
    distRootPrefix: string,
    virtualHelperPrefix: string,
): void {
    const value = sourceNode.value
    if (typeof value !== 'string') return

    const helperMatch = value.match(/_virtual\/_plugin-vue_export-helper\.(js|cjs|mjs)$/)
    if (helperMatch) {
        const ext = helperMatch[1]
        const rewritten = `${virtualHelperPrefix}/_virtual/_plugin-vue_export-helper.${ext}`
        s.overwrite(sourceNode.start, sourceNode.end, `"${rewritten}"`)
        return
    }

    if (/^(\.\.\/)+(_virtual|node_modules)\//.test(value)) {
        const rewritten = value.replace(/^(\.\.\/)+/, distRootPrefix)
        s.overwrite(sourceNode.start, sourceNode.end, `"${rewritten}"`)
    }
}

export function rewriteFlattenedChunkImports(content: string, filePath: string, distDir: string): string {
    const s = new MagicString(content)
    s.replaceAll(SOURCE_PREFIX, './')

    const distRootPrefix = getDistRootPrefix(filePath, distDir)
    const virtualHelperPrefix = getVirtualHelperPrefix(filePath, distDir)

    let ast
    try {
        ast = parse(content, { ecmaVersion: 'latest', sourceType: 'module', locations: false })
    } catch {
        return s.toString()
    }

    simple(ast, {
        ImportDeclaration(node) {
            rewriteSpecifier(s, node.source as LiteralNode, distRootPrefix, virtualHelperPrefix)
        },
        ExportNamedDeclaration(node) {
            if (node.source) {
                rewriteSpecifier(s, node.source as LiteralNode, distRootPrefix, virtualHelperPrefix)
            }
        },
        ExportAllDeclaration(node) {
            rewriteSpecifier(s, node.source as LiteralNode, distRootPrefix, virtualHelperPrefix)
        },
        ExportDefaultDeclaration(node) {
            const declaration = node.declaration as { type: string; value?: string; start?: number; end?: number }
            if (declaration && declaration.type === 'Literal' && typeof declaration.value === 'string') {
                rewriteSpecifier(s, declaration as LiteralNode, distRootPrefix, virtualHelperPrefix)
            }
        },
        ImportExpression(node) {
            if (node.source.type === 'Literal') {
                rewriteSpecifier(s, node.source as LiteralNode, distRootPrefix, virtualHelperPrefix)
            }
        },
        CallExpression(node) {
            const callee = node.callee as { type: string; name?: string }
            if (callee.type === 'Identifier' && callee.name === 'require') {
                const arg = node.arguments[0] as { type: string; value?: string; start?: number; end?: number }
                if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
                    rewriteSpecifier(s, arg as LiteralNode, distRootPrefix, virtualHelperPrefix)
                }
            }
        },
    })

    return s.toString()
}
