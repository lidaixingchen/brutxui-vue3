import path from 'path';
import type { FileSystemAdapter } from '../fs/index.js';
import type { ProjectContext } from '../project-context.js';
import type { RegistryItem, InstalledComponentManifest, BrutxManifest } from '../types.js';
import { getManifestPath, readManifest } from '../manifest.js';
import { resolveImportAlias } from '../project.js';
import { logger } from '../logger.js';

export interface ComponentBaselineResult {
    componentName: string;
    version?: string;
    registrySource?: string;
    status: 'ready' | 'fallback-diff';
    files: Map<string, string>;
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
        options: { useCache?: boolean; registrySource?: string } = {}
    ): Promise<ComponentBaselineResult> {
        const fsAdapter = this.fsAdapter ?? context.fs;
        const useCache = options.useCache !== false;

        let manifest: BrutxManifest | null = null;
        let manifestEntry: InstalledComponentManifest | undefined;
        try {
            manifest = await readManifest(context.cwd, fsAdapter);
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

        // 1. 优先从本地 .brutx/baselines/<component>/ 读取基线快照
        const filesMap = new Map<string, string>();
        let allLocalBaselinesExist = true;

        if (manifestEntry.files && manifestEntry.files.length > 0) {
            const normalizedFilePaths = manifestEntry.files.map(filePath => filePath.replace(/\\/g, '/'));
            const basenameCounts = new Map<string, number>();
            for (const fileRelPath of normalizedFilePaths) {
                const baseName = path.posix.basename(fileRelPath);
                basenameCounts.set(baseName, (basenameCounts.get(baseName) ?? 0) + 1);
            }

            const hasAmbiguousLegacyBaseline = normalizedFilePaths.some(fileRelPath => {
                const baseName = path.posix.basename(fileRelPath);
                return basenameCounts.get(baseName)! > 1 && !manifestEntry.baselines?.[fileRelPath];
            });
            if (hasAmbiguousLegacyBaseline) {
                allLocalBaselinesExist = false;
            }

            for (const fileRelPath of normalizedFilePaths) {
                if (!allLocalBaselinesExist) break;
                const baseName = path.posix.basename(fileRelPath);
                const recordedPath = manifestEntry.baselines?.[fileRelPath]
                    ?? manifestEntry.baselines?.[baseName]
                    ?? `.brutx/baselines/${componentName}/${baseName}`;
                const absBaselinePath = path.resolve(context.cwd, recordedPath);
                if (await fsAdapter.pathExists(absBaselinePath)) {
                    const content = await fsAdapter.readFile(absBaselinePath, 'utf-8');
                    filesMap.set(fileRelPath, content);
                    if (basenameCounts.get(baseName) === 1) {
                        filesMap.set(baseName, content);
                    }
                } else {
                    allLocalBaselinesExist = false;
                    break;
                }
            }
        } else {
            allLocalBaselinesExist = false;
        }

        if (allLocalBaselinesExist && filesMap.size > 0) {
            return {
                componentName,
                version: manifestEntry.version,
                registrySource: source,
                status: 'ready',
                files: filesMap,
            };
        }

        // 2. 本地基线缺失：安全回退向 Registry 拉取并补齐本地基线
        logger.warn(`Baseline for "${componentName}" missing in .brutx/baselines/, falling back to registry fetch...`);
        filesMap.clear();

        try {
            const fetchTarget = manifestEntry.version && manifestEntry.version !== 'latest'
                ? `${componentName}@${manifestEntry.version}`
                : componentName;

            const rawItem = this.itemFetcher
                ? await this.itemFetcher(
                    fetchTarget,
                    source,
                    useCache,
                    fsAdapter
                )
                : await context.registry.fetchItem(fetchTarget, {
                    sourceOverride: source,
                    useCache,
                });

            if (manifestEntry.integrity && rawItem.integrity && manifestEntry.integrity !== rawItem.integrity) {
                return {
                    componentName,
                    version: manifestEntry.version,
                    status: 'fallback-diff',
                    files: filesMap,
                    message: `Component "${componentName}@${manifestEntry.version}" integrity mismatch. Expected ${manifestEntry.integrity}, got ${rawItem.integrity}.`,
                };
            }

            const config = context.config;

            if (rawItem.files && Array.isArray(rawItem.files)) {
                const basenameCounts = new Map<string, number>();
                const recoveredBaselines: Record<string, string> = { ...(manifestEntry.baselines ?? {}) };
                let allBaselinesWritten = rawItem.files.length > 0;
                for (const file of rawItem.files) {
                    const baseName = path.posix.basename(file.path.replace(/\\/g, '/'));
                    basenameCounts.set(baseName, (basenameCounts.get(baseName) ?? 0) + 1);
                }

                for (const file of rawItem.files) {
                    const originalContent = file.content ?? '';
                    const projectedContent = config
                        ? resolveImportAlias(originalContent, config)
                        : originalContent;

                    const targetPath = await context.resolveTargetPath(file.path);
                    const projectRelativePath = context.toRelativePosixPath(targetPath);
                    const baseName = path.posix.basename(file.path.replace(/\\/g, '/'));
                    filesMap.set(projectRelativePath, projectedContent);
                    if (basenameCounts.get(baseName) === 1) {
                        filesMap.set(baseName, projectedContent);
                    }

                    try {
                        const localBaselinePath = path.resolve(
                            context.cwd,
                            `.brutx/baselines/${componentName}/${projectRelativePath}`
                        );
                        await fsAdapter.ensureDir(path.dirname(localBaselinePath));
                        await fsAdapter.writeFile(localBaselinePath, projectedContent);
                        recoveredBaselines[projectRelativePath] = `.brutx/baselines/${componentName}/${projectRelativePath}`;
                    } catch {
                        allBaselinesWritten = false;
                    }
                }

                if (manifest && allBaselinesWritten) {
                    manifest.components[componentName] = {
                        ...manifestEntry,
                        baselines: recoveredBaselines,
                    };
                    await fsAdapter.writeJson(getManifestPath(context.cwd), manifest, { spaces: 4 });
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
