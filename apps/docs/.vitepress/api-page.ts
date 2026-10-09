import fs from 'node:fs'
import path from 'node:path'
import type { MarkdownEnv, MarkdownRenderer } from 'vitepress'
import type { ApiGroup } from './api-types'
import {
    createApiPagePosition,
    diagnostic,
    formatApiPagePath,
    injectApiDataBinding,
    resolveApiPageInvocation,
    scanComponentApiTags,
    selectApiComponents,
    type ApiPageCatalog,
    type ApiPageInvocation,
    type ApiPagePosition,
} from './api-page-parser'

const SEARCH_RENDERING_KEY = '__brutxApiPageSearchRendering'
const API_CALLS_KEY = '__brutxApiPageCalls'
const MARKDOWN_TOKENS_KEY = '__brutxApiPageMarkdownTokens'
const LEGACY_ANCHOR_MARKER = '<!--__brutx-api-legacy-anchor-point-->'
const LEGACY_ANCHOR_IDS = ['props', 'events', 'slots', 'exposes'] as const

export interface MarkdownToken {
    type: string
    content: string
    map?: [number, number] | null
    children?: MarkdownToken[] | null
}

interface MarkdownState {
    src: string
    tokens: MarkdownToken[]
    env: Record<string, unknown>
}

interface SfcScriptBlock {
    type: string
    content: string
    contentStripped: string
    tagOpen: string
    tagClose: string
}

type MarkdownEnvironment = MarkdownEnv & {
    [SEARCH_RENDERING_KEY]?: boolean
    [API_CALLS_KEY]?: ApiPageInvocation[]
    [MARKDOWN_TOKENS_KEY]?: MarkdownToken[]
}

export interface ApiPagePluginOptions {
    catalogPath: string
    generatedDir: string
    docsRoot: string
}

export interface ApiPageSearchOptions {
    _render: (source: string, env: MarkdownEnv, md: MarkdownRenderer) => string
}

interface CatalogFileVersion {
    size: bigint
    mtimeNs: bigint
    ctimeNs: bigint
    dev: bigint
    ino: bigint
}

interface CachedApiCatalog {
    version: CatalogFileVersion
    catalog: ApiPageCatalog
}

export function createApiPagePlugin(options: ApiPagePluginOptions): (md: MarkdownRenderer) => void {
    const readCatalog: () => ApiPageCatalog = createCatalogReader(options.catalogPath)
    return (md) => {
        const originalRender = md.render.bind(md)
        md.core.ruler.after('inline', 'brutx-api-page', (rawState) => {
            const state = rawState as unknown as MarkdownState
            const env = state.env as unknown as MarkdownEnvironment
            const sourceFile = resolveSourceFile(env, options.docsRoot)
            const catalog = readCatalog()
            const imports = new Map<string, string>()
            const calls: ApiPageInvocation[] = []
            let sourceCursor = 0

            for (const token of state.tokens) {
                if (token.map) sourceCursor = offsetAtLine(state.src, token.map[0])
                if (token.type === 'html_block') {
                    if (!/^\s*<(script|style)\b/iu.test(token.content)) {
                        token.content = rewriteMarkup(token.content, token.map?.[0] ?? 0, sourceFile, env, catalog, imports, calls, options)
                    }
                    if (token.map) sourceCursor = offsetAtLine(state.src, token.map[1])
                    continue
                }
                if (token.type === 'html_inline') {
                    const originalContent = token.content
                    const sourceOffset = state.src.indexOf(originalContent, sourceCursor)
                    const baseLine = sourceOffset >= 0 ? lineIndexAtOffset(state.src, sourceOffset) : token.map?.[0] ?? 0
                    token.content = rewriteMarkup(token.content, baseLine, sourceFile, env, catalog, imports, calls, options)
                    if (sourceOffset >= 0) sourceCursor = sourceOffset + originalContent.length
                    continue
                }
                if (token.type !== 'inline' || !token.children) continue
                const baseLine = token.map?.[0] ?? 0
                for (const child of token.children) {
                    if (child.type === 'html_inline') {
                        const originalContent = child.content
                        const sourceOffset = state.src.indexOf(originalContent, sourceCursor)
                        const childBaseLine = sourceOffset >= 0 ? lineIndexAtOffset(state.src, sourceOffset) : baseLine
                        child.content = rewriteMarkup(child.content, childBaseLine, sourceFile, env, catalog, imports, calls, options)
                        if (sourceOffset >= 0) sourceCursor = sourceOffset + originalContent.length
                    }
                }
                if (token.map) sourceCursor = offsetAtLine(state.src, token.map[1])
            }

            validateRepeatedInvocations(calls)
            env[API_CALLS_KEY] = calls
            env[MARKDOWN_TOKENS_KEY] = state.tokens
        })

        md.render = (source, rawEnvironment) => {
            const env = rawEnvironment as MarkdownEnvironment | undefined
            let rendered = originalRender(source, env)
            const calls = env?.[API_CALLS_KEY] ?? []
            if (!env?.[SEARCH_RENDERING_KEY] && calls.length > 0) {
                rendered = rendered.replace(LEGACY_ANCHOR_MARKER, renderMissingLegacyAnchors(rendered))
            }
            if (!env?.[SEARCH_RENDERING_KEY] && env?.sfcBlocks && calls.length > 0) {
                const dataByFile = new Map<string, ApiGroup>()
                for (const call of calls) {
                    if (!dataByFile.has(call.generatedFile)) {
                        const data = readApiGroup(call)
                        assertUniqueMemberIds(data, call.position)
                        dataByFile.set(call.generatedFile, data)
                    }
                }
                validateApiPageCalls(calls, rendered, dataByFile)
                injectImports(env.sfcBlocks, calls)
            }
            return rendered
        }
    }
}

