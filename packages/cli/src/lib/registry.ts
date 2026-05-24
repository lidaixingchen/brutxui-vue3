import fs from 'fs-extra';
import path from 'path';
import type { RegistryItem } from './types.js';
import { DEFAULT_REGISTRY_URL } from './constants.js';

function isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
}

/**
 * Fetch a component from the registry (remote URL or local path)
 */
export async function getItem(name: string, source: string = DEFAULT_REGISTRY_URL): Promise<RegistryItem> {
    if (isUrl(source)) {
        const url = `${source}/${name}.json`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to fetch component "${name}" from registry: ${res.statusText}`);
        }
        return res.json() as Promise<RegistryItem>;
    } else {
        const filePath = path.resolve(source, `${name}.json`);
        if (!(await fs.pathExists(filePath))) {
            throw new Error(`Component "${name}" not found in local registry: ${filePath}`);
        }
        return fs.readJson(filePath) as Promise<RegistryItem>;
    }
}

/**
 * Resolve all registry dependencies recursively using DFS to ensure correct topological order
 */
export async function resolveDeps(names: string[], source: string = DEFAULT_REGISTRY_URL): Promise<RegistryItem[]> {
    const resolved: RegistryItem[] = [];
    const visited = new Set<string>();
    const active = new Set<string>();

    async function dfs(name: string) {
        if (active.has(name)) {
            throw new Error(`Circular dependency detected: ${name}`);
        }
        if (visited.has(name)) {
            return;
        }

        active.add(name);
        
        try {
            const item = await getItem(name, source);
            
            if (item.registryDependencies && item.registryDependencies.length > 0) {
                for (const dep of item.registryDependencies) {
                    await dfs(dep);
                }
            }

            active.delete(name);
            visited.add(name);
            resolved.push(item);
        } catch (err) {
            active.delete(name);
            throw err;
        }
    }

    for (const name of names) {
        await dfs(name);
    }

    return resolved;
}
