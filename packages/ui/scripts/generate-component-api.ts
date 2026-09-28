import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { ApiComponent, ApiContent, ApiGroup, ApiLocale } from '../../../apps/docs/.vitepress/api-types.js'
import type { ApiContract } from 'brutx-shared-vue/api-contract'
import type { ApiCatalog, CatalogGroup, CatalogMember } from './api-docs/catalog.js'
import { mergeApiContent } from './api-docs/merge.js'
import { createApiExtractor } from './api-docs/extract.js'

const REPOSITORY_ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const UI_PACKAGE_DIRECTORY = 'packages/ui'
const DEFAULT_OUTPUT_DIRECTORY = 'apps/docs/.vitepress/api-generated'
const CATALOG_FILE_NAME = 'catalog.json'
const COMPONENT_CONTENT_DIRECTORY = 'apps/docs/.vitepress/api-content'
const CHECK_FLAG = '--check'
const GROUPS_FLAG = '--groups'
const OUTPUT_DIRECTORY_FLAG = '--output-dir'
const JSON_INDENT = 2
const GENERATED_GROUP_FILE_PATTERN = /^([a-z0-9][a-z0-9-]*)\.(zh-CN|en)\.json$/u

export interface ComponentApiOutput {
    relativePath: string
    content: string
}

export interface ComponentApiOutputOptions {
    groups?: readonly string[]
    outputDir?: string
}

interface CliOptions extends ComponentApiOutputOptions {
    check: boolean
}

function repositoryRelativePath(root: string, filePath: string): string {
    return path.relative(root, filePath).split(path.sep).join('/')
}

function outputDirectory(root: string, requestedDirectory: string | undefined): string {
    return path.resolve(root, requestedDirectory ?? DEFAULT_OUTPUT_DIRECTORY)
}

function serializeApiGroup(group: ApiGroup): string {
    return `${JSON.stringify(group, null, JSON_INDENT)}\n`
}

async function loadCatalog(root: string): Promise<{
    catalog: ApiCatalog
    locales: readonly ApiLocale[]
    serialize: (catalog: ApiCatalog) => string
}> {
    const packageRoot = path.join(root, UI_PACKAGE_DIRECTORY)
    const contractPath = path.join(packageRoot, 'api-contract.ts')
    const catalogPath = path.join(packageRoot, 'scripts/api-docs/catalog.ts')
    const [contractModule, catalogModule] = await Promise.all([
        import(pathToFileURL(contractPath).href) as Promise<{ API_CONTRACT: ApiContract }>,
        import(pathToFileURL(catalogPath).href) as Promise<{
            DOC_LOCALES: readonly ApiLocale[]
            collectApiCatalog: (root: string, contract: ApiContract) => ApiCatalog
            serializeApiCatalog: (catalog: ApiCatalog) => string
        }>,
    ])
    return {
        catalog: catalogModule.collectApiCatalog(root, contractModule.API_CONTRACT),
        locales: catalogModule.DOC_LOCALES,
        serialize: catalogModule.serializeApiCatalog,
    }
}

function resolveSelectedGroups(catalogGroups: readonly CatalogGroup[], requestedGroups: readonly string[] | undefined): CatalogGroup[] {
    const pageGroups = catalogGroups.filter(group => group.scope === 'component-page')
    if (!requestedGroups || requestedGroups.length === 0) return [...pageGroups]

    const selected = new Set<string>()
    for (const requested of requestedGroups) {
        const normalized = requested.trim()
        const group = pageGroups.find(item => item.id === normalized || item.slug === normalized)
        if (!group) throw new Error(`API_GROUP_UNKNOWN ${normalized}`)
        selected.add(group.id)
    }
    return pageGroups.filter(group => selected.has(group.id))
}

