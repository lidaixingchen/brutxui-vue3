import type { ComponentMetadataEntry, MergedRegistryEntry, RegistryIndex, RegistryIndexItem, RegistryItem } from 'brutx-shared-vue'
import { extractClassifiedModuleSpecifiers } from 'brutx-shared-vue/scan'

export const REGISTRY_MANIFEST_SCHEMA_URL = 'https://lidaixingchen.github.io/brutxui-vue3/registry-manifest.schema.json'

export interface RegistryReferenceItem {
    name: string
    registryDependencies: string[]
}

export interface UnknownRegistryReference {
    component: string
    dependency: string
}

export interface RegistryBuildManifestItem {
    integrity: string
    fileCount: number
    dependencies: string[]
    registryDependencies: string[]
    category?: RegistryIndexItem['category']
    examples?: string[]
    status?: RegistryIndexItem['status']
    replacement?: string
}

export interface RegistryBuildManifestSnapshot {
    $schema: string
    name: string
    schemaVersion: number
    registryVersion: string
    buildTimestamp: string | null
    gitCommit: string | null
    itemCount: number
    items: Record<string, RegistryBuildManifestItem>
}

export interface ComponentSourceFileInventory {
    componentFiles: Set<string>
    composables: Set<string>
    directives: Set<string>
}

export interface DocsComponentPageCoverageOptions {
    locale: string
    componentNames: Iterable<string>
    pageSlugs: Set<string>
    aliases?: Record<string, string>
    exemptions?: Set<string>
}

const REGISTRY_ITEM_IGNORED_IMPORTS = new Set([
    'lib/utils.ts',
])

export function findUnknownRegistryReferences(items: RegistryReferenceItem[]): UnknownRegistryReference[] {
    const knownNames = new Set(items.map(item => item.name))
    const unknown: UnknownRegistryReference[] = []

    for (const item of items) {
        for (const dependency of item.registryDependencies) {
            if (!knownNames.has(dependency)) {
                unknown.push({ component: item.name, dependency })
            }
        }
    }

    return unknown
}

export function findRegistryDependencyCycles(items: RegistryReferenceItem[]): string[][] {
    const graph = new Map(items.map(item => [item.name, item.registryDependencies]))
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const stack: string[] = []
    const cycles: string[][] = []
    const cycleKeys = new Set<string>()

    function visit(name: string): void {
        if (visiting.has(name)) {
            const start = stack.indexOf(name)
            if (start === -1) return

            const cycle = [...stack.slice(start), name]
            const key = cycle.join(' -> ')
            if (!cycleKeys.has(key)) {
                cycles.push(cycle)
                cycleKeys.add(key)
            }
            return
        }

        if (visited.has(name)) {
            return
        }

        visiting.add(name)
        stack.push(name)

        for (const dependency of graph.get(name) ?? []) {
            if (graph.has(dependency)) {
                visit(dependency)
            }
        }

        stack.pop()
        visiting.delete(name)
        visited.add(name)
    }

    for (const name of graph.keys()) {
        visit(name)
    }

    return cycles
}

export function formatRegistryDependencyGraph(items: RegistryReferenceItem[]): string[] {
    return [...items]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => {
            const dependencies = [...item.registryDependencies].sort()
            return dependencies.length > 0
                ? `${item.name} -> ${dependencies.join(', ')}`
                : `${item.name} -> (none)`
        })
}

/**
 * P1-7: Dependency graph node metadata.
 */
export interface DependencyGraphNode {
    name: string
    /** Number of outgoing registry-component edges. */
    outDegree: number
    /** Number of incoming registry-component edges. */
    inDegree: number
}

/**
 * P1-7: Dependency graph edge.
 */
export interface DependencyGraphEdge {
    from: string
    to: string
}

/**
 * P1-7: Serializable dependency graph for tools / docs consumption.
 *
 * Nodes are derived from `items` (every item is a node, even if it has no
 * edges). Edges come from `registryDependencies` (registry-component deps).
 * `locale-zh-cn` and similar non-component entries are filtered out — they
 * are not registry components and would clutter the visualization.
 */
