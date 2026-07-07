import fs from 'fs-extra';
import path from 'path';
import type { AddOptions, BrutalistConfig, RegistryItem } from '../types.js';
import { REGISTRY_PATH_PREFIXES, UTILS_TEMPLATE } from '../constants.js';
import { CliError } from '../error.js';
import { isSafePath, resolveAliasPath, resolveImportAlias, verifyWrittenPath } from '../project.js';
import { resolveDeps } from '../registry.js';

export interface ComponentResolutionResult {
    items: RegistryItem[];
    dependencies: string[];
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
}

export interface ComponentFileWriteResult {
    added: string[];
    skipped: string[];
    filesWritten: string[];
    filesByComponent: Record<string, string[]>;
    rollbackCount: number;
}

export interface ComponentFileWriteFailure {
    rollbackFailures: number;
    rollbackCount: number;
}

export async function resolveComponents(
    components: string[],
    registry?: string
): Promise<ComponentResolutionResult> {
    const items = await resolveDeps(components, registry);
    const dependencies = new Set<string>();

    for (const item of items) {
        item.dependencies?.forEach(dep => dependencies.add(dep));
    }

    return {
        items,
        dependencies: Array.from(dependencies),
    };
}

export async function resolveComponentFilePath(
    registryPath: string,
    config: BrutalistConfig,
    cwd: string
): Promise<string> {
    let resolved: string;

    if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.components)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.components.length);
        const aliasPath = await resolveAliasPath(config.aliases.components, cwd);
        resolved = path.join(aliasPath, relative);
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.composables)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.composables.length);
        const aliasPath = await resolveAliasPath(config.aliases.composables, cwd);
        resolved = path.join(aliasPath, relative);
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.locales)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.locales.length);
        const composablesPath = await resolveAliasPath(config.aliases.composables, cwd);
        resolved = path.join(path.dirname(composablesPath), 'locales', relative);
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.directives)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.directives.length);
        const composablesPath = await resolveAliasPath(config.aliases.composables, cwd);
        resolved = path.join(path.dirname(composablesPath), 'directives', relative);
    } else if (registryPath === REGISTRY_PATH_PREFIXES.libUtils || registryPath.startsWith(REGISTRY_PATH_PREFIXES.libUtils + '/')) {
        resolved = await resolveAliasPath(config.aliases.utils, cwd) + '.ts';
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.lib)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.lib.length);
        const aliasPath = await resolveAliasPath(config.aliases.utils, cwd);
        resolved = path.join(path.dirname(aliasPath), relative);
    } else {
        resolved = path.join(cwd, registryPath);
    }

    if (!(await isSafePath(resolved, cwd))) {
        throw new CliError(`Security Error: Resolved path "${resolved}" is outside the project directory.`, {
            code: 'PATH_UNSAFE',
            exitCode: 2,
        });
    }

    return resolved;
}

export async function ensureUtilsFile(cwd: string, config: BrutalistConfig): Promise<EnsureUtilsFileResult> {
    const utilsPath = await resolveAliasPath(config.aliases.utils, cwd) + '.ts';

    if (await fs.pathExists(utilsPath)) {
        return {
            path: utilsPath,
            created: false,
        };
    }

    await fs.ensureDir(path.dirname(utilsPath));
    await fs.writeFile(utilsPath, UTILS_TEMPLATE);

    return {
        path: utilsPath,
        created: true,
    };
}

export async function writeComponentFiles(
    items: RegistryItem[],
    config: BrutalistConfig,
    cwd: string,
    options: ComponentFileWriteOptions = {}
): Promise<ComponentFileWriteResult> {
    const added: string[] = [];
    const skippedSet = new Set<string>();
    const filesWritten: string[] = [];
    const filesByComponent = new Map<string, string[]>();
    const snapshot = new Map<string, string | null>();

    try {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            options.callbacks?.onProgress?.({ item, index: i, total: items.length });

            let itemAdded = false;

            for (const file of item.files) {
                const targetPath = await resolveComponentFilePath(file.path, config, cwd);

                if (await fs.pathExists(targetPath) && !options.overwrite) {
                    options.callbacks?.onSkipFile?.({ item, filePath: file.path });
                    skippedSet.add(item.name);
                    continue;
                }

                if (options.dryRun) {
                    options.callbacks?.onDryRunFile?.({ item, targetPath });
                    itemAdded = true;
                    filesWritten.push(targetPath);
                    continue;
                }

                if (!snapshot.has(targetPath)) {
                    if (await fs.pathExists(targetPath)) {
                        snapshot.set(targetPath, await fs.readFile(targetPath, 'utf-8'));
                    } else {
                        snapshot.set(targetPath, null);
                    }
                }

                await fs.ensureDir(path.dirname(targetPath));
                const resolvedContent = resolveImportAlias(file.content, config);
                await fs.writeFile(targetPath, resolvedContent, 'utf-8');
                await verifyWrittenPath(targetPath, cwd);
                itemAdded = true;
                filesWritten.push(targetPath);
                const componentFiles = filesByComponent.get(item.name) ?? [];
                componentFiles.push(targetPath);
                filesByComponent.set(item.name, componentFiles);
            }

            if (itemAdded) {
                added.push(item.name);
            }
        }
    } catch (writeError) {
        let rollbackFailures = 0;

        for (const [filePath, originalContent] of snapshot) {
            try {
                if (originalContent !== null) {
                    await fs.writeFile(filePath, originalContent, 'utf-8');
                } else if (await fs.pathExists(filePath)) {
                    await fs.promises.rm(filePath, { force: true });
                }
            } catch {
                rollbackFailures++;
            }
        }

        return Promise.reject(Object.assign(writeError instanceof Error ? writeError : new Error(String(writeError)), {
            rollbackFailures,
            rollbackCount: snapshot.size,
        } satisfies ComponentFileWriteFailure));
    }

    return {
        added,
        skipped: Array.from(skippedSet),
        filesWritten,
        filesByComponent: Object.fromEntries(filesByComponent),
        rollbackCount: 0,
    };
}
