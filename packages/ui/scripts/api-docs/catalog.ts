import fs from 'node:fs'
import path from 'node:path'
import type { ApiContract } from 'brutx-shared-vue/api-contract'
import { COMPONENT_METADATA } from 'brutx-shared-vue'
// eslint-disable-next-line no-restricted-imports
import {
    checkComponentDocCoverage,
    DOC_LOCALE_DIRECTORIES,
    DOC_LOCALES,
    type ComponentDocPageCoverage,
} from '../../../../scripts/docs/component-doc-coverage.js'

export { DOC_LOCALES }
export const CATALOG_VERSION = 1
export const CATALOG_PATH = 'apps/docs/.vitepress/api-generated/catalog.json'
const MIGRATION_PATH = 'apps/docs/.vitepress/api-content/migrations.json'

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
    /** 预期展示方式；实际 Markdown 调用由页面编译器验证。 */
    presentation: 'component-api' | 'functional-api' | 'manual' | 'missing'
    migration: 'pending' | 'complete'
    pending: string[]
}

export interface CatalogFunctionalApi {
    groupId: string
    entry: string
    members: string[]
}

interface CatalogFunctionalApiConfig {
    entry: string
    members: string[]
}

export interface CatalogGroup {
    id: string
    slug: string
    scope: 'component-page' | 'functional-page' | 'block'
    primaryMemberId: string | null
    functionalApi?: CatalogFunctionalApi
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

export function collectApiCatalog(root: string, contract: ApiContract): ApiCatalog {
    const diagnostics: CatalogDiagnostic[] = []
    const groups: CatalogGroup[] = []
    const mappedPages = new Set<string>()
    const componentEntries = contract.entries.filter(item => item.kind === 'component')
    const pageCoverage = checkComponentDocCoverage(root, componentEntries
        .filter(item => COMPONENT_METADATA[item.subpath.replace(/^\.\//u, '')]?.kind !== 'block')
        .map(item => item.subpath.replace(/^\.\//u, '')))
    const pagesByComponent = new Map<string, Map<typeof DOC_LOCALES[number], ComponentDocPageCoverage>>()
    for (const page of pageCoverage.pages) {
        const componentPages = pagesByComponent.get(page.componentName) ?? new Map<typeof DOC_LOCALES[number], ComponentDocPageCoverage>()
        componentPages.set(page.locale, page)
        pagesByComponent.set(page.componentName, componentPages)
    }
    const migrationFile = path.join(root, MIGRATION_PATH)
    const migration = fs.existsSync(migrationFile)
        ? JSON.parse(fs.readFileSync(migrationFile, 'utf8')) as {
            completedGroups: string[]
            functionalGroups?: Record<string, CatalogFunctionalApiConfig>
        }
        : { completedGroups: [] as string[] }
    const completedGroups = new Set<string>(migration.completedGroups)
    const functionalGroups = new Map(Object.entries(migration.functionalGroups ?? {}))
    const report = (diagnostic: Omit<CatalogDiagnostic, 'severity'>): void => {
        diagnostics.push({ ...diagnostic, severity: 'error' })
    }

    for (const entry of componentEntries) {
        const groupId = entry.id
        const name = entry.subpath.replace(/^\.\//u, '')
        const metadata = COMPONENT_METADATA[name]
        const slug = metadata?.docsSlug ?? name
        const functionalApiConfig = functionalGroups.get(slug)
        const functionalApiGroup = functionalApiConfig
            ? contract.entries.find(item => item.kind === 'composable' && item.exports.some(exported => exported.kind === 'value' && exported.publicName === functionalApiConfig.entry))
            : undefined
        const functionalApi = functionalApiConfig && functionalApiGroup
            ? { ...functionalApiConfig, groupId: functionalApiGroup.id }
            : undefined
        const scope = metadata?.kind === 'block' ? 'block' : functionalApiConfig ? 'functional-page' : 'component-page'
        if (!metadata) report({ ruleId: 'API_METADATA_MISSING', groupId, file: 'packages/ui/api-contract.ts', message: `公开组件 ${name} 缺少组件元信息` })
        if (functionalApiConfig && metadata?.kind === 'block') report({ ruleId: 'API_FUNCTIONAL_GROUP_BLOCK', groupId, file: MIGRATION_PATH, message: `区块 ${slug} 不能声明为函数式组件页面` })
        if (functionalApiConfig && !completedGroups.has(slug)) report({ ruleId: 'API_FUNCTIONAL_GROUP_INCOMPLETE', groupId, file: MIGRATION_PATH, message: `函数式页面 ${slug} 必须登记为已完成迁移` })
        if (functionalApiConfig && !functionalApiGroup) {
            report({ ruleId: 'API_FUNCTIONAL_ENTRY_UNKNOWN', groupId, member: functionalApiConfig.entry, file: MIGRATION_PATH, message: `找不到函数式 API 入口 ${functionalApiConfig.entry} 的公开组合式函数导出` })
        }

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
        if (scope !== 'block') {
            for (const locale of DOC_LOCALES) {
                const file = `apps/docs/${DOC_LOCALE_DIRECTORIES[locale].component}/${slug}.md`
                if (mappedPages.has(file)) report({ ruleId: 'API_PAGE_DUPLICATE', groupId, file, message: '页面映射到多个组件组' })
                mappedPages.add(file)
                const coveredPage = pagesByComponent.get(name)?.get(locale)
                const exists = coveredPage?.exists ?? fs.existsSync(path.join(root, file))
                if (!exists) report({ ruleId: 'API_PAGE_MISSING', groupId, file, message: '组件缺少对应语言页面或文档路径大小写不匹配' })
                const presentation = !exists
                    ? 'missing'
                    : scope === 'functional-page'
                        ? 'functional-api'
                        : completedGroups.has(slug) ? 'component-api' : 'manual'
                const complete = completedGroups.has(slug)
                const expectedPresentation = scope === 'functional-page' ? 'functional-api' : 'component-api'
                if (complete && presentation !== expectedPresentation) {
                    report({ ruleId: 'API_MIGRATION_PRESENTATION_MISSING', groupId, file, message: `已完成迁移的页面必须使用 ${expectedPresentation} 展示` })
                }
                pages.push({ locale, file, exists, presentation, migration: complete ? 'complete' : 'pending', pending: complete ? [] : ['公开成员覆盖核对', '结构与双语语义核对', '正文与锚点保真核对'] })
            }
        }
        groups.push({ id: groupId, slug, scope, primaryMemberId: primary?.id ?? null, ...(functionalApi ? { functionalApi } : {}), members: ordered, supportingExports, pages })
    }

    for (const locale of DOC_LOCALES) {
        const directory = DOC_LOCALE_DIRECTORIES[locale].component
        const absolute = path.join(root, 'apps/docs', directory)
        if (!fs.existsSync(absolute)) continue
        for (const name of fs.readdirSync(absolute).sort()) {
            if (!name.endsWith('.md') || name === 'index.md') continue
            const file = `apps/docs/${directory}/${name}`
            if (!mappedPages.has(file)) report({ ruleId: 'API_PAGE_UNMAPPED', file, message: '组件页面未归属公开组件组' })
        }
    }
    for (const slug of completedGroups) {
        if (!groups.some(group => group.slug === slug && group.scope !== 'block')) report({ ruleId: 'API_MIGRATION_GROUP_UNKNOWN', file: MIGRATION_PATH, message: `迁移记录中的组件组 ${slug} 不属于组件页面范围` })
    }
    for (const slug of functionalGroups.keys()) {
        if (!groups.some(group => group.slug === slug && group.scope === 'functional-page')) report({ ruleId: 'API_FUNCTIONAL_GROUP_UNKNOWN', file: MIGRATION_PATH, message: `函数式页面 ${slug} 不属于公开组件页面范围` })
    }
    groups.sort((left, right) => left.id.localeCompare(right.id, 'en'))
    diagnostics.sort((left, right) => `${left.file}:${left.ruleId}:${left.member ?? ''}`.localeCompare(`${right.file}:${right.ruleId}:${right.member ?? ''}`, 'en'))
    return { version: CATALOG_VERSION, groups, diagnostics }
}

export function serializeApiCatalog(catalog: ApiCatalog): string {
    const JSON_INDENT = 2
    return `${JSON.stringify(catalog, null, JSON_INDENT)}\n`
}
