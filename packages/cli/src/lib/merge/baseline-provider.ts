import type { FileSystemAdapter } from '../fs/index.js';
import type { ProjectContext } from '../project-context.js';
import type { RegistryItem, InstalledComponentManifest } from '../types.js';
import { readManifest } from '../manifest.js';
import { resolveImportAlias } from '../project.js';

export interface ComponentBaselineResult {
    componentName: string;
    version?: string;
    registrySource?: string;
    status: 'ready' | 'fallback-diff';
    files: Map<string, string>;
    rawItem?: RegistryItem;
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
        options: { useCache?: boolean; registrySource?: string } = {}
    ): Promise<ComponentBaselineResult> {
        const fsAdapter = this.fsAdapter ?? context.fs;
        const useCache = options.useCache !== false;

        let manifestEntry: InstalledComponentManifest | undefined;
        try {
            const manifest = await readManifest(context.cwd, fsAdapter);
            manifestEntry = manifest ? manifest.components[componentName] : undefined;
        } catch {
            manifestEntry = undefined;
        }

        if (!manifestEntry || !manifestEntry.version) {
            return {
                componentName,
                status: 'fallback-diff',
                files: new Map(),
            };
        }

        const source = options.registrySource ?? manifestEntry.registrySource;

        try {
            const rawItem = this.itemFetcher
                ? await this.itemFetcher(
                    componentName,
                    source,
                    useCache,
                    fsAdapter
                )
                : await context.registry.fetchItem(componentName, {
                    sourceOverride: source,
                    useCache,
                });

            const config = context.config;
            const filesMap = new Map<string, string>();

            if (rawItem.files && Array.isArray(rawItem.files)) {
                for (const file of rawItem.files) {
                    const originalContent = file.content ?? '';
                    const projectedContent = config
                        ? resolveImportAlias(originalContent, config)
                        : originalContent;

                    // 记录文件相对路径与文件名基名
                    const normalizedPath = file.path.replace(/\\/g, '/');
                    filesMap.set(normalizedPath, projectedContent);
                    const baseName = normalizedPath.split('/').pop()!;
                    if (!filesMap.has(baseName)) {
                        filesMap.set(baseName, projectedContent);
                    }
                }
            }

            return {
                componentName,
                version: manifestEntry.version,
                registrySource: source,
                status: 'ready',
                files: filesMap,
                rawItem,
            };
        } catch {
            return {
                componentName,
                version: manifestEntry.version,
                registrySource: source,
                status: 'fallback-diff',
                files: new Map(),
            };
        }
    }
}
