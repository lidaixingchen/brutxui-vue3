export interface RegistryReferenceItem {
    name: string
    registryDependencies: string[]
}

export interface UnknownRegistryReference {
    component: string
    dependency: string
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