export function createApiPageSearchOptions(options: ApiPagePluginOptions): ApiPageSearchOptions {
    return {
        _render(source, env, md) {
            const parsed = parseApiPageMarkdown(source, env, md)
            let pageHtml = parsed.html
            const searchEnvironment = parsed.environment
            if (searchEnvironment.frontmatter?.search === false) return ''

            for (const call of parsed.calls) {
                if (call.searchMarker) {
                    pageHtml = pageHtml.replace(call.searchMarker, call.search ? renderSearchProjection(call, options) : '')
                }
            }
            return pageHtml
        },
    }
}

export function parseApiPageMarkdown(
    source: string,
    env: MarkdownEnv,
    md: MarkdownRenderer,
): { html: string; environment: MarkdownEnvironment; calls: ApiPageInvocation[]; tokens: MarkdownToken[] } {
    const environment = { ...env, [SEARCH_RENDERING_KEY]: true } as MarkdownEnvironment
    const html = md.render(source, environment)
    return { html, environment, calls: getApiPageInvocations(environment), tokens: environment[MARKDOWN_TOKENS_KEY] ?? [] }
}

export function getApiPageInvocations(env: MarkdownEnv): ApiPageInvocation[] {
    return (env as MarkdownEnvironment)[API_CALLS_KEY] ?? []
}

export function validateApiPageCalls(
    calls: ApiPageInvocation[],
    rendered: string,
    dataByFile?: Map<string, ApiGroup>,
): void {
    const seen = new Set<string>()
    const existingIds = new Set(extractElementIds(rendered))

    for (const call of calls) {
        const data = dataByFile?.get(call.generatedFile) ?? readApiGroup(call)
        const components = selectApiComponents(call.group, data, call.subcomponent, call.position)
        for (const component of components) {
            for (const member of component.members) {
                const id = call.instance ? `${call.instance}-${member.id}` : member.id
                if (seen.has(id) || existingIds.has(id)) {
                    throw diagnostic(call.position, 'API_PAGE_ANCHOR_DUPLICATE', `API 成员锚点 ${id} 在页面中重复`)
                }
                seen.add(id)
            }
        }
    }
}

export function renderSearchProjection(call: ApiPageInvocation, _options: ApiPagePluginOptions): string {
    const data = readApiGroup(call)
    const components = selectApiComponents(call.group, data, call.subcomponent, call.position)
    const blocks: string[] = []

    for (const component of components) {
        for (const member of component.members) {
            const id = call.instance ? `${call.instance}-${member.id}` : member.id
            const title = `${component.name} ${member.name}`
            const text = [member.name, member.type?.text, member.description].filter(Boolean).join(' ')
            blocks.push(`<h3>${escapeHtml(title)} <a href="#${escapeAttribute(id)}">API</a></h3><p>${escapeHtml(text)}</p>`)
        }
    }

    return blocks.join('\n')
}

