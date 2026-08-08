import fs from 'fs-extra';
import path from 'path';
import type { AddOptions, BrutalistConfig, RegistryItem } from '../types.js';
import { REGISTRY_PATH_PREFIXES, UTILS_TEMPLATE } from '../constants.js';
import { CliError } from '../error.js';
import { isSafePath, resolveAliasPath, resolveImportAlias, resolveUtilsFilePath, verifyWrittenPath } from '../project.js';
import { resolveDeps } from '../registry.js';

export interface ComponentResolutionResult {
    items: RegistryItem[];
    dependencies: string[];
    /** 各组件实际命中的 registry 源（多源 fallback 下可能非主源），用于 manifest 记录 registrySource */
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
}

export interface ComponentFileWriteResult {
    added: string[];
    skipped: string[];
    filesWritten: string[];
    filesByComponent: Record<string, string[]>;
    rollbackCount: number;
    /** 撤销本次全部写入（恢复被覆盖文件、删除新建文件），供后续步骤（如依赖安装）失败时回滚 */
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
    config: BrutalistConfig,
    cwd: string
): Promise<string> {
    const sharedBase = config.sharedBase;
    let resolved: string;

    if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.components)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.components.length);
        const aliasPath = await resolveAliasPath(config.aliases.components, cwd);
        resolved = path.join(aliasPath, relative);
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.composables)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.composables.length);
        if (sharedBase) {
            const aliasPath = await resolveAliasPath(sharedBase, cwd);
            resolved = path.join(aliasPath, 'hooks', relative);
        } else {
            const aliasPath = await resolveAliasPath(config.aliases.composables, cwd);
            resolved = path.join(aliasPath, relative);
        }
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.locales)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.locales.length);
        const composablesPath = await resolveAliasPath(config.aliases.composables, cwd);
        resolved = path.join(path.dirname(composablesPath), 'locales', relative);
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.directives)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.directives.length);
        const composablesPath = await resolveAliasPath(config.aliases.composables, cwd);
        resolved = path.join(path.dirname(composablesPath), 'directives', relative);
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.libUtils)) {
        resolved = await resolveUtilsFilePath(config, cwd);
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.lib)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.lib.length);
        if (sharedBase) {
            const aliasPath = await resolveAliasPath(sharedBase, cwd);
            resolved = path.join(aliasPath, 'lib', relative);
        } else {
            const aliasPath = await resolveAliasPath(config.aliases.utils, cwd);
            resolved = path.join(path.dirname(aliasPath), relative);
        }
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
    const utilsPath = await resolveUtilsFilePath(config, cwd);

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

/**
 * 依据写入快照撤销文件变更：恢复被覆盖的原始内容、删除本次新建的文件，
 * 并尽量清理因删除文件而变空的父目录。返回回滚失败的次数。
 */
async function restoreSnapshot(snapshot: Map<string, string | null>): Promise<{ rollbackFailures: number }> {
    let rollbackFailures = 0;
    const dirsToClean = new Set<string>();

    for (const [filePath, originalContent] of snapshot) {
        try {
            if (originalContent !== null) {
                await fs.writeFile(filePath, originalContent, 'utf-8');
            } else if (await fs.pathExists(filePath)) {
                await fs.promises.rm(filePath, { force: true });
            }
            if (originalContent === null) {
                // 收集被删文件的全部祖先目录（ensureDir 递归创建了整条父目录链），自底向上清理
                const root = path.parse(path.dirname(filePath)).root;
                let dir = path.dirname(filePath);
                while (dir !== root) {
                    dirsToClean.add(dir);
                    dir = path.dirname(dir);
                }
            }
        } catch {
            rollbackFailures++;
        }
    }

    const sortedDirs = Array.from(dirsToClean).sort((a, b) => b.length - a.length);
    for (const dir of sortedDirs) {
        try {
            // 只删空目录（recursive: false）；非空目录抛错被忽略，保留其中仍有内容的目录
            await fs.promises.rm(dir, { recursive: false });
        } catch { /* 目录非空或不存在，跳过 */ }
    }

    return { rollbackFailures };
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
            let itemSkipped = false;

            for (const file of item.files) {
                const targetPath = await resolveComponentFilePath(file.path, config, cwd);

                if (await fs.pathExists(targetPath) && !options.overwrite) {
                    options.callbacks?.onSkipFile?.({ item, filePath: file.path });
                    itemSkipped = true;
                    continue;
                }

                if (options.dryRun) {
                    options.callbacks?.onDryRunFile?.({ item, targetPath });
                    itemAdded = true;
                    filesWritten.push(targetPath);
                    // dry-run 分支同步填充 filesByComponent，保证与正常模式的返回结构一致
                    const dryRunFiles = filesByComponent.get(item.name) ?? [];
                    dryRunFiles.push(targetPath);
                    filesByComponent.set(item.name, dryRunFiles);
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
                // 写入前对目标路径 realpath 再次校验，收窄 resolveComponentFilePath 预检
                // 与本处写入之间（pathExists/ensureDir 等 await 操作）的 TOCTOU 窗口，
                // 避免预检后被替换的符号链接使 writeFile 越界落盘
                if (!(await isSafePath(targetPath, cwd))) {
                    throw new CliError(`Security Error: Resolved path "${targetPath}" is outside the project directory.`, {
                        code: 'PATH_UNSAFE',
                        exitCode: 2,
                    });
                }
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
            } else if (itemSkipped) {
                // 仅当该组件没有任何文件写入成功时才放入 skippedSet，避免与 added 自相矛盾
                skippedSet.add(item.name);
            }
        }
    } catch (writeError) {
        const { rollbackFailures } = await restoreSnapshot(snapshot);

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
        rollback: () => restoreSnapshot(snapshot),
    };
}