async function loadApiContent(root: string, slug: string): Promise<ApiContent | undefined> {
    const source = path.join(root, COMPONENT_CONTENT_DIRECTORY, `${slug}.ts`)
    if (!fs.existsSync(source)) return undefined

    const module = await import(pathToFileURL(source).href) as Record<string, unknown>
    const candidates = Object.values(module).filter((value): value is ApiContent => (
        typeof value === 'object'
        && value !== null
        && 'complete' in value
        && 'members' in value
    ))
    if (candidates.length !== 1) {
        throw new Error(`API_CONTENT_EXPORT_INVALID ${repositoryRelativePath(root, source)}: expected one ApiContent export`)
    }
    return candidates[0]
}

function serializeGroup(group: CatalogGroup, locale: ApiLocale, components: ApiComponent[]): ApiGroup {
    return {
        id: group.id,
        name: group.slug,
        locale,
        components,
    }
}

async function extractGroup(
    extractor: ReturnType<typeof createApiExtractor>,
    group: CatalogGroup,
    content: ApiContent | undefined,
    locale: ApiLocale,
): Promise<ApiGroup> {
    const components = group.members
        .filter((member): member is CatalogMember & { classification: 'component' } => member.classification === 'component')
        .map(member => {
            try {
                return extractor.extract(member)
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error)
                throw new Error(`API_EXTRACT_FAILED ${member.id} (${member.source}): ${message}`, { cause: error })
            }
        })
    const uniqueIds = new Set(components.map(component => component.id))
    if (uniqueIds.size !== components.length) throw new Error(`API_COMPONENT_ID_DUPLICATE ${group.id}`)
    return serializeGroup(group, locale, mergeApiContent(components, content, locale))
}

function assertCatalogHasNoDiagnostics(catalog: ApiCatalog): void {
    if (catalog.diagnostics.length === 0) return
    const details = catalog.diagnostics.map(diagnostic => JSON.stringify(diagnostic)).join('\n')
    throw new Error(`API_CATALOG_DIAGNOSTICS\n${details}`)
}

export async function collectComponentApiOutputs(
    root: string = REPOSITORY_ROOT,
    options: ComponentApiOutputOptions = {},
): Promise<ComponentApiOutput[]> {
    const repositoryRoot = path.resolve(root)
    const catalogData = await loadCatalog(repositoryRoot)
    const { catalog, locales } = catalogData
    assertCatalogHasNoDiagnostics(catalog)

    const selectedGroups = resolveSelectedGroups(catalog.groups, options.groups)
    const directory = outputDirectory(repositoryRoot, options.outputDir)
    const extractor = createApiExtractor(repositoryRoot)

    try {
        const outputs: ComponentApiOutput[] = [{
            relativePath: repositoryRelativePath(repositoryRoot, path.join(directory, CATALOG_FILE_NAME)),
            content: catalogData.serialize(catalog),
        }]
        for (const group of selectedGroups) {
            const content = await loadApiContent(repositoryRoot, group.slug)
            if (group.pages.some(page => page.migration === 'complete') && !content?.complete) {
                throw new Error(`API_MIGRATION_CONTENT_INCOMPLETE ${group.slug}`)
            }
            for (const locale of locales) {
                const apiGroup = await extractGroup(extractor, group, content, locale)
                outputs.push({
                    relativePath: repositoryRelativePath(repositoryRoot, path.join(directory, `${group.slug}.${locale}.json`)),
                    content: serializeApiGroup(apiGroup),
                })
            }
        }
        return outputs.sort((left, right) => left.relativePath.localeCompare(right.relativePath, 'en'))
    } finally {
        extractor.dispose()
    }
}

