export interface RegistryReferenceItem {
    name: string;
    registryDependencies: string[];
}

export function findRegistryDependencyCycles(items: RegistryReferenceItem[]): string[][] {
    const graph = new Map(items.map(item => [item.name, item.registryDependencies]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const stack: string[] = [];
    const cycles: string[][] = [];
    const cycleKeys = new Set<string>();

    function visit(name: string): void {
        if (visiting.has(name)) {
            const start = stack.indexOf(name);
            const cycle = [...stack.slice(start), name];
            const key = cycle.join(' -> ');
            if (!cycleKeys.has(key)) {
                cycles.push(cycle);
                cycleKeys.add(key);
            }
            return;
        }

        if (visited.has(name)) {
            return;
        }

        visiting.add(name);
        stack.push(name);

        for (const dependency of graph.get(name) ?? []) {
            if (graph.has(dependency)) {
                visit(dependency);
            }
        }

        stack.pop();
        visiting.delete(name);
        visited.add(name);
    }

    for (const name of graph.keys()) {
        visit(name);
    }

    return cycles;
}

export function assertRegistryDependencyGraph(items: RegistryReferenceItem[]): void {
    const cycles = findRegistryDependencyCycles(items);
    if (cycles.length > 0) {
        throw new Error(cycles
            .map(cycle => `Registry dependency cycle detected: ${cycle.join(' -> ')}`)
            .join('\n'));
    }
}
