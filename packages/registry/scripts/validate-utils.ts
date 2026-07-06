import type { ComponentRegistryEntry, RegistryIndexItem, RegistryItem } from 'brutx-shared-vue'

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
    itemCount: number
    items: Record<string, RegistryBuildManifestItem>
}

export interface ComponentSourceFileInventory {
    componentFiles: Set<string>
    composables: Set<string>
    directives: Set<string>
}

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
    indexItems: RegistryIndexItem[]
): string[] {
    const errors: string[] = []
    const indexByName = new Map(indexItems.map(item => [item.name, item]))
    const manifestNames = new Set(Object.keys(manifest.items))

    if (manifest.itemCount !== indexItems.length) {
        errors.push(`itemCount ${manifest.itemCount} does not match index item count ${indexItems.length}`)
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
