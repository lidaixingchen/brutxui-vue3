import path from 'node:path'
import type { ApiComponent, ApiGroup, ApiLocale } from './api-types'

export interface ApiPageCatalogMember {
    id: string
    name: string
}

export interface ApiPageCatalogGroup {
    id: string
    slug: string
    scope?: 'component-page' | 'functional-page' | 'block'
    functionalApi?: {
        groupId: string
        entry: string
        members: string[]
    }
    members: ApiPageCatalogMember[]
}

export interface ApiPageCatalog {
    groups: ApiPageCatalogGroup[]
}

export interface ApiPagePosition {
    file: string
    line: number
    column: number
}

export interface ApiPageDiagnostic extends ApiPagePosition {
    ruleId: string
    message: string
}

export class ApiPageError extends Error {
    readonly diagnostic: ApiPageDiagnostic

    constructor(diagnostic: ApiPageDiagnostic) {
        super(`${diagnostic.file}:${diagnostic.line}:${diagnostic.column} [${diagnostic.ruleId}] ${diagnostic.message}`)
        this.name = 'ApiPageError'
        this.diagnostic = diagnostic
    }
}

export interface RawComponentApiTag {
    start: number
    end: number
    source: string
    attributes: ParsedAttribute[]
    selfClosing: boolean
}

export interface ParsedAttribute {
    name: string
    value?: string
    hasValue: boolean
    start: number
    end: number
    bound: boolean
}

export interface ApiPageInvocation {
    name: string
    group: ApiPageCatalogGroup
    locale: ApiLocale
    subcomponent?: string
    defaultTab?: 'all' | 'props' | 'events' | 'slots' | 'exposes'
    instance?: string
    search: boolean
    generatedFile: string
    importPath: string
    importName: string
    searchMarker?: string
    position: ApiPagePosition
}

export interface ApiPageInvocationContext {
    sourceFile: string
    docsRoot: string
    generatedDir: string
    relativePath?: string
}

export function scanComponentApiTags(content: string): RawComponentApiTag[] {
    const matches: RawComponentApiTag[] = []
    let position = 0

    while (position < content.length) {
        const start = content.indexOf('<', position)
        if (start < 0) break

        if (content.startsWith('<!--', start)) {
            const commentEnd = content.indexOf('-->', start + 4)
            position = commentEnd < 0 ? content.length : commentEnd + 3
            continue
        }

        const tag = readTag(content, start)
        if (!tag) {
            position = start + 1
            continue
        }

        position = tag.end
        if (tag.name === 'ComponentApi' && !tag.closing) {
            const parsed = parseAttributes(content, start, tag.end, tag.nameEnd)
            matches.push({
                start,
                end: tag.end,
                source: content.slice(start, tag.end),
                attributes: parsed.attributes,
                selfClosing: tag.selfClosing,
            })
            continue
        }

        if (!tag.closing && !tag.selfClosing && ['code', 'pre', 'script', 'style'].includes(tag.name.toLowerCase())) {
            const closing = new RegExp(`<\\/${tag.name}\\s*>`, 'igu')
            closing.lastIndex = position
            const closingMatch = closing.exec(content)
            position = closingMatch ? closing.lastIndex : content.length
        }
    }

    return matches
}

function readTag(content: string, start: number): { name: string; nameEnd: number; end: number; closing: boolean; selfClosing: boolean } | undefined {
    let cursor = start + 1
    let closing = false
    if (content[cursor] === '/') {
        closing = true
        cursor += 1
    }

    const nameStart = cursor
    while (cursor < content.length && /[A-Za-z0-9:_-]/u.test(content[cursor])) cursor += 1
    if (cursor === nameStart) return undefined

    const name = content.slice(nameStart, cursor)
    const nameEnd = cursor
    let quote: string | undefined
    for (; cursor < content.length; cursor += 1) {
        const character = content[cursor]
        if (quote) {
            if (character === quote) quote = undefined
        } else if (character === '"' || character === "'") {
            quote = character
        } else if (character === '>') {
            const selfClosing = /\/\s*>$/u.test(content.slice(start, cursor + 1))
            return { name, nameEnd, end: cursor + 1, closing, selfClosing }
        }
    }

    return undefined
}

function parseAttributes(content: string, _tagStart: number, tagEnd: number, nameEnd: number): { attributes: ParsedAttribute[] } {
    const attributes: ParsedAttribute[] = []
    let cursor = nameEnd
    const end = tagEnd - 1

    while (cursor < end) {
        while (cursor < end && /\s/u.test(content[cursor])) cursor += 1
        if (cursor >= end || content[cursor] === '/') break

        const start = cursor
        while (cursor < end && !/[\s=/>]/u.test(content[cursor])) cursor += 1
        if (cursor === start) {
            cursor += 1
            continue
        }
        const name = content.slice(start, cursor)
        while (cursor < end && /\s/u.test(content[cursor])) cursor += 1

        let hasValue = false
        let value: string | undefined
        if (content[cursor] === '=') {
            hasValue = true
            cursor += 1
            while (cursor < end && /\s/u.test(content[cursor])) cursor += 1
            const quote = content[cursor] === '"' || content[cursor] === "'" ? content[cursor] : undefined
            if (quote) {
                cursor += 1
                const valueStart = cursor
                while (cursor < end && content[cursor] !== quote) cursor += 1
                value = content.slice(valueStart, cursor)
                if (content[cursor] === quote) cursor += 1
            } else {
                const valueStart = cursor
                while (cursor < end && !/[\s>]/u.test(content[cursor])) cursor += 1
                value = content.slice(valueStart, cursor)
            }
        }

        attributes.push({
            name,
            value,
            hasValue,
            start,
            end: cursor,
            bound: name.startsWith(':') || name.startsWith('v-bind:'),
        })
    }

    return { attributes }
}

