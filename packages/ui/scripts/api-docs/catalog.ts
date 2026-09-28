import fs from 'node:fs'
import path from 'node:path'
import type { ApiContract } from 'brutx-shared-vue/api-contract'
import { COMPONENT_METADATA } from 'brutx-shared-vue'

export const DOC_LOCALES = ['zh-CN', 'en'] as const
export const CATALOG_VERSION = 1
export const CATALOG_PATH = 'apps/docs/.vitepress/api-generated/catalog.json'
const MIGRATION_PATH = 'apps/docs/.vitepress/api-content/migrations.json'
const LOCALE_DIRECTORIES = { 'zh-CN': 'components', en: 'en/components' } as const

/** 文档主成员独立于按名称排列的导出顺序。 */
const PRIMARY_MEMBERS: Readonly<Record<string, string>> = {
    'alert-dialog': 'AlertDialogContent',
    'card-3d': 'Card3D',
    dialog: 'DialogContent',
    'dropdown-menu': 'DropdownMenuContent',
    kanban: 'KanbanBoard',
    message: 'MessageContainer',
    sheet: 'SheetContent',
    tooltip: 'TooltipContent',
}

/** 浏览器测试直接导入的夹具来源，用于核对公开契约中的分类冲突。 */
const TEST_FIXTURE_SOURCES = new Set([
    'packages/ui/src/components/dialog/DialogTestFixture.vue',
    'packages/ui/src/components/dialog/NestedDialogTestFixture.vue',
    'packages/ui/src/components/select/SelectTestFixture.vue',
    'packages/ui/src/components/virtual-scroll/VirtualScrollTestFixture.vue',
])

export interface CatalogDiagnostic {
    ruleId: string
    severity: 'error'
    file: string
    groupId?: string
    member?: string
    message: string
}

export interface CatalogMember {
    id: string
    name: string
    source: string
    sourceName: string
    classification: 'component' | 'test-fixture'
}

export interface CatalogPage {
    locale: typeof DOC_LOCALES[number]
    file: string
    exists: boolean
    presentation: 'component-api' | 'manual' | 'missing'
    migration: 'pending' | 'complete'
    pending: string[]
}

export interface CatalogGroup {
    id: string
    slug: string
    scope: 'component-page' | 'block'
    primaryMemberId: string | null
    members: CatalogMember[]
    supportingExports: Array<{ name: string; source: string; sourceName: string; kind: string }>
    pages: CatalogPage[]
}

export interface ApiCatalog {
    version: number
    groups: CatalogGroup[]
    diagnostics: CatalogDiagnostic[]
}

function sourcePath(group: string, source: string): string {
    return source.startsWith('.')
        ? path.posix.normalize(`packages/ui/src/components/${group}/${source}`)
        : source
}

function pageContent(root: string, file: string): string | undefined {
    const absolute = path.join(root, file)
    return fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : undefined
}