function parseCliOptions(args: readonly string[]): CliOptions {
    const options: CliOptions = { check: false }
    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index]
        if (argument === CHECK_FLAG) {
            options.check = true
            continue
        }
        if (argument === GROUPS_FLAG || argument.startsWith(`${GROUPS_FLAG}=`)) {
            const value = argument === GROUPS_FLAG ? args[++index] : argument.slice(GROUPS_FLAG.length + 1)
            if (!value) throw new Error(`${GROUPS_FLAG} requires a comma-separated list`)
            options.groups = [...(options.groups ?? []), ...value.split(',').map(group => group.trim()).filter(Boolean)]
            continue
        }
        if (argument === OUTPUT_DIRECTORY_FLAG || argument.startsWith(`${OUTPUT_DIRECTORY_FLAG}=`)) {
            const value = argument === OUTPUT_DIRECTORY_FLAG ? args[++index] : argument.slice(OUTPUT_DIRECTORY_FLAG.length + 1)
            if (!value) throw new Error(`${OUTPUT_DIRECTORY_FLAG} requires a directory`)
            options.outputDir = value
            continue
        }
        throw new Error(`API_GENERATOR_ARGUMENT_UNKNOWN ${argument}`)
    }
    return options
}

function generatedFilesInScope(outputPath: string, selectedSlugs: ReadonlySet<string>, fullScope: boolean): string[] {
    if (!fs.existsSync(outputPath)) return []
    return fs.readdirSync(outputPath)
        .filter(name => name === CATALOG_FILE_NAME || GENERATED_GROUP_FILE_PATTERN.test(name))
        .filter(name => {
            if (name === CATALOG_FILE_NAME) return true
            const match = GENERATED_GROUP_FILE_PATTERN.exec(name)
            return match !== null && (fullScope || selectedSlugs.has(match[1]))
        })
        .map(name => path.join(outputPath, name))
}

function compareOutputs(root: string, directory: string, outputs: readonly ComponentApiOutput[], selectedSlugs: ReadonlySet<string>, fullScope: boolean): string[] {
    const expected = new Set(outputs.map(output => path.resolve(root, output.relativePath)))
    const differences: string[] = []
    for (const output of outputs) {
        const absolute = path.resolve(root, output.relativePath)
        if (!fs.existsSync(absolute)) {
            differences.push(`API_OUTPUT_MISSING ${output.relativePath}`)
        } else if (fs.readFileSync(absolute, 'utf8') !== output.content) {
            differences.push(`API_OUTPUT_STALE ${output.relativePath}`)
        }
    }

    for (const existing of generatedFilesInScope(directory, selectedSlugs, fullScope)) {
        if (!expected.has(existing)) differences.push(`API_OUTPUT_UNEXPECTED ${repositoryRelativePath(root, existing)}`)
    }
    return differences.sort((left, right) => left.localeCompare(right, 'en'))
}

async function main(): Promise<void> {
    const options = parseCliOptions(process.argv.slice(2))
    const outputs = await collectComponentApiOutputs(REPOSITORY_ROOT, options)
    const directory = outputDirectory(REPOSITORY_ROOT, options.outputDir)
    const selectedSlugs = new Set(outputs.flatMap(output => {
        const match = GENERATED_GROUP_FILE_PATTERN.exec(path.basename(output.relativePath))
        return match ? [match[1]] : []
    }))
    const differences = compareOutputs(REPOSITORY_ROOT, directory, outputs, selectedSlugs, options.groups === undefined)

    if (options.check) {
        for (const difference of differences) console.error(difference)
        if (differences.length > 0) process.exitCode = 1
        else console.log(`API 文档数据已同步：${outputs.length} 个生成文件`)
        return
    }

    if (differences.some(difference => difference.startsWith('API_OUTPUT_UNEXPECTED'))) {
        for (const difference of differences) console.error(difference)
        throw new Error('API_OUTPUT_UNEXPECTED: 请逐个清理已废弃的生成文件')
    }
    for (const output of outputs) {
        const absolute = path.resolve(REPOSITORY_ROOT, output.relativePath)
        if (fs.existsSync(absolute) && fs.readFileSync(absolute, 'utf8') === output.content) continue
        fs.mkdirSync(path.dirname(absolute), { recursive: true })
        fs.writeFileSync(absolute, output.content)
    }
    console.log(`API 文档数据已生成：${outputs.length} 个文件`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch(error => {
        const message = error instanceof Error ? error.message : String(error)
        console.error(message)
        process.exitCode = 1
    })
}