export interface DependencyGraph {
    nodes: DependencyGraphNode[]
    edges: DependencyGraphEdge[]
}

const NON_COMPONENT_DEP_NAMES = new Set<string>([
    'locale-zh-cn',
    'locale-en',
])

export function buildDependencyGraph(items: RegistryReferenceItem[]): DependencyGraph {
    const knownNames = new Set(items.map(item => item.name))
    const edges: DependencyGraphEdge[] = []
    const outDegrees = new Map<string, number>()
    const inDegrees = new Map<string, number>()

    for (const item of items) {
        outDegrees.set(item.name, 0)
        if (!inDegrees.has(item.name)) inDegrees.set(item.name, 0)
    }

    for (const item of items) {
        for (const dep of new Set(item.registryDependencies)) {
            if (NON_COMPONENT_DEP_NAMES.has(dep)) continue
            if (!knownNames.has(dep)) continue
            if (dep === item.name) continue
            edges.push({ from: item.name, to: dep })
            outDegrees.set(item.name, (outDegrees.get(item.name) ?? 0) + 1)
            inDegrees.set(dep, (inDegrees.get(dep) ?? 0) + 1)
        }
    }

    edges.sort((a, b) => {
        if (a.from !== b.from) return a.from.localeCompare(b.from)
        return a.to.localeCompare(b.to)
    })

    const nodes: DependencyGraphNode[] = items
        .map(item => item.name)
        .sort((a, b) => a.localeCompare(b))
        .map(name => ({
            name,
            outDegree: outDegrees.get(name) ?? 0,
            inDegree: inDegrees.get(name) ?? 0,
        }))

    return { nodes, edges }
}

/**
 * P1-7: Render the dependency graph as a Graphviz DOT document.
 *
 * Output is deterministic — nodes are emitted in alphabetical order, edges
 * are emitted in (from, to) alphabetical order. Cycles are preserved (DOT
 * renders them as loops in the visualization).
 */
export function formatDependencyGraphDot(items: RegistryReferenceItem[]): string {
    const graph = buildDependencyGraph(items)
    const lines: string[] = []
    lines.push('digraph registry {')
    lines.push('  rankdir=LR;')
    lines.push('  node [shape=box, fontname="Helvetica"];')
    for (const node of graph.nodes) {
        lines.push(`  "${node.name}";`)
    }
    for (const edge of graph.edges) {
        lines.push(`  "${edge.from}" -> "${edge.to}";`)
    }
    lines.push('}')
    return lines.join('\n')
}

/**
 * P1-7: Serialize the dependency graph to a JSON-compatible object.
 *
 * The returned object is stable (sorted by node name and edge endpoint),
 * making it suitable for committing to the registry alongside the manifest.
 */
export function formatDependencyGraphJson(items: RegistryReferenceItem[]): DependencyGraph {
    return buildDependencyGraph(items)
}

