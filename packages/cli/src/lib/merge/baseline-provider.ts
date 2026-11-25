import path from 'path';
import type { FileSystemAdapter } from '../fs/index.js';
import type { ProjectContext } from '../project-context.js';
import type { BrutxManifest, RegistryItem } from '../types.js';
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
        const projectPaths = new Set(entry.files.map(filePath =>
            context.toRelativePosixPath(resolveInstalledFile(context, filePath))
        ));
        const result = { componentName, version: entry.version, registrySource, files, projectPaths };
        const recordedPaths = new Map(Object.entries(entry.baselines ?? {}).map(([filePath, baselinePath]) =>
            [context.toRelativePosixPath(resolveInstalledFile(context, filePath)), baselinePath] as const
        ));
        const basenameCounts = new Map<string, number>();
        for (const relativePath of projectPaths) {
            const basename = path.posix.basename(relativePath);
            basenameCounts.set(basename, (basenameCounts.get(basename) ?? 0) + 1);
        }

        const missingPaths = new Set<string>();
        const remember = (relativePath: string, content: string) => {
            files.set(relativePath, content);
            const basename = path.posix.basename(relativePath);
            if (basenameCounts.get(basename) === 1) files.set(basename, content);
        };
        for (const relativePath of projectPaths) {
            const basename = path.posix.basename(relativePath);
            const uniqueBasename = basenameCounts.get(basename) === 1;
            const canonicalPath = getBaselineRelativePath(componentName, relativePath);
            const legacyPath = getBaselineRelativePath(componentName, basename);
            const candidates = new Set([
                relativePath !== basename || uniqueBasename ? recordedPaths.get(relativePath) : undefined,
                canonicalPath !== legacyPath || uniqueBasename ? canonicalPath : undefined,
                uniqueBasename ? recordedPaths.get(basename) : undefined,
                uniqueBasename ? legacyPath : undefined,
            ]);
            for (const candidate of candidates) {
                if (!candidate) continue;
                const absolutePath = resolveInstalledFile(context, candidate);
                if (await fsAdapter.pathExists(absolutePath)) {
                    remember(relativePath, await fsAdapter.readFile(absolutePath, 'utf-8'));
                    break;
                }
            }
            if (!files.has(relativePath)) missingPaths.add(relativePath);
        }

        if (missingPaths.size === 0) return { ...result, status: 'ready' };

        logger.warn(`Baseline for "${componentName}" missing in .brutx/baselines/, falling back to registry fetch...`);
        const fetchTargets = [componentName];
        if (!entry.registryBaseSource && entry.version && entry.version !== 'latest') {
            fetchTargets.push(`${componentName}@${entry.version}`);
        }

        let message: string | undefined;
        for (const fetchTarget of fetchTargets) {
            try {
                const rawItem = this.itemFetcher
                    ? await this.itemFetcher(fetchTarget, registrySource, useCache, fsAdapter)
                    : await context.registry.fetchItem(fetchTarget, { sourceOverride: registrySource, useCache });
                if (entry.integrity !== rawItem.integrity) {
                    message = `Component "${componentName}@${entry.version}" integrity mismatch. Expected ${entry.integrity}, got ${rawItem.integrity}.`;
                    continue;
                }

                const recovered = (await projectRegistryFiles(context, rawItem.files))
                    .filter(({ relativePath }) => missingPaths.has(relativePath));
                for (const { relativePath, content } of recovered) {
                    remember(relativePath, content);
                    missingPaths.delete(relativePath);
                }

                return {
                    ...result,
                    status: missingPaths.size === 0 ? 'ready' : 'fallback-diff',
                    recovery: recovered.length > 0 ? {
                        componentName,
                        installedAt: entry.installedAt,
                        identity: getInstalledComponentIdentity(entry)!,
                        files: recovered.map(({ relativePath, content }) => ({ relativePath, content })),
                    } : undefined,
                    rawItem,
                };
            } catch {
                // 历史源或版本不可用时继续尝试同一来源下的其他版本地址。
            }
        }

        return { ...result, status: 'fallback-diff', message };
    }
}
