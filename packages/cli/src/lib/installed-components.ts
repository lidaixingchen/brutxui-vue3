import fs from 'fs-extra';
import path from 'path';
import { parse as parseModuleImports, type ImportSpecifier } from 'es-module-lexer';
import type { BrutalistConfig, InstalledComponentInfo, InstalledComponentManifest } from './types.js';
import { readManifest } from './manifest.js';
import { extractScriptBlocks, resolveAliasPath } from './project.js';
import { logger } from './logger.js';

/** 组件目录扫描的并发上限，避免组件较多时瞬时占用过多文件描述符 */
const SCAN_CONCURRENCY = 8;

/**
 * 以固定并发上限执行异步映射，限制同时运行的任务数。
 * mapper 抛错时置停止标志，阻止后续新任务派发（不保证已领取/进行中的任务中止）。
 */
async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T) => Promise<R>,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let nextIndex = 0;
    let stopped = false;

    async function worker(): Promise<void> {
        while (!stopped) {
            const index = nextIndex;
            nextIndex += 1;
            if (index >= items.length) return;
            results[index] = await mapper(items[index]);
        }
    }

    try {
        await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
    } catch (error) {
        stopped = true;
        throw error;
    }
    return results;
}

import type { FileSystemAdapter } from './fs/file-system-adapter.js';

async function scanComponentFiles(dir: string, fsAdapter?: FileSystemAdapter): Promise<string[]> {
    const files: string[] = [];

    async function walk(currentDir: string, base: string): Promise<void> {
        const entries = fsAdapter
            ? await fsAdapter.readdir(currentDir, { withFileTypes: true })
            : await fs.readdir(currentDir, { withFileTypes: true });

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

async function extractDependencies(componentDir: string, fsAdapter?: FileSystemAdapter): Promise<string[]> {
    const deps = new Set<string>();
    const files = await scanComponentFiles(componentDir, fsAdapter);

    for (const file of files) {
        const ext = path.extname(file);
        if (ext !== '.vue' && ext !== '.ts' && ext !== '.js') continue;

        const content = fsAdapter
            ? await fsAdapter.readFile(path.join(componentDir, file), 'utf-8')
            : await fs.readFile(path.join(componentDir, file), 'utf-8');

        const scripts = ext === '.vue'
            ? extractScriptBlocks(content).map(block => block.code)
            : [content];

        for (const script of scripts) {
            let imports: readonly ImportSpecifier[];
            try {
                [imports] = parseModuleImports(script);
            } catch (error) {
                logger.warn(`Failed to parse imports in '${file}': ${error instanceof Error ? error.message : String(error)}`);
                continue;
            }
            for (const imp of imports) {
                collectDependency(deps, imp.n);
            }
        }
    }

    return [...deps].sort();
}

function collectDependency(deps: Set<string>, specifier: string | undefined): void {
    if (!specifier) return;
    if (specifier.startsWith('.') || specifier.startsWith('/')) return;
    if (specifier.startsWith('@')) {
        const parts = specifier.split('/');
        if (parts.length >= 2 && parts[0].length > 1) {
            deps.add(parts.slice(0, 2).join('/'));
        }
    } else {
        deps.add(specifier.split('/')[0]);
    }
}

async function getScannedComponentNames(componentsPath: string, fsAdapter?: FileSystemAdapter): Promise<string[]> {
    const exists = fsAdapter ? await fsAdapter.pathExists(componentsPath) : await fs.pathExists(componentsPath);
    if (!exists) {
        return [];
    }

    const dirs = fsAdapter
        ? await fsAdapter.readdir(componentsPath, { withFileTypes: true })
        : await fs.readdir(componentsPath, { withFileTypes: true });

    return dirs
        .filter((dir) => dir.isDirectory())
        .map((dir) => dir.name)
        .sort();
}

interface ComponentScanBase {
    name: string;
    files: string[];
    dependencies: string[];
}

function withManifestDefaults(
    base: ComponentScanBase,
    manifestEntry: InstalledComponentManifest | undefined,
): InstalledComponentInfo {
    return {
        ...base,
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

export async function getInstalledComponentNames(
    cwd: string,
    config: BrutalistConfig,
    fsAdapter?: FileSystemAdapter
): Promise<string[]> {
    const manifest = await readManifest(cwd, fsAdapter).catch(() => null);
    const manifestNames = Object.keys(manifest?.components ?? {});
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd, fsAdapter);
    const scannedNames = await getScannedComponentNames(componentsPath, fsAdapter);

    return [...new Set([...manifestNames, ...scannedNames])].sort();
}

export async function getInstalledComponentInfos(
    cwd: string,
    config: BrutalistConfig,
    fsAdapter?: FileSystemAdapter
): Promise<InstalledComponentInfo[]> {
    const manifest = await readManifest(cwd, fsAdapter).catch(() => null);
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd, fsAdapter);
    const componentNames = await getInstalledComponentNames(cwd, config, fsAdapter);

    const infos = await mapWithConcurrency(componentNames, SCAN_CONCURRENCY, async (name) => {
        const componentDir = path.join(componentsPath, name);
        const manifestEntry = manifest?.components[name];

        try {
            const exists = fsAdapter ? await fsAdapter.pathExists(componentDir) : await fs.pathExists(componentDir);
            if (!exists) {
                return manifestEntry ? createManifestInfo(manifestEntry) : null;
            }

            const files = await scanComponentFiles(componentDir, fsAdapter);
            const hasVueFile = files.some(f => f.endsWith('.vue'));

            if (files.length === 0 || !hasVueFile) {
                return manifestEntry ? createManifestInfo(manifestEntry) : null;
            }

            const dependencies = await extractDependencies(componentDir, fsAdapter);
            return withManifestDefaults(
                { name, files, dependencies },
                manifestEntry,
            );
        } catch (error) {
            logger.warn(`Failed to scan component '${name}': ${error instanceof Error ? error.message : String(error)}`);
            return manifestEntry ? createManifestInfo(manifestEntry) : null;
        }
    });

    return infos
        .filter((info): info is InstalledComponentInfo => info !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
}
