import type { ComponentRegistryEntry, RegistryIndex, RegistryIndexItem, RegistryItem } from 'brutx-shared-vue'

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

    if (manifestItemNames.join('\0') !== [...manifestItemNames].sort().join('\0')) {
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
    entry: ComponentRegistryEntry,
    inventory: ComponentSourceFileInventory
): string[] {
    const errors: string[] = []

    if (entry.name !== name) {
        errors.push(`[${name}] COMPONENT_REGISTRY entry name "${entry.name}" does not match its key`)
    }

    if (entry.files.length === 0) {
        errors.push(`[${name}] COMPONENT_REGISTRY entry must list at least one component file`)
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
            errors.push(`[docs:${options.locale}] Docs page "${slug}.md" does not map to COMPONENT_REGISTRY`)
        }
    }

    return errors
}

export function validateGeneratedItemMatchesMetadata(
    item: Pick<RegistryItem, 'name' | 'title' | 'description' | 'dependencies' | 'category' | 'examples' | 'status' | 'replacement' | 'files'>,
    entry: ComponentRegistryEntry
): string[] {
    const errors: string[] = []

    if (item.title !== entry.title) {
        errors.push('title does not match COMPONENT_REGISTRY')
    }

    if (item.description !== entry.description) {
        errors.push('description does not match COMPONENT_REGISTRY')
    }

    compareStringArrays(errors, item.name, 'dependencies', item.dependencies, entry.dependencies)
    compareStringArrays(errors, item.name, 'examples', item.examples ?? [], entry.examples ?? [])

    if (item.category !== entry.category) {
        errors.push('category does not match COMPONENT_REGISTRY')
    }

    if (item.status !== entry.status) {
        errors.push('status does not match COMPONENT_REGISTRY')
    }

    if (item.replacement !== entry.replacement) {
        errors.push('replacement does not match COMPONENT_REGISTRY')
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

export function validateRegistryItemInternalImports(
    item: Pick<RegistryItem, 'name' | 'files' | 'registryDependencies'>
): string[] {
    const errors: string[] = []
    const files = new Set(item.files.map(file => file.path))
    const registryDependencies = new Set(item.registryDependencies)

    for (const file of item.files) {
        for (const specifier of extractStaticModuleSpecifiers(file.content)) {
            const expectedPath = resolveRegistryAliasImport(item.name, specifier)

            if (!expectedPath || REGISTRY_ITEM_IGNORED_IMPORTS.has(expectedPath)) {
                continue
            }

            if (!files.has(expectedPath)) {
                if (expectedPath.startsWith('locales/') && registryDependencies.has('locale-zh-cn')) {
                    continue
                }

                errors.push(`file "${file.path}" imports "${specifier}", but generated registry item is missing "${expectedPath}"`)
            }
        }
    }

    return errors
}

function extractStaticModuleSpecifiers(code: string): string[] {
    const specifiers = new Set<string>()
    const importPattern = /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g

    for (const match of code.matchAll(importPattern)) {
        specifiers.add(match[1])
    }

    return Array.from(specifiers)
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