function rewriteMarkup(
    content: string,
    baseLine: number,
    sourceFile: string,
    env: MarkdownEnvironment,
    catalog: ApiPageCatalog,
    imports: Map<string, string>,
    calls: ApiPageInvocation[],
    options: ApiPagePluginOptions,
): string {
    const tags = scanComponentApiTags(content)
    if (tags.length === 0) return content
    const sourceLabel = formatApiPagePath(sourceFile, options.docsRoot)
    let result = content
    const tokenCalls: ApiPageInvocation[] = []

    for (const tag of tags) {
        const tagPosition = locationForTag(tag, content, baseLine, sourceLabel)
        const invocation = resolveApiPageInvocation(tag, catalog, {
            sourceFile,
            docsRoot: options.docsRoot,
            generatedDir: options.generatedDir,
            relativePath: env.relativePath,
        }, tagPosition, '')

        let importName = imports.get(invocation.generatedFile)
        if (!importName) {
            importName = `__brutxApiGroup${imports.size}`
            imports.set(invocation.generatedFile, importName)
        }
        invocation.importName = importName
        invocation.searchMarker = `<!--__brutx-api-search-${calls.length + tokenCalls.length}-->`
        tokenCalls.push(invocation)
    }

    for (const [index, tag] of [...tags.entries()].reverse()) {
        const invocation = tokenCalls[index]
        const rewritten = env[SEARCH_RENDERING_KEY]
            ? invocation.searchMarker!
            : `${calls.length === 0 && index === 0 ? LEGACY_ANCHOR_MARKER : ''}${injectApiDataBinding(tag, invocation.importName)}`
        result = `${result.slice(0, tag.start)}${rewritten}${result.slice(tag.end)}`
    }

    calls.push(...tokenCalls)
    return result
}

function locationForTag(
    tag: { start: number },
    content: string,
    baseLine: number,
    file: string,
): ApiPagePosition {
    const preceding = content.slice(0, tag.start)
    const lineOffset = (preceding.match(/\n/gu) ?? []).length
    const lastNewline = preceding.lastIndexOf('\n')
    const column = tag.start - lastNewline
    return createApiPagePosition(file, baseLine + lineOffset + 1, column)
}

function validateRepeatedInvocations(calls: ApiPageInvocation[]): void {
    const seen = new Map<string, ApiPageInvocation[]>()
    for (const call of calls) {
        const groupCalls = seen.get(call.group.id) ?? []
        if (groupCalls.length > 0) {
            if (!call.instance || groupCalls.some(previous => !previous.instance)) {
                throw diagnostic(call.position, 'API_CALL_INSTANCE_REQUIRED', `页面重复引用组件组 ${call.group.slug}，每个调用都需要唯一 instance`)
            }
            if (groupCalls.some(previous => previous.instance === call.instance)) {
                throw diagnostic(call.position, 'API_CALL_INSTANCE_DUPLICATE', `组件组 ${call.group.slug} 的 instance ${call.instance} 重复`)
            }
        }
        groupCalls.push(call)
        seen.set(call.group.id, groupCalls)
    }
}

function injectImports(sfcBlocks: NonNullable<MarkdownEnvironment['sfcBlocks']>, calls: ApiPageInvocation[]): void {
    const existing = sfcBlocks.scriptSetup
    const imports = new Map<string, string>()
    for (const call of calls) imports.set(call.importName, call.importPath)
    const missingImports = [...imports].filter(([name, importPath]) => {
        const declaration = `import ${name} from ${JSON.stringify(importPath)}`
        return !existing?.contentStripped.includes(declaration)
    })
    const source = missingImports.map(([name, importPath]) => `import ${name} from ${JSON.stringify(importPath)}`).join('\n')
    if (!source) return

    if (existing) {
        const updated: SfcScriptBlock = {
            ...existing,
            content: existing.content.replace(existing.tagOpen, `${existing.tagOpen}\n${source}`),
            contentStripped: `${source}\n${existing.contentStripped}`,
        }
        const index = sfcBlocks.scripts.indexOf(existing)
        if (index >= 0) sfcBlocks.scripts[index] = updated
        else sfcBlocks.scripts.push(updated)
        sfcBlocks.scriptSetup = updated
        return
    }

    const tagOpen = '<script setup lang="ts">'
    const block: SfcScriptBlock = {
        type: 'script',
        content: `${tagOpen}\n${source}\n</script>`,
        contentStripped: source,
        tagOpen,
        tagClose: '</script>',
    }
    sfcBlocks.scripts.push(block)
    sfcBlocks.scriptSetup = block
}