export function validateRegistryManifestConsistency(
    manifest: RegistryBuildManifestSnapshot,
    index: Pick<RegistryIndex, 'name' | 'schemaVersion' | 'registryVersion' | 'items'>
): string[] {
    const errors: string[] = []
    const indexItems = index.items
    const indexByName = new Map(indexItems.map(item => [item.name, item]))
    const manifestItemNames = Object.keys(manifest.items)
    const manifestNames = new Set(manifestItemNames)

    if (manifest.$schema !== REGISTRY_MANIFEST_SCHEMA_URL) {
        errors.push(`$schema "${manifest.$schema}" does not match expected "${REGISTRY_MANIFEST_SCHEMA_URL}"`)
    }

    if (manifest.name !== index.name) {
        errors.push(`name "${manifest.name}" does not match index name "${index.name}"`)
    }

    if (manifest.schemaVersion !== index.schemaVersion) {
        errors.push(`schemaVersion ${manifest.schemaVersion} does not match index schemaVersion ${index.schemaVersion}`)
    }

    if (manifest.registryVersion !== index.registryVersion) {
        errors.push(`registryVersion "${manifest.registryVersion}" does not match index registryVersion "${index.registryVersion}"`)
    }

    if (manifest.itemCount !== indexItems.length) {
        errors.push(`itemCount ${manifest.itemCount} does not match index item count ${indexItems.length}`)
    }

    if (manifest.buildTimestamp !== null && Number.isNaN(Date.parse(manifest.buildTimestamp))) {
        errors.push(`buildTimestamp "${manifest.buildTimestamp}" is not a valid date-time`)
    }

    if (manifest.gitCommit !== null && manifest.gitCommit.length === 0) {
        errors.push('gitCommit must be null or a non-empty string')
    }

    if (manifestItemNames.join('\0') !== [...manifestItemNames].sort((a, b) => a.localeCompare(b)).join('\0')) {
        errors.push('manifest items must be sorted by name')
    }

    for (const item of indexItems) {
        const manifestItem = manifest.items[item.name]
        if (!manifestItem) {
            errors.push(`missing item "${item.name}"`)
            continue
        }

        if (manifestItem.integrity !== item.integrity) {
            errors.push(`item "${item.name}" integrity mismatch`)
        }

        if (manifestItem.fileCount !== item.files.length) {
            errors.push(`item "${item.name}" fileCount ${manifestItem.fileCount} does not match index file count ${item.files.length}`)
        }

        compareStringArrays(errors, item.name, 'dependencies', manifestItem.dependencies, item.dependencies)
        compareStringArrays(errors, item.name, 'registryDependencies', manifestItem.registryDependencies, item.registryDependencies)
        compareStringArrays(errors, item.name, 'examples', manifestItem.examples ?? [], item.examples ?? [])

        if (manifestItem.category !== item.category) {
            errors.push(`item "${item.name}" category mismatch`)
        }

        if (manifestItem.status !== item.status) {
            errors.push(`item "${item.name}" status mismatch`)
        }

        if (manifestItem.replacement !== item.replacement) {
            errors.push(`item "${item.name}" replacement mismatch`)
        }
    }

    for (const name of manifestNames) {
        if (!indexByName.has(name)) {
            errors.push(`extra item "${name}"`)
        }
    }

    return errors
}

export function validateComponentSourceFiles(
    name: string,
    entry: MergedRegistryEntry,
    inventory: ComponentSourceFileInventory
): string[] {
    const errors: string[] = []

    if (entry.name !== name) {
        errors.push(`[${name}] registry metadata entry name "${entry.name}" does not match its key`)
    }

    if (entry.files.length === 0) {
        errors.push(`[${name}] registry metadata entry must list at least one component file`)
    }

    validateDeclaredFiles(errors, name, 'component file', entry.files, inventory.componentFiles)
    validateDeclaredFiles(errors, name, 'composable', entry.composables ?? [], inventory.composables)
    validateDeclaredFiles(errors, name, 'directive', entry.directives ?? [], inventory.directives)

    return errors
}

export function validateDocsComponentPageCoverage(options: DocsComponentPageCoverageOptions): string[] {
    const errors: string[] = []
    const aliases = options.aliases ?? {}
    const exemptions = options.exemptions ?? new Set<string>()
    const expectedSlugs = new Map<string, string>()

    for (const name of options.componentNames) {
        if (exemptions.has(name)) {
            continue
        }
        expectedSlugs.set(aliases[name] ?? name, name)
    }

    for (const [slug, name] of expectedSlugs) {
        if (!options.pageSlugs.has(slug)) {
            errors.push(`[docs:${options.locale}] Missing docs page for "${name}" at "${slug}.md"`)
        }
    }

    for (const slug of options.pageSlugs) {
        if (!expectedSlugs.has(slug)) {
            errors.push(`[docs:${options.locale}] Docs page "${slug}.md" does not map to registry metadata`)
        }
    }

    return errors
}

