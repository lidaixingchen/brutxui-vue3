import path from 'node:path';
import type { FileSystemAdapter } from 'brutx-shared-vue/fs';
import { SfcAstEngine } from 'brutx-shared-vue/ast';
import type { BrutxManifest, InstalledComponentInfo, InstalledComponentManifest } from './types.js';
import { readManifest } from './manifest.js';
import { logger } from './logger.js';
import type { ProjectContext } from './project-context.js';

const DEFAULT_SCAN_CONCURRENCY = 8;
const NON_NPM_SPECIFIER_PREFIXES = ['.', '/', '~', '#', '$'] as const;

export interface ComponentScanOptions {
    concurrency?: number;
}

interface ComponentScanBase {
    name: string;
    files: string[];
    dependencies: string[];
}

export async function mapWithConcurrency<T, R>(
    items: readonly T[],
    limit: number,
    mapper: (item: T) => Promise<R>,
): Promise<R[]> {
    const safeLimit = Math.max(1, limit);
    const results = new Array<R>(items.length);
    let nextIndex = 0;
    let stopped = false;

    async function worker(): Promise<void> {
        while (!stopped) {
            const index = nextIndex;
            nextIndex += 1;
            if (index >= items.length) return;
            results[index] = await mapper(items[index]!);
        }
    }

    try {
        await Promise.all(Array.from({ length: Math.min(safeLimit, items.length) }, () => worker()));
    } catch (error) {
        stopped = true;
        throw error;
    }
    return results;
}

export async function scanComponentFiles(dir: string, fsAdapter: FileSystemAdapter): Promise<string[]> {
    const files: string[] = [];

    async function walk(currentDir: string, base: string): Promise<void> {
        const entries = await fsAdapter.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            const relative = base ? `${base}/${entry.name}` : entry.name;

            if (entry.isDirectory()) {
                if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
                    continue;
                }
                await walk(fullPath, relative);
            } else {
                files.push(relative);
            }
        }
    }

    await walk(dir, '');
    return files;
}

function collectDependency(deps: Set<string>, specifier: string | undefined): void {
    if (!specifier) return;
    if (NON_NPM_SPECIFIER_PREFIXES.some(prefix => specifier.startsWith(prefix))) return;
    if (specifier.startsWith('@')) {
        const parts = specifier.split('/');
        if (parts.length >= 2 && parts[0]!.length > 1) {
            deps.add(parts.slice(0, 2).join('/'));
        }
    } else {
        const firstSegment = specifier.split('/')[0];
        if (firstSegment) {
            deps.add(firstSegment);
        }
    }
}

export async function extractDependencies(componentDir: string, fsAdapter: FileSystemAdapter): Promise<string[]> {
    const deps = new Set<string>();
    const files = await scanComponentFiles(componentDir, fsAdapter);

    for (const file of files) {
        const ext = path.extname(file);
        if (ext !== '.vue' && ext !== '.ts' && ext !== '.js') continue;

        const content = await fsAdapter.readFile(path.join(componentDir, file), 'utf-8');
        try {
            const specifiers = SfcAstEngine.extractModuleSpecifiers(content, file);
            for (const item of specifiers) {
                collectDependency(deps, item.specifier);
            }
        } catch (error) {
            logger.warn(`Failed to parse imports in '${file}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    return [...deps].sort();
}

async function getScannedComponentNames(componentsPath: string, fsAdapter: FileSystemAdapter): Promise<string[]> {
    const exists = await fsAdapter.pathExists(componentsPath);
    if (!exists) {
        return [];
    }

    const dirs = await fsAdapter.readdir(componentsPath, { withFileTypes: true });

    return dirs
        .filter((dir) => dir.isDirectory())
        .map((dir) => dir.name)
        .sort();
}

function withManifestDefaults(
    base: ComponentScanBase,
    manifestEntry: InstalledComponentManifest | undefined,
): InstalledComponentInfo {
    return {
        ...base,
        version: manifestEntry?.version,
        dependencies: manifestEntry?.dependencies ?? base.dependencies,
        category: manifestEntry?.category,
        examples: manifestEntry?.examples,
        status: manifestEntry?.status,
        replacement: manifestEntry?.replacement,
        registryDependencies: manifestEntry?.registryDependencies,
        registrySource: manifestEntry?.registrySource,
        integrity: manifestEntry?.integrity,
        installedAt: manifestEntry?.installedAt,
        manifestFiles: manifestEntry?.files,
        managed: manifestEntry !== undefined,
    };
}

function createManifestInfo(entry: InstalledComponentManifest): InstalledComponentInfo {
    return {
        ...withManifestDefaults(
            {
                name: entry.name,
                files: entry.files,
                dependencies: entry.dependencies,
            },
            entry,
        ),
        version: entry.version,
    };
}

export class ComponentScanner {
    private readonly concurrency: number;

    constructor(
        private readonly ctx: ProjectContext,
        options?: ComponentScanOptions,
    ) {
        this.concurrency = options?.concurrency ?? DEFAULT_SCAN_CONCURRENCY;
    }

    async getInstalledNames(cachedManifest?: BrutxManifest | null, cachedComponentsPath?: string): Promise<string[]> {
        const manifest = cachedManifest !== undefined
            ? cachedManifest
            : await readManifest(this.ctx.cwd, this.ctx.fs).catch(() => null);
        const manifestNames = Object.keys(manifest?.components ?? {});
        const componentsPath = cachedComponentsPath ?? await this.ctx.resolveComponentsDir();
        const scannedNames = await getScannedComponentNames(componentsPath, this.ctx.fs);

        return [...new Set([...manifestNames, ...scannedNames])].sort();
    }

    async getInstalledInfos(): Promise<InstalledComponentInfo[]> {
        const manifest = await readManifest(this.ctx.cwd, this.ctx.fs).catch(() => null);
        const componentsPath = await this.ctx.resolveComponentsDir();
        const componentNames = await this.getInstalledNames(manifest, componentsPath);

        const infos = await mapWithConcurrency(componentNames, this.concurrency, async (name) => {
            const componentDir = path.join(componentsPath, name);
            const manifestEntry = manifest?.components[name];

            try {
                const exists = await this.ctx.fs.pathExists(componentDir);
                if (!exists) {
                    return manifestEntry ? createManifestInfo(manifestEntry) : null;
                }

                const files = await scanComponentFiles(componentDir, this.ctx.fs);
                const hasVueFile = files.some(f => f.endsWith('.vue'));

                if (files.length === 0 || !hasVueFile) {
                    return manifestEntry ? createManifestInfo(manifestEntry) : null;
                }

                const dependencies = await extractDependencies(componentDir, this.ctx.fs);
                return withManifestDefaults(
                    { name, files, dependencies },
                    manifestEntry,
                );
            } catch (error) {
                logger.warn(`Failed to inspect component '${name}': ${error instanceof Error ? error.message : String(error)}`);
                return manifestEntry ? createManifestInfo(manifestEntry) : null;
            }
        });

        return infos.filter((info): info is InstalledComponentInfo => info !== null);
    }
}