function createCatalogReader(file: string): () => ApiPageCatalog {
    let cached: CachedApiCatalog | undefined

    return (): ApiPageCatalog => {
        try {
            const stat: fs.BigIntStats = fs.statSync(file, { bigint: true })
            const version: CatalogFileVersion = {
                size: stat.size,
                mtimeNs: stat.mtimeNs,
                ctimeNs: stat.ctimeNs,
                dev: stat.dev,
                ino: stat.ino,
            }
            if (cached && hasSameCatalogFileVersion(cached.version, version)) return cached.catalog

            const catalog: ApiPageCatalog = JSON.parse(fs.readFileSync(file, 'utf8')) as ApiPageCatalog
            if (!Array.isArray(catalog.groups)) throw new Error('groups must be an array')
            cached = { version, catalog }
            return catalog
        } catch (error: unknown) {
            cached = undefined
            throw new Error(`${file} [API_CATALOG_UNAVAILABLE] ${error instanceof Error ? error.message : String(error)}`, { cause: error })
        }
    }
}

function hasSameCatalogFileVersion(left: CatalogFileVersion, right: CatalogFileVersion): boolean {
    return left.size === right.size
        && left.mtimeNs === right.mtimeNs
        && left.ctimeNs === right.ctimeNs
        && left.dev === right.dev
        && left.ino === right.ino
}

function readApiGroup(call: ApiPageInvocation): ApiGroup {
    let data: ApiGroup
    try {
        data = JSON.parse(fs.readFileSync(call.generatedFile, 'utf8')) as ApiGroup
    } catch (error) {
        throw diagnostic(call.position, 'API_DATA_UNAVAILABLE', `无法读取组件组 ${call.group.slug} 的 ${call.locale} API 数据：${error instanceof Error ? error.message : String(error)}`)
    }

    if (data.id !== call.group.id || data.locale !== call.locale || !Array.isArray(data.components)) {
        throw diagnostic(call.position, 'API_DATA_INVALID', `组件组 ${call.group.slug} 的生成数据与目录或页面语言不一致`)
    }
    selectApiComponents(call.group, data, call.subcomponent, call.position)
    return data
}

function assertUniqueMemberIds(data: ApiGroup, position: ApiPagePosition): void {
    const seen = new Set<string>()
    for (const component of data.components) {
        for (const member of component.members) {
            if (seen.has(member.id)) {
                throw diagnostic(position, 'API_DATA_MEMBER_ID_DUPLICATE', `生成数据中的成员 ID ${member.id} 重复`)
            }
            seen.add(member.id)
        }
    }
}

function resolveSourceFile(env: MarkdownEnvironment, docsRoot: string): string {
    if (env.path) return path.resolve(env.path)
    if (env.relativePath) return path.resolve(docsRoot, env.relativePath)
    return path.resolve(docsRoot, 'unknown.md')
}

function offsetAtLine(source: string, lineIndex: number): number {
    if (lineIndex <= 0) return 0
    let offset = 0
    for (let currentLine = 0; currentLine < lineIndex; currentLine += 1) {
        const newline = source.indexOf('\n', offset)
        if (newline < 0) return source.length
        offset = newline + 1
    }
    return offset
}

function lineIndexAtOffset(source: string, offset: number): number {
    let lineIndex = 0
    for (let cursor = 0; cursor < offset; cursor += 1) {
        if (source[cursor] === '\n') lineIndex += 1
    }
    return lineIndex
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/gu, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

function escapeAttribute(value: string): string {
    return escapeHtml(value)
}

function renderMissingLegacyAnchors(rendered: string): string {
    const existingIds = new Set(extractElementIds(rendered))
    return LEGACY_ANCHOR_IDS
        .filter(id => !existingIds.has(id))
        .map(id => `<span id="${id}" aria-hidden="true"></span>`)
        .join('')
}

function extractElementIds(html: string): string[] {
    const withoutComments = html.replace(/<!--[\s\S]*?-->/gu, '')
    return [...withoutComments.matchAll(/\bid\s*=\s*(["'])(.*?)\1/giu)].map(match => match[2])
}
