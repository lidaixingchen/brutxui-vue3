import path from 'path';
import type { FileSystemAdapter } from '../fs/index.js';
import type { ProjectContext } from '../project-context.js';
import type { BaselineRegistrySelection, BrutxManifest, InstalledComponentManifest, RegistryItem } from '../types.js';
import {
    getBaselineRelativePath,
    getInstalledComponentIdentity,
    readManifest,
    type BaselineRecovery,
} from '../manifest.js';
import { projectRegistryFiles, resolveInstalledFile } from '../component-files.js';
import { logger } from '../logger.js';

export interface ComponentBaselineResult {
    componentName: string;
    version?: string;
    registrySource?: string;
    status: 'ready' | 'fallback-diff';
    files: Map<string, string>;
    projectPaths?: ReadonlySet<string>;
    recovery?: BaselineRecovery;
    rawItem?: RegistryItem;
    message?: string;
}

export type RegistryItemFetcher = (
    name: string,
    source?: string,
    useCache?: boolean,
    fsAdapter?: FileSystemAdapter
) => Promise<RegistryItem>;

export interface BaselineProviderOptions {
    fs?: FileSystemAdapter;
    itemFetcher?: RegistryItemFetcher;
}

export class BaselineProvider {
    private readonly fsAdapter?: FileSystemAdapter;
    private readonly itemFetcher?: RegistryItemFetcher;

    constructor(options: BaselineProviderOptions = {}) {
        this.fsAdapter = options.fs;
        this.itemFetcher = options.itemFetcher;
    }

    localBaselines(
        context: ProjectContext,
        entry: InstalledComponentManifest,
        projectPaths: ReadonlySet<string> = new Set(entry.files.map(file =>
            context.toRelativePosixPath(resolveInstalledFile(context, file)),
        )),
    ) {
        const fs = this.fsAdapter ?? context.fs;
        const recordedPaths = new Map(Object.entries(entry.baselines ?? {}).map(([filePath, baselinePath]) =>
            [context.toRelativePosixPath(resolveInstalledFile(context, filePath)), baselinePath] as const,
        ));
        const basenameCounts = new Map<string, number>();
        for (const relativePath of projectPaths) {
            const basename = path.posix.basename(relativePath);
            basenameCounts.set(basename, (basenameCounts.get(basename) ?? 0) + 1);
        }
        const hasUniqueBasename = (basename: string) => basenameCounts.get(basename) === 1;

        return {
            projectPaths,
            hasUniqueBasename,
            read: async (relativePath: string): Promise<string | undefined> => {
                const basename = path.posix.basename(relativePath);
                const uniqueBasename = hasUniqueBasename(basename);
                const canonicalPath = getBaselineRelativePath(entry.name, relativePath);
                const legacyPath = getBaselineRelativePath(entry.name, basename);
                const candidates = new Set([
                    relativePath !== basename || uniqueBasename ? recordedPaths.get(relativePath) : undefined,
                    canonicalPath !== legacyPath || uniqueBasename ? canonicalPath : undefined,
                    uniqueBasename ? recordedPaths.get(basename) : undefined,
                    uniqueBasename ? legacyPath : undefined,
                ]);
                for (const candidate of candidates) {
                    if (!candidate) continue;
                    const absolutePath = resolveInstalledFile(context, candidate);
                    if (await fs.pathExists(absolutePath)) return fs.readFile(absolutePath, 'utf-8');
                }
            },
        };
    }

    async getComponentBaseline(
        context: ProjectContext,
        componentName: string,
        options: { useCache?: boolean; registrySource?: string; installedManifest?: BrutxManifest | null } = {}
    ): Promise<ComponentBaselineResult> {
        const fsAdapter = this.fsAdapter ?? context.fs;
        const useCache = options.useCache !== false;
        const manifest = options.installedManifest === undefined
            ? await readManifest(context.cwd, fsAdapter).catch(() => null)
            : options.installedManifest;
        const entry = manifest?.components[componentName];
        const files = new Map<string, string>();

        if (!entry) return { componentName, files, status: 'fallback-diff' };

        const registrySource = entry.registrySource;
        const { projectPaths, hasUniqueBasename, read } = this.localBaselines(context, entry);
        const result = { componentName, version: entry.version, registrySource, files, projectPaths };

        const missingPaths = new Set<string>();
        const remember = (relativePath: string, content: string) => {
            files.set(relativePath, content);
            const basename = path.posix.basename(relativePath);
            if (hasUniqueBasename(basename)) files.set(basename, content);
        };
        for (const relativePath of projectPaths) {
            const content = await read(relativePath);
            if (content === undefined) missingPaths.add(relativePath);
            else remember(relativePath, content);
        }

        if (missingPaths.size === 0) return { ...result, status: 'ready' };

        logger.warn(`Baseline for "${componentName}" missing in .brutx/baselines/, falling back to registry fetch...`);
        const recoveryGroups = new Map<string, { selection: BaselineRegistrySelection; paths: Set<string> }>();
        for (const relativePath of missingPaths) {
            const selection = entry.baselineSources?.[relativePath] ?? entry;
            const key = JSON.stringify([selection.registrySource, selection.registryBaseSource, selection.version, selection.integrity]);
            const group = recoveryGroups.get(key) ?? { selection, paths: new Set<string>() };
            group.paths.add(relativePath);
            recoveryGroups.set(key, group);
        }

        let message: string | undefined;
        let rawItem: RegistryItem | undefined;
        const recovered: Array<{ relativePath: string; content: string }> = [];
        for (const { selection, paths } of recoveryGroups.values()) {
            const fetchTargets = [componentName];
            if (!selection.registryBaseSource && selection.version && selection.version !== 'latest') {
                fetchTargets.push(`${componentName}@${selection.version}`);
            }
            for (const fetchTarget of fetchTargets) {
                try {
                    const item = this.itemFetcher
                        ? await this.itemFetcher(fetchTarget, selection.registrySource, useCache, fsAdapter)
                        : await context.registry.fetchItem(fetchTarget, { sourceOverride: selection.registrySource, useCache });
                    if (selection.integrity !== item.integrity) {
                        message = `Component "${componentName}@${selection.version}" integrity mismatch. Expected ${selection.integrity}, got ${item.integrity}.`;
                        continue;
                    }

                    for (const { relativePath, content } of await projectRegistryFiles(context, item.files)) {
                        if (!paths.has(relativePath)) continue;
                        remember(relativePath, content);
                        missingPaths.delete(relativePath);
                        recovered.push({ relativePath, content });
                    }
                    rawItem ??= item;
                    break;
                } catch {
                    // 历史源或版本不可用时继续尝试同一来源下的其他版本地址。
                }
            }
        }

        return {
            ...result,
            status: missingPaths.size === 0 ? 'ready' : 'fallback-diff',
            ...(missingPaths.size > 0 && message ? { message } : {}),
            ...(recovered.length > 0 ? { recovery: {
                componentName,
                installedAt: entry.installedAt,
                identity: getInstalledComponentIdentity(entry)!,
                files: recovered,
            } } : {}),
            ...(rawItem ? { rawItem } : {}),
        };
    }
}
