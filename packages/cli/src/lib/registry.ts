import fs from 'fs-extra';
import path from 'path';
import type { RegistryItem, RegistryFile, BrutalistConfig } from './types.js';
import { DEFAULT_REGISTRY_URL, SCHEMA_URL, DEFAULT_ALIASES, DEFAULT_TAILWIND_CONFIG } from './constants.js';

function isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
}

function validateRegistryFile(file: unknown, itemName: string): file is RegistryFile {
    if (typeof file !== 'object' || file === null) {
        return false;
    }

    const f = file as Record<string, unknown>;

    if (typeof f.path !== 'string' || f.path.length === 0) {
        throw new Error(
            `Invalid registry file in "${itemName}": "path" must be a non-empty string.`
        );
    }

    if (typeof f.content !== 'string') {
        throw new Error(
            `Invalid registry file in "${itemName}": "content" must be a string.`
        );
    }

    return true;
}

function validateRegistryItem(data: unknown, name: string): asserts data is RegistryItem {
    if (typeof data !== 'object' || data === null) {
        throw new Error(`Invalid registry data for "${name}": expected an object.`);
    }

    const item = data as Record<string, unknown>;

    if (typeof item.name !== 'string' || item.name.length === 0) {
        throw new Error(`Invalid registry data for "${name}": "name" must be a non-empty string.`);
    }

    if (typeof item.type !== 'string') {
        throw new Error(`Invalid registry data for "${name}": "type" must be a string.`);
    }

    if (!Array.isArray(item.files)) {
        throw new Error(`Invalid registry data for "${name}": "files" must be an array.`);
    }

    for (const file of item.files) {
        validateRegistryFile(file, name);
    }

    if (item.dependencies !== undefined && !Array.isArray(item.dependencies)) {
        throw new Error(`Invalid registry data for "${name}": "dependencies" must be an array.`);
    }

    if (item.registryDependencies !== undefined && !Array.isArray(item.registryDependencies)) {
        throw new Error(
            `Invalid registry data for "${name}": "registryDependencies" must be an array.`
        );
    }
}

export async function getItem(name: string, source: string = DEFAULT_REGISTRY_URL): Promise<RegistryItem> {
    let data: unknown;

    if (isUrl(source)) {
        const url = `${source}/${name}.json`;
        const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) {
            throw new Error(`Failed to fetch component "${name}" from registry: ${res.statusText}`);
        }
        data = await res.json();
    } else {
        const filePath = path.resolve(source, `${name}.json`);
        if (!filePath.startsWith(path.resolve(source) + path.sep)) {
            throw new Error(`Security Error: Path traversal detected in component name "${name}".`);
        }
        if (!(await fs.pathExists(filePath))) {
            throw new Error(`Component "${name}" not found in local registry: ${filePath}`);
        }
        data = await fs.readJson(filePath);
    }

    validateRegistryItem(data, name);
    return data;
}

function validateBrutalistConfig(data: unknown): asserts data is Record<string, unknown> {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('Invalid components.json: expected an object.');
    }

    const config = data as Record<string, unknown>;

    if (config.$schema !== undefined && typeof config.$schema !== 'string') {
        throw new Error('Invalid components.json: "$schema" must be a string.');
    }

    if (config.style !== undefined && typeof config.style !== 'string') {
        throw new Error('Invalid components.json: "style" must be a string.');
    }

    if (config.tailwind !== undefined) {
        if (typeof config.tailwind !== 'object' || config.tailwind === null || Array.isArray(config.tailwind)) {
            throw new Error('Invalid components.json: "tailwind" must be an object.');
        }
        const tailwind = config.tailwind as Record<string, unknown>;
        if (tailwind.config !== undefined && typeof tailwind.config !== 'string') {
            throw new Error('Invalid components.json: "tailwind.config" must be a string.');
        }
        if (tailwind.css !== undefined && typeof tailwind.css !== 'string') {
            throw new Error('Invalid components.json: "tailwind.css" must be a string.');
        }
    }

    if (config.aliases !== undefined) {
        if (typeof config.aliases !== 'object' || config.aliases === null || Array.isArray(config.aliases)) {
            throw new Error('Invalid components.json: "aliases" must be an object.');
        }
        const aliases = config.aliases as Record<string, unknown>;
        if (aliases.components !== undefined && typeof aliases.components !== 'string') {
            throw new Error('Invalid components.json: "aliases.components" must be a string.');
        }
        if (aliases.utils !== undefined && typeof aliases.utils !== 'string') {
            throw new Error('Invalid components.json: "aliases.utils" must be a string.');
        }
        if (aliases.composables !== undefined && typeof aliases.composables !== 'string') {
            throw new Error('Invalid components.json: "aliases.composables" must be a string.');
        }
    }
}