export function validateGeneratedItemMatchesMetadata(
    item: Pick<RegistryItem, 'name' | 'title' | 'description' | 'dependencies' | 'category' | 'examples' | 'status' | 'replacement' | 'files'>,
    entry: MergedRegistryEntry
): string[] {
    const errors: string[] = []

    if (item.title !== entry.title) {
        errors.push('title does not match registry metadata')
    }

    if (item.description !== entry.description) {
        errors.push('description does not match registry metadata')
    }

    compareStringArrays(errors, item.name, 'dependencies', item.dependencies, entry.dependencies)
    compareStringArrays(errors, item.name, 'examples', item.examples ?? [], entry.examples ?? [])

    if (item.category !== entry.category) {
        errors.push('category does not match registry metadata')
    }

    if (item.status !== entry.status) {
        errors.push('status does not match registry metadata')
    }

    if (item.replacement !== entry.replacement) {
        errors.push('replacement does not match registry metadata')
    }

    const generatedFiles = new Set(item.files.map(file => file.path))
    const declaredFiles = [
        ...entry.files.map(file => `components/ui/${entry.name}/${file}`),
        ...(entry.composables ?? []).map(file => `composables/${file}`),
        ...(entry.directives ?? []).map(file => `directives/${file}`),
    ]

    for (const file of declaredFiles) {
        if (!generatedFiles.has(file)) {
            errors.push(`declared file "${file}" is missing from generated registry item`)
        }
    }

    return errors
}

interface SidebarItemLike {
    text: string
    link?: string
    items?: SidebarItemLike[]
}

export interface SidebarCoverageOptions {
    locale: 'zh' | 'en'
    section: 'components' | 'blocks'
    sidebarItems: SidebarItemLike[]
    entries: ComponentMetadataEntry[]
}

export function validateSidebarCoverage(options: SidebarCoverageOptions): string[] {
    const errors: string[] = []
    const { locale, section, sidebarItems, entries } = options

    const localePrefix = locale === 'en' ? '/en' : ''
    const linkPrefix = `${localePrefix}/${section}/`

    const sidebarSlugs = new Set<string>()
    for (const group of sidebarItems) {
        if (!group.items) continue
        for (const item of group.items) {
            if (!item.link) continue
            const slug = extractSidebarSlug(item.link, linkPrefix)
            if (slug !== null) sidebarSlugs.add(slug)
        }
    }

    const expectedSlugs = new Map<string, string>()
    for (const entry of entries) {
        if (entry.docsHidden === true) continue
        const expectedSection = entry.kind === 'block' ? 'blocks' : 'components'
        if (expectedSection !== section) continue
        const slug = entry.docsSlug ?? entry.name
        expectedSlugs.set(slug, entry.name)
    }

    for (const [slug, name] of expectedSlugs) {
        if (!sidebarSlugs.has(slug)) {
            errors.push(`[sidebar:${locale}:${section}] Entry "${name}" (slug "${slug}") is missing from generated sidebar`)
        }
    }

    for (const slug of sidebarSlugs) {
        if (!expectedSlugs.has(slug)) {
            errors.push(`[sidebar:${locale}:${section}] Sidebar entry "${slug}" does not map to any registry metadata entry`)
        }
    }

    return errors
}

function extractSidebarSlug(link: string, linkPrefix: string): string | null {
    if (!link.startsWith(linkPrefix)) return null
    return link.slice(linkPrefix.length).replace(/\.html$/, '')
}

export function validateRegistryItemInternalImports(
    item: Pick<RegistryItem, 'name' | 'files' | 'registryDependencies'>
): string[] {
    const errors: string[] = []
    const files = new Set(item.files.map(file => file.path))
    const registryDependencies = new Set(item.registryDependencies)

    for (const file of item.files) {
        for (const classified of extractClassifiedModuleSpecifiers(file.content)) {
            // Type-only imports don't add runtime file or component deps, but
            // their specifiers must still resolve to known paths (we don't
            // validate type-only resolution here — file-presence check below
            // applies to runtime imports only).
            if (classified.isTypeOnly) {
                continue
            }

            const expectedPath = resolveRegistryAliasImport(item.name, classified.specifier)

            if (!expectedPath || REGISTRY_ITEM_IGNORED_IMPORTS.has(expectedPath)) {
                continue
            }

            if (!files.has(expectedPath)) {
                if (expectedPath.startsWith('locales/') && registryDependencies.has('locale-zh-cn')) {
                    continue
                }

                errors.push(`file "${file.path}" imports "${classified.specifier}", but generated registry item is missing "${expectedPath}"`)
            }
        }

        for (const depName of extractCrossComponentImports(item.name, file.content)) {
            if (!registryDependencies.has(depName)) {
                errors.push(`file "${file.path}" imports "@/components/ui/${depName}/...", but "${depName}" is not declared in registryDependencies`)
            }
        }
    }

    return errors
}