export function resolveApiPageInvocation(
    tag: RawComponentApiTag,
    catalog: ApiPageCatalog,
    context: ApiPageInvocationContext,
    position: ApiPagePosition,
    importName: string,
): ApiPageInvocation {
    const attributes = collectParameters(tag, position)
    const name = requiredValue(attributes, 'name', position)
    const group = resolveGroup(name, catalog, position)
    if (group.scope === 'block') {
        throw diagnostic(position, 'API_CALL_BLOCK_GROUP', `ComponentApi 不能引用区块组 ${name}`)
    }
    if (group.scope === 'functional-page') {
        throw diagnostic(position, 'API_CALL_FUNCTIONAL_GROUP', `函数式页面 ${name} 不能使用 ComponentApi 展示组件成员`)
    }

    assertValuePresent(attributes, 'subcomponent', position)
    assertValuePresent(attributes, 'defaultTab', position)
    assertValuePresent(attributes, 'instance', position)
    const subcomponent = optionalValue(attributes, 'subcomponent')
    if (subcomponent && !group.members.some(member => normalizeName(member.name) === normalizeName(subcomponent))) {
        throw diagnostic(position, 'API_CALL_SUBCOMPONENT_UNKNOWN', `组件组 ${name} 不包含公开子组件 ${subcomponent}`)
    }

    const defaultTabValue = optionalValue(attributes, 'defaultTab')
    const allowedTabs = ['all', 'props', 'events', 'slots', 'exposes'] as const
    if (defaultTabValue && !allowedTabs.includes(defaultTabValue as typeof allowedTabs[number])) {
        throw diagnostic(position, 'API_CALL_DEFAULT_TAB_INVALID', `defaultTab 必须是 ${allowedTabs.join('、')} 之一`)
    }

    const instance = optionalValue(attributes, 'instance')
    if (instance && !/^[A-Za-z][A-Za-z0-9_-]*$/u.test(instance)) {
        throw diagnostic(position, 'API_CALL_INSTANCE_INVALID', 'instance 只能使用字母、数字、连字符和下划线，并以字母开头')
    }

    const locale: ApiLocale = isEnglishPath(context.relativePath ?? path.relative(context.docsRoot, context.sourceFile)) ? 'en' : 'zh-CN'
    const generatedFile = path.resolve(context.generatedDir, `${group.slug}.${locale}.json`)
    let importPath = path.relative(path.dirname(context.sourceFile), generatedFile).split(path.sep).join('/')
    if (!importPath.startsWith('.')) importPath = `./${importPath}`

    return {
        name,
        group,
        locale,
        subcomponent,
        defaultTab: defaultTabValue as ApiPageInvocation['defaultTab'],
        instance,
        search: booleanParameter(attributes.get('search'), position),
        generatedFile,
        importPath,
        importName,
        position,
    }
}

function collectParameters(tag: RawComponentApiTag, position: ApiPagePosition): Map<string, ParsedAttribute> {
    const result = new Map<string, ParsedAttribute>()
    const recognized = new Set(['name', 'subcomponent', 'defaultTab', 'default-tab', 'instance', 'search', 'data'])

    for (const attribute of tag.attributes) {
        if (attribute.name === 'v-bind' || attribute.name === ':') {
            throw diagnostic(position, 'API_CALL_DYNAMIC_PARAMETER', 'ComponentApi 不支持动态展开属性，请显式声明静态参数')
        }

        const boundName = attribute.name.startsWith(':')
            ? attribute.name.slice(1)
            : attribute.name.startsWith('v-bind:')
                ? attribute.name.slice('v-bind:'.length)
                : undefined
        const name = normalizeParameterName(boundName ?? attribute.name)
        if (!recognized.has(name)) continue
        if (name === 'data') {
            throw diagnostic(position, 'API_CALL_DATA_RESERVED', 'data 由页面编译器根据本页 API 数据生成')
        }
        if (result.has(name)) throw diagnostic(position, 'API_CALL_PARAMETER_DUPLICATE', `参数 ${name} 重复声明`)
        if (boundName && name !== 'search') {
            throw diagnostic(position, 'API_CALL_DYNAMIC_PARAMETER', `参数 ${name} 必须使用静态值`)
        }
        if (boundName && name === 'search' && !['true', 'false'].includes(attribute.value?.trim() ?? '')) {
            throw diagnostic(position, 'API_CALL_DYNAMIC_PARAMETER', 'search 只能使用静态布尔值')
        }
        result.set(name, attribute)
    }

    return result
}