export async function readConfigSafe(cwd: string): Promise<BrutalistConfig | null> {
    try {
        return await readConfig(cwd);
    } catch {
        return null;
    }
}

export async function readConfig(cwd: string): Promise<BrutalistConfig> {
    const configPath = path.join(cwd, 'components.json');
    if (!(await fs.pathExists(configPath))) {
        throw new Error('components.json not found. Run `brutx-vue init` first.');
    }

    let config: unknown;
    try {
        config = await fs.readJson(configPath);
    } catch (error) {
        throw new Error(`Failed to parse components.json: invalid JSON. ${error instanceof Error ? error.message : ''}`);
    }

    validateBrutalistConfig(config);

    // config is narrowed to Record<string, unknown> by validateBrutalistConfig
    const raw = config;
    const rawTailwind = raw.tailwind;
    const rawAliases = raw.aliases;

    const tailwind = (typeof rawTailwind === 'object' && rawTailwind !== null && !Array.isArray(rawTailwind))
        ? rawTailwind as Record<string, unknown>
        : undefined;
    const aliases = (typeof rawAliases === 'object' && rawAliases !== null && !Array.isArray(rawAliases))
        ? rawAliases as Record<string, unknown>
        : undefined;

    return {
        $schema: (typeof raw.$schema === 'string' ? raw.$schema : undefined) ?? SCHEMA_URL,
        style: (typeof raw.style === 'string' ? raw.style : undefined) ?? 'brutalism',
        tailwind: {
            config: (typeof tailwind?.config === 'string' ? tailwind.config : undefined) ?? DEFAULT_TAILWIND_CONFIG,
            css: (typeof tailwind?.css === 'string' ? tailwind.css : undefined) ?? '@/styles/globals.css',
        },
        aliases: {
            components: (typeof aliases?.components === 'string' ? aliases.components : undefined) ?? DEFAULT_ALIASES.components,
            utils: (typeof aliases?.utils === 'string' ? aliases.utils : undefined) ?? DEFAULT_ALIASES.utils,
            composables: (typeof aliases?.composables === 'string' ? aliases.composables : undefined) ?? DEFAULT_ALIASES.composables,
        },
    };
}

export async function resolveDeps(names: string[], source: string = DEFAULT_REGISTRY_URL): Promise<RegistryItem[]> {
    const resolved: RegistryItem[] = [];
    const visited = new Set<string>();
    const active = new Set<string>();

    async function dfs(fullName: string) {
        let cleanName = fullName;
        let itemSource = source;

        if (fullName.includes('@')) {
            const match = fullName.match(/^([a-z0-9-]+)@([a-zA-Z0-9._-]+)$/);
            if (match) {
                cleanName = match[1];
                const version = match[2];

                if (source === DEFAULT_REGISTRY_URL) {
                    itemSource = `https://raw.githubusercontent.com/lidaixingchen/brutxui-vue3/${version}/packages/registry/registry`;
                }
            }
        }

        if (active.has(cleanName)) {
            throw new Error(`Circular dependency detected: ${cleanName}`);
        }
        if (visited.has(cleanName)) {
            return;
        }

        active.add(cleanName);

        try {
            const item = await getItem(cleanName, itemSource);

            if (item.registryDependencies && item.registryDependencies.length > 0) {
                for (const dep of item.registryDependencies) {
                    await dfs(dep);
                }
            }

            active.delete(cleanName);
            visited.add(cleanName);
            resolved.push(item);
        } catch (err) {
            active.delete(cleanName);
            throw err;
        }
    }

    for (const name of names) {
        await dfs(name);
    }

    return resolved;
}