/**
 * P1-7: Classify a module specifier into one of four registry-relevant categories.
 *
 * - `registry-component`: cross-component import (`@/components/ui/{other}/...`)
 * - `registry-shared`: composables / lib / directives / locales / internal files
 * - `npm`: bare specifier (`vue`, `reka-ui`, `@vueuse/core`, ...)
 * - `style-asset`: CSS / SCSS / Less imports
 * - `other`: anything that doesn't match the patterns above (rare)
 */
export type RegistryImportKind = 'registry-component' | 'registry-shared' | 'npm' | 'style-asset' | 'other'

export interface ClassifiedRegistryImport {
    specifier: string
    kind: RegistryImportKind
    /** Component name when kind === 'registry-component'; undefined otherwise. */
    componentName?: string
    isTypeOnly: boolean
    isDynamic: boolean
}

export function classifyRegistryImport(
    specifier: string,
    ownerComponentName: string,
    isTypeOnly: boolean,
    isDynamic: boolean,
): ClassifiedRegistryImport {
    if (isStyleAssetSpecifier(specifier)) {
        return { specifier, kind: 'style-asset', isTypeOnly, isDynamic }
    }

    const aliasComponentPrefix = '@/components/ui/'
    if (specifier.startsWith(aliasComponentPrefix)) {
        const rest = specifier.slice(aliasComponentPrefix.length)
        const depName = rest.split('/')[0]
        if (depName === ownerComponentName) {
            // Internal file of the owner component — shared asset, not a dep.
            return { specifier, kind: 'registry-shared', isTypeOnly, isDynamic }
        }
        return { specifier, kind: 'registry-component', componentName: depName, isTypeOnly, isDynamic }
    }

    if (
        specifier.startsWith('@/composables/') ||
        specifier.startsWith('@/lib/') ||
        specifier.startsWith('@/directives/') ||
        specifier.startsWith('@/locales/')
    ) {
        return { specifier, kind: 'registry-shared', isTypeOnly, isDynamic }
    }

    // Relative specifiers in source (before rewrite). These only appear in
    // source-tree scans, not in generated registry JSON, but we handle them
    // for completeness so the classifier is reusable.
    if (specifier.startsWith('./')) {
        return { specifier, kind: 'registry-shared', isTypeOnly, isDynamic }
    }
    if (
        specifier.startsWith('../composables/') ||
        specifier.startsWith('../lib/') ||
        specifier.startsWith('../directives/') ||
        specifier.startsWith('../locales/')
    ) {
        return { specifier, kind: 'registry-shared', isTypeOnly, isDynamic }
    }
    const crossCompRelative = specifier.match(/^\.\.\/([a-zA-Z0-9-]+)\//)
    if (crossCompRelative && crossCompRelative[1] !== ownerComponentName) {
        return {
            specifier,
            kind: 'registry-component',
            componentName: crossCompRelative[1],
            isTypeOnly,
            isDynamic,
        }
    }

    if (specifier.startsWith('@/') || specifier.startsWith('~/')) {
        // Unrecognized alias — treat as shared to surface in audits.
        return { specifier, kind: 'registry-shared', isTypeOnly, isDynamic }
    }

    if (specifier.startsWith('.') || specifier.startsWith('/')) {
        return { specifier, kind: 'registry-shared', isTypeOnly, isDynamic }
    }

    return { specifier, kind: 'npm', isTypeOnly, isDynamic }
}

function isStyleAssetSpecifier(specifier: string): boolean {
    return /\.(?:css|scss|sass|less|styl|pcss|postcss)$/.test(specifier)
}

// Replaced by AST-based extractClassifiedModuleSpecifiers. The previous regex
// matched import/export statements but could not distinguish `import type { ... }`
// from value imports, causing type-only cross-component imports to be flagged
// as missing registryDependencies (see P1-7).

function extractCrossComponentImports(itemName: string, code: string): string[] {
    const deps = new Set<string>()

    for (const classified of extractClassifiedModuleSpecifiers(code)) {
        // P1-7: type-only imports don't create runtime registry dependencies.
        if (classified.isTypeOnly) continue

        const cleanSpecifier = classified.specifier.split(/[?#]/)[0]
        const match = /^@\/components\/ui\/([a-zA-Z0-9-]+)(?:\/|$)/.exec(cleanSpecifier)
        if (!match) continue
        const depName = match[1]
        if (depName !== itemName) {
            deps.add(depName)
        }
    }

    return Array.from(deps)
}

function resolveRegistryAliasImport(itemName: string, specifier: string): string | null {
    const cleanSpecifier = specifier.split(/[?#]/)[0]

    if (cleanSpecifier.startsWith('@/lib/')) {
        return normalizeRegistryImportPath('lib/', cleanSpecifier.slice('@/lib/'.length))
    }

    if (cleanSpecifier.startsWith('@/composables/')) {
        return normalizeRegistryImportPath('composables/', cleanSpecifier.slice('@/composables/'.length))
    }

    if (cleanSpecifier.startsWith('@/directives/')) {
        return normalizeRegistryImportPath('directives/', cleanSpecifier.slice('@/directives/'.length))
    }

    if (cleanSpecifier.startsWith('@/locales/')) {
        return normalizeRegistryImportPath('locales/', cleanSpecifier.slice('@/locales/'.length))
    }

    const componentPrefix = `@/components/ui/${itemName}/`
    if (cleanSpecifier.startsWith(componentPrefix)) {
        return normalizeRegistryImportPath(`components/ui/${itemName}/`, cleanSpecifier.slice(componentPrefix.length))
    }

    return null
}

function normalizeRegistryImportPath(prefix: string, relativePath: string): string {
    return prefix + (hasFileExtension(relativePath) ? relativePath : `${relativePath}.ts`)
}

function hasFileExtension(filePath: string): boolean {
    const fileName = filePath.split('/').pop() ?? ''
    return /\.[a-zA-Z0-9]+$/.test(fileName)
}

function validateDeclaredFiles(
    errors: string[],
    componentName: string,
    label: string,
    files: string[],
    sourceFiles: Set<string>
): void {
    const seen = new Set<string>()

    for (const file of files) {
        if (!isSafeRelativeFile(file)) {
            errors.push(`[${componentName}] ${label} "${file}" must be a portable relative file path`)
            continue
        }

        if (seen.has(file)) {
            errors.push(`[${componentName}] duplicate ${label} "${file}"`)
        }
        seen.add(file)

        if (!sourceFiles.has(file)) {
            errors.push(`[${componentName}] declared ${label} "${file}" does not exist in source`)
        }
    }
}

function isSafeRelativeFile(file: string): boolean {
    if (file.length === 0 || file.startsWith('/') || file.startsWith('\\') || file.includes('\\')) {
        return false
    }

    return file.split('/').every(segment => segment.length > 0 && segment !== '.' && segment !== '..')
}

function compareStringArrays(
    errors: string[],
    itemName: string,
    fieldName: 'dependencies' | 'registryDependencies' | 'examples',
    manifestValues: string[],
    indexValues: string[]
): void {
    const sortedManifestValues = [...manifestValues].sort()
    const sortedIndexValues = [...indexValues].sort()

    if (sortedManifestValues.length !== sortedIndexValues.length) {
        errors.push(`item "${itemName}" ${fieldName} mismatch`)
        return
    }

    for (let index = 0; index < sortedIndexValues.length; index++) {
        if (sortedManifestValues[index] !== sortedIndexValues[index]) {
            errors.push(`item "${itemName}" ${fieldName} mismatch`)
            return
        }
    }
}