function normalizeParameterName(name: string): string {
    if (name === 'default-tab') return 'defaultTab'
    return name
}

function requiredValue(attributes: Map<string, ParsedAttribute>, name: string, position: ApiPagePosition): string {
    const attribute = attributes.get(name)
    if (!attribute?.hasValue || !attribute.value?.trim()) {
        throw diagnostic(position, 'API_CALL_NAME_REQUIRED', 'ComponentApi 必须提供非空静态 name')
    }
    return attribute.value.trim()
}

function optionalValue(attributes: Map<string, ParsedAttribute>, name: string): string | undefined {
    const attribute = attributes.get(name)
    if (!attribute) return undefined
    return attribute.hasValue ? attribute.value?.trim() : ''
}

function assertValuePresent(attributes: Map<string, ParsedAttribute>, name: string, position: ApiPagePosition): void {
    const attribute = attributes.get(name)
    if (attribute && (!attribute.hasValue || !attribute.value?.trim())) {
        throw diagnostic(position, 'API_CALL_PARAMETER_VALUE_REQUIRED', `参数 ${name} 必须提供非空静态值`)
    }
}

function booleanParameter(attribute: ParsedAttribute | undefined, position: ApiPagePosition): boolean {
    if (!attribute) return true
    if (!attribute.hasValue) return true
    const value = attribute.value?.trim()
    if (value === 'false') return false
    if (value === 'true' || value === '') return true
    throw diagnostic(position, 'API_CALL_SEARCH_INVALID', 'search 只能是 true 或 false')
}

function resolveGroup(name: string, catalog: ApiPageCatalog, position: ApiPagePosition): ApiPageCatalogGroup {
    const target = normalizeName(name)
    const exactMatches = catalog.groups.filter(group => normalizeName(group.slug) === target || normalizeName(group.id) === target)
    const matches = exactMatches.length > 0
        ? exactMatches
        : catalog.groups.filter(group => group.members.some(member => normalizeName(member.name) === target))

    if (matches.length === 0) throw diagnostic(position, 'API_CALL_GROUP_UNKNOWN', `找不到 API 组件组 ${name}`)
    if (matches.length > 1) throw diagnostic(position, 'API_CALL_GROUP_AMBIGUOUS', `名称 ${name} 对应多个 API 组件组，请使用组件组 slug`)
    return matches[0]
}

export function selectApiComponents(
    group: ApiPageCatalogGroup,
    data: ApiGroup,
    subcomponent: string | undefined,
    position: ApiPagePosition,
): ApiComponent[] {
    if (!subcomponent) return data.components
    const catalogMember = group.members.find(member => normalizeName(member.name) === normalizeName(subcomponent))
    if (!catalogMember) throw diagnostic(position, 'API_CALL_SUBCOMPONENT_UNKNOWN', `组件组 ${group.slug} 不包含公开子组件 ${subcomponent}`)
    const component = data.components.find(item => normalizeName(item.name) === normalizeName(catalogMember.name))
    if (!component) throw diagnostic(position, 'API_DATA_MEMBER_MISSING', `生成的 API 数据缺少公开子组件 ${catalogMember.name}`)
    return [component]
}

export function injectApiDataBinding(tag: RawComponentApiTag, importName: string): string {
    let source = tag.source
    const searchAttributes = tag.attributes
        .filter(attribute => normalizeParameterName(attribute.name.replace(/^(:|v-bind:)/u, '')) === 'search')
        .sort((left, right) => right.start - left.start)
    for (const attribute of searchAttributes) {
        let localStart = attribute.start - tag.start
        const localEnd = attribute.end - tag.start
        if (/\s/u.test(source[localStart - 1] ?? '')) localStart -= 1
        source = `${source.slice(0, localStart)}${source.slice(localEnd)}`
    }

    const closing = source.lastIndexOf('>')
    const beforeClose = source.slice(0, closing)
    const insertion = /\/\s*$/u.test(beforeClose) ? beforeClose.lastIndexOf('/') : closing
    return `${source.slice(0, insertion)} :data="${importName}"${source.slice(insertion)}`
}

export function createApiPagePosition(file: string, line: number, column: number): ApiPagePosition {
    return { file, line, column }
}

export function diagnostic(position: ApiPagePosition, ruleId: string, message: string): ApiPageError {
    return new ApiPageError({ ...position, ruleId, message })
}

export function formatApiPagePath(file: string, docsRoot: string): string {
    const relative = path.relative(docsRoot, file).split(path.sep).join('/')
    return relative.startsWith('../') || path.isAbsolute(relative) ? file : `apps/docs/${relative}`
}

export function normalizeName(name: string): string {
    return name.trim().replace(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase()
}

function isEnglishPath(relativePath: string): boolean {
    return relativePath === 'en' || relativePath.startsWith('en/')
}