/** 此处仅盘点展示方式；真实调用和成员参数由页面编译器负责校验。 */
function usesComponentApi(content: string): boolean {
    const lines = content.split(/\r?\n/u)
    let fence: { marker: string; length: number } | undefined
    const prose: string[] = []
    for (const line of lines) {
        const match = /^\s*(`{3,}|~{3,})/u.exec(line)
        if (match) {
            const marker = match[1][0]
            const length = match[1].length
            if (!fence) fence = { marker, length }
            else if (fence.marker === marker && length >= fence.length) fence = undefined
            continue
        }
        if (!fence) prose.push(line)
    }
    return /<ComponentApi\b/u.test(prose.join('\n').replace(/<!--[\s\S]*?-->/gu, ''))
}

export function collectApiCatalog(root: string, contract: ApiContract): ApiCatalog {
    const diagnostics: CatalogDiagnostic[] = []
    const groups: CatalogGroup[] = []
    const mappedPages = new Set<string>()
    const migrationFile = path.join(root, MIGRATION_PATH)
    const completedGroups = new Set<string>(fs.existsSync(migrationFile)
        ? (JSON.parse(fs.readFileSync(migrationFile, 'utf8')) as { completedGroups: string[] }).completedGroups
        : [])
    const report = (diagnostic: Omit<CatalogDiagnostic, 'severity'>): void => {
        diagnostics.push({ ...diagnostic, severity: 'error' })
    }

    for (const entry of contract.entries.filter(item => item.kind === 'component')) {
        const groupId = entry.id
        const name = entry.subpath.replace(/^\.\//u, '')
        const metadata = COMPONENT_METADATA[name]
        const scope = metadata?.kind === 'block' ? 'block' : 'component-page'
        const slug = metadata?.docsSlug ?? name
        if (!metadata) report({ ruleId: 'API_METADATA_MISSING', groupId, file: 'packages/ui/api-contract.ts', message: `公开组件 ${name} 缺少组件元信息` })

        const members: CatalogMember[] = []
        const supportingExports: CatalogGroup['supportingExports'] = []
        for (const item of entry.exports) {
            const source = sourcePath(name, item.source)
            if (item.kind !== 'value' || !item.source.endsWith('.vue')) {
                supportingExports.push({ name: item.publicName, source, sourceName: item.sourceName, kind: item.kind })
                continue
            }
            const classification = TEST_FIXTURE_SOURCES.has(source) ? 'test-fixture' : 'component'
            const member = { id: `${groupId}/${item.publicName}`, name: item.publicName, source, sourceName: item.sourceName, classification } satisfies CatalogMember
            members.push(member)
            if (classification === 'test-fixture') report({ ruleId: 'API_PUBLIC_TEST_FIXTURE', groupId, member: item.publicName, file: source, message: `测试夹具 ${item.publicName} 位于公开契约，须核定公开范围` })
            if (item.source.startsWith('.') && !fs.existsSync(path.join(root, source))) report({ ruleId: 'API_SOURCE_MISSING', groupId, member: item.publicName, file: source, message: '公开成员源码不存在' })
        }

        const primaryName = PRIMARY_MEMBERS[name] ?? name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
        const primary = members.find(member => member.name === primaryName)
        if (!primary) report({ ruleId: 'API_PRIMARY_MEMBER_MISSING', groupId, file: 'packages/ui/api-contract.ts', message: `主成员 ${primaryName} 不在公开组件清单中` })
        const ordered = primary ? [primary, ...members.filter(member => member !== primary)] : members
        const pages: CatalogPage[] = []
        if (scope === 'component-page') {
            for (const locale of DOC_LOCALES) {
                const file = `apps/docs/${LOCALE_DIRECTORIES[locale]}/${slug}.md`
                if (mappedPages.has(file)) report({ ruleId: 'API_PAGE_DUPLICATE', groupId, file, message: '页面映射到多个组件组' })
                mappedPages.add(file)
                const content = pageContent(root, file)
                if (content === undefined) report({ ruleId: 'API_PAGE_MISSING', groupId, file, message: '组件缺少对应语言页面' })
                const presentation = content === undefined ? 'missing' : usesComponentApi(content) ? 'component-api' : 'manual'
                const complete = completedGroups.has(slug)
                if (complete && presentation !== 'component-api') report({ ruleId: 'API_MIGRATION_PRESENTATION_MISSING', groupId, file, message: '已完成迁移的页面缺少 ComponentApi 调用' })
                pages.push({ locale, file, exists: content !== undefined, presentation, migration: complete ? 'complete' : 'pending', pending: complete ? [] : ['公开成员覆盖核对', '结构与双语语义核对', '正文与锚点保真核对'] })
            }
        }
        groups.push({ id: groupId, slug, scope, primaryMemberId: primary?.id ?? null, members: ordered, supportingExports, pages })
    }

    for (const directory of Object.values(LOCALE_DIRECTORIES)) {
        const absolute = path.join(root, 'apps/docs', directory)
        if (!fs.existsSync(absolute)) continue
        for (const name of fs.readdirSync(absolute).sort()) {
            if (!name.endsWith('.md') || name === 'index.md') continue
            const file = `apps/docs/${directory}/${name}`
            if (!mappedPages.has(file)) report({ ruleId: 'API_PAGE_UNMAPPED', file, message: '组件页面未归属公开组件组' })
        }
    }
    for (const slug of completedGroups) {
        if (!groups.some(group => group.slug === slug && group.scope === 'component-page')) report({ ruleId: 'API_MIGRATION_GROUP_UNKNOWN', file: MIGRATION_PATH, message: `迁移记录中的组件组 ${slug} 不属于组件页面范围` })
    }
    groups.sort((left, right) => left.id.localeCompare(right.id, 'en'))
    diagnostics.sort((left, right) => `${left.file}:${left.ruleId}:${left.member ?? ''}`.localeCompare(`${right.file}:${right.ruleId}:${right.member ?? ''}`, 'en'))
    return { version: CATALOG_VERSION, groups, diagnostics }
}

export function serializeApiCatalog(catalog: ApiCatalog): string {
    const JSON_INDENT = 2
    return `${JSON.stringify(catalog, null, JSON_INDENT)}\n`
}
