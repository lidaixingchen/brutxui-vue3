import type { RegistryIndexItem } from 'brutx-shared-vue'

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
    status?: RegistryIndexItem['status']
    replacement?: string
}

export interface RegistryBuildManifestSnapshot {
    itemCount: number
    items: Record<string, RegistryBuildManifestItem>
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

function compareStringArrays(
    errors: string[],
    itemName: string,
    fieldName: 'dependencies' | 'registryDependencies',
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
