import path from 'path';
import type { AddOptions, BrutalistConfig, RegistryItem } from '../types.js';
import { UTILS_TEMPLATE } from '../constants.js';
import { resolveDeps } from '../registry.js';
import { ProjectContext } from '../project-context.js';
import { FileTransaction } from '../file-transaction.js';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';

export interface ComponentResolutionResult {
    items: RegistryItem[];
    dependencies: string[];
    registrySources: Record<string, string>;
}

export interface EnsureUtilsFileResult {
    path: string;
    created: boolean;
}

export interface ComponentFileWriteCallbacks {
    onProgress?: (result: { item: RegistryItem; index: number; total: number }) => void;
    onSkipFile?: (result: { item: RegistryItem; filePath: string }) => void;
    onDryRunFile?: (result: { item: RegistryItem; targetPath: string }) => void;
}

export interface ComponentFileWriteOptions {
    overwrite?: AddOptions['overwrite'];
    dryRun?: AddOptions['dryRun'];
    callbacks?: ComponentFileWriteCallbacks;
    transaction?: FileTransaction;
}

export interface ComponentFileWriteResult {
    added: string[];
    skipped: string[];
    filesWritten: string[];
    filesByComponent: Record<string, string[]>;
    rollbackCount: number;
    transaction?: FileTransaction;
    rollback: () => Promise<{ rollbackFailures: number }>;
}

export interface ComponentFileWriteFailure {
    rollbackFailures: number;
    rollbackCount: number;
}

export async function resolveComponents(
    components: string[],
    registry?: string,
    useCache: boolean = true,
    sources?: string[]
): Promise<ComponentResolutionResult> {
    const hitSources = new Map<string, string>();
    const items = await resolveDeps(components, registry, useCache, sources, hitSources);
    const dependencies = new Set<string>();

    for (const item of items) {
        item.dependencies?.forEach(dep => dependencies.add(dep));
    }

    return {
        items,
        dependencies: Array.from(dependencies),
        registrySources: Object.fromEntries(hitSources),
    };
}

export async function resolveComponentFilePath(
    registryPath: string,
    configOrContext: BrutalistConfig | ProjectContext,
    cwd?: string
): Promise<string> {
    if (configOrContext instanceof ProjectContext) {
        return configOrContext.resolveTargetPath(registryPath);
    }
    const context = await ProjectContext.loadUninitialized(cwd ?? process.cwd(), {
        configOverride: configOrContext,
    });
    return context.resolveTargetPath(registryPath);
}

export async function ensureUtilsFile(
    cwdOrContext: string | ProjectContext,
    config?: BrutalistConfig,
    fsAdapter?: FileSystemAdapter
): Promise<EnsureUtilsFileResult> {
    let context: ProjectContext;
    if (cwdOrContext instanceof ProjectContext) {
        context = cwdOrContext;
    } else {
        context = await ProjectContext.loadUninitialized(cwdOrContext, {
            configOverride: config,
            fs: fsAdapter,
        });
    }

    const utilsPath = await context.resolveUtilsFilePath();

    if (await context.fs.pathExists(utilsPath)) {
        return {
            path: utilsPath,
            created: false,
        };
    }

    await context.fs.ensureDir(path.dirname(utilsPath));
    await context.fs.writeFile(utilsPath, UTILS_TEMPLATE);

    return {
        path: utilsPath,
        created: true,
    };
}

export async function writeComponentFiles(
    contextOrItems: ProjectContext | RegistryItem[],
    itemsOrConfig: RegistryItem[] | BrutalistConfig,
    optionsOrCwd?: ComponentFileWriteOptions | string,
    legacyOptions?: ComponentFileWriteOptions
): Promise<ComponentFileWriteResult> {
    let context: ProjectContext;
    let items: RegistryItem[];
    let options: ComponentFileWriteOptions;

    if (contextOrItems instanceof ProjectContext) {
        context = contextOrItems;
        items = itemsOrConfig as RegistryItem[];
        options = (optionsOrCwd as ComponentFileWriteOptions) ?? {};
    } else {
        items = contextOrItems;
        const config = itemsOrConfig as BrutalistConfig;
        const cwd = typeof optionsOrCwd === 'string' ? optionsOrCwd : process.cwd();
        context = await ProjectContext.loadUninitialized(cwd, { configOverride: config });
        options = typeof optionsOrCwd === 'object' && optionsOrCwd !== null
            ? (optionsOrCwd as ComponentFileWriteOptions)
            : (legacyOptions ?? {});
    }

    const transaction = options.transaction ?? context.createTransaction();
    const added: string[] = [];
    const skippedSet = new Set<string>();
    const filesWritten: string[] = [];
    const filesByComponent = new Map<string, string[]>();
    let actualWritesCount = 0;

    try {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            options.callbacks?.onProgress?.({ item, index: i, total: items.length });

            let itemAdded = false;
            let itemSkipped = false;

            for (const file of item.files) {
                const targetPath = await context.resolveTargetPath(file.path);

                if (await context.fs.pathExists(targetPath) && !options.overwrite) {
                    options.callbacks?.onSkipFile?.({ item, filePath: file.path });
                    itemSkipped = true;
                    continue;
                }

                if (options.dryRun) {
                    options.callbacks?.onDryRunFile?.({ item, targetPath });
                    itemAdded = true;
                    filesWritten.push(targetPath);
                    const dryRunFiles = filesByComponent.get(item.name) ?? [];
                    dryRunFiles.push(targetPath);
                    filesByComponent.set(item.name, dryRunFiles);
                    continue;
                }

                const resolvedContent = context.resolveImportAlias(file.content);
                await transaction.writeFile(targetPath, resolvedContent);
                actualWritesCount++;

                itemAdded = true;
                filesWritten.push(targetPath);
                const componentFiles = filesByComponent.get(item.name) ?? [];
                componentFiles.push(targetPath);
                filesByComponent.set(item.name, componentFiles);
            }

            if (itemAdded) {
                added.push(item.name);
            } else if (itemSkipped) {
                skippedSet.add(item.name);
            }
        }
    } catch (writeError) {
        const failures = await transaction.rollback();

        return Promise.reject(Object.assign(
            writeError instanceof Error ? writeError : new Error(String(writeError)),
            {
                rollbackFailures: failures.length,
                rollbackCount: actualWritesCount,
            } satisfies ComponentFileWriteFailure
        ));
    }

    return {
        added,
        skipped: Array.from(skippedSet),
        filesWritten,
        filesByComponent: Object.fromEntries(filesByComponent),
        rollbackCount: 0,
        transaction,
        rollback: async () => {
            const failures = await transaction.rollback();
            return { rollbackFailures: failures.length };
        },
    };
}
