import fs from 'fs-extra';
import path from 'path';
import type { BrutalistConfig, BrutxManifest, RegistryItem } from '../types.js';
import { getItem } from '../registry.js';
import { FileTransaction } from '../file-transaction.js';
import { removeInstalledComponents } from '../manifest.js';
import { getInstalledComponentNames } from '../installed-components.js';
import { isSafePath, resolveAliasPath } from '../project.js';
import { logger } from '../logger.js';

const SCRIPT_EXTENSIONS = ['.ts', '.js', '.mts', '.mjs'] as const;

export interface RemovePreparation {
    installed: string[];
    toRemove: string[];
    notFound: string[];
    remaining: string[];
    dependents: Map<string, string[]>;
    dependencyCheckFailures: string[];
    orphanedFiles: string[];
}

export interface RemoveExecutionResult {
    totalRemoved: number;
    orphanedRemoved: number;
}

export interface RemoveExecutionOptions {
    removeOrphaned: boolean;
    onRemoveComponent?: (componentName: string, fileCount: number) => void;
}

function isInsideDirectory(filePath: string, directoryPath: string): boolean {
    const relative = path.relative(directoryPath, filePath);
    return relative === '' || (relative.length > 0 && !relative.startsWith('..') && !path.isAbsolute(relative));
}

async function findManifestKnownFiles(
    cwd: string,
    config: BrutalistConfig,
    manifest: BrutxManifest | null,
    removedComponents: string[],
    remainingComponents: string[]
): Promise<string[]> {
    if (!manifest) {
        return [];
    }

    const remainingFiles = new Set(
        remainingComponents.flatMap(component => manifest.components[component]?.files ?? [])
    );
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const removedComponentDirs = removedComponents.map(component => path.join(componentsPath, component));
    const knownFiles: string[] = [];

    for (const component of removedComponents) {
        const entry = manifest.components[component];
        if (!entry) continue;

        for (const manifestFile of entry.files) {
            if (remainingFiles.has(manifestFile)) continue;

            const absolutePath = path.resolve(cwd, manifestFile);
            if (!await isSafePath(absolutePath, cwd)) continue;
            if (removedComponentDirs.some(dir => isInsideDirectory(absolutePath, dir))) continue;
            if (!await fs.pathExists(absolutePath)) continue;

            knownFiles.push(absolutePath);
        }
    }

    return [...new Set(knownFiles)];
}

async function scanAllImports(componentsPath: string): Promise<Map<string, Set<string>>> {
    const importMap = new Map<string, Set<string>>();

    if (!await fs.pathExists(componentsPath)) {
        return importMap;
    }

    async function scanDir(dir: string, componentName: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await scanDir(fullPath, componentName);
                continue;
            }

            const ext = path.extname(entry.name);
            if (ext !== '.vue' && ext !== '.ts' && ext !== '.js') continue;

            const content = await fs.readFile(fullPath, 'utf-8');
            const importRegex = /from\s+['"]([^'"]+)['"]/g;
            let match: RegExpExecArray | null;

            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];
                if (!importMap.has(importPath)) {
                    importMap.set(importPath, new Set());
                }
                importMap.get(importPath)!.add(componentName);
            }
        }
    }

    const dirs = await fs.readdir(componentsPath, { withFileTypes: true });
    for (const dir of dirs) {
        if (!dir.isDirectory()) continue;
        await scanDir(path.join(componentsPath, dir.name), dir.name);
    }

    return importMap;
}

async function resolveScriptFile(baseDir: string, fileName: string): Promise<string | null> {
    for (const ext of SCRIPT_EXTENSIONS) {
        const candidate = path.join(baseDir, fileName + ext);
        if (await fs.pathExists(candidate)) {
            return candidate;
        }
    }
    const noExtCandidate = path.join(baseDir, fileName);
    if (await fs.pathExists(noExtCandidate)) {
        return noExtCandidate;
    }
    return null;
}

async function findOrphanedFiles(
    cwd: string,
    config: BrutalistConfig,
    remainingComponents: string[],
    removedComponents: string[]
): Promise<string[]> {
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const importMap = await scanAllImports(componentsPath);

    const composablesPath = await resolveAliasPath(config.aliases.composables, cwd);
    const utilsAlias = config.aliases.utils;
    const utilsDir = path.dirname(utilsAlias);
    const utilsPath = await resolveAliasPath(utilsDir, cwd);
    const localesPath = path.join(path.dirname(composablesPath), 'locales');
    const directivesPath = path.join(path.dirname(composablesPath), 'directives');

    const sharedBasePath = config.sharedBase
        ? await resolveAliasPath(config.sharedBase, cwd)
        : null;
    const sharedHooksPath = sharedBasePath ? path.join(sharedBasePath, 'hooks') : null;
    const sharedLibPath = sharedBasePath ? path.join(sharedBasePath, 'lib') : null;

    const orphaned: string[] = [];

    const stripAliasPrefix = (specifier: string, aliasDir: string): string | null => {
        const strip = (rel: string): string | null => {
            const clean = rel.split(/[?#]/)[0];
            // 规范化后判断：只拦截会解析到基础目录本身或目录之外的路径
            // （''、'.'、'./' 会落到目录本身；'..' 前缀会逃逸出目录），
            // 放行 path.join 会安全规范化的中间 . 段（如 @/hooks/foo/./bar）。
            const normalized = path.posix.normalize(clean);
            if (normalized === '' || normalized === '.' || normalized === '..' || normalized.startsWith('../')) return null;
            return clean;
        };
        const prefix = `@/${aliasDir}/`;
        if (specifier.startsWith(prefix)) {
            return strip(specifier.slice(prefix.length));
        }
        const legacyPrefix = `${aliasDir}/`;
        if (specifier.startsWith(legacyPrefix)) {
            return strip(specifier.slice(legacyPrefix.length));
        }
        // 相对导入或无法识别的 specifier（如 ~/...）不做按文件名猜测，
        // 避免解析到无关的同名文件并被删除
        return null;
    };

    /**
     * 统一"取相对路径 + 判空 + 调 resolveScriptFile"的解析模式：
     * basePath 不存在或 specifier 无法识别时返回 null。
     */
    const tryResolve = async (basePath: string | null, specifier: string, aliasDir: string): Promise<string | null> => {
        if (!basePath || !await fs.pathExists(basePath)) return null;
        const relativePath = stripAliasPrefix(specifier, aliasDir);
        if (relativePath === null) return null;
        return resolveScriptFile(basePath, relativePath);
    };

    for (const [importPath, importers] of importMap) {
        const wasOnlyUsedByRemoved = [...importers].every(c => removedComponents.includes(c));
        if (!wasOnlyUsedByRemoved) continue;

        // 相对导入无法可靠定位（需按导入文件所在目录解析），跳过避免误删无关同名文件
        if (importPath.startsWith('.')) continue;

        const isComposable = importPath.includes('/composables/')
            || (sharedHooksPath !== null && importPath.includes('/hooks/'));
        const isLocale = importPath.includes('/locales/');
        const isDirective = importPath.includes('/directives/');
        const isUtils = importPath.includes('/lib/') && !importPath.endsWith('/utils');

        if (!isComposable && !isLocale && !isDirective && !isUtils) continue;

        let resolvedPath: string | null = null;

        if (isComposable) {
            if (sharedHooksPath && importPath.includes('/hooks/')) {
                resolvedPath = await tryResolve(sharedHooksPath, importPath, 'hooks');
            }
            if (!resolvedPath) {
                resolvedPath = await tryResolve(composablesPath, importPath, 'composables');
            }
        }

        if (!resolvedPath && isLocale) {
            resolvedPath = await tryResolve(localesPath, importPath, 'locales');
        }

        if (!resolvedPath && isDirective) {
            resolvedPath = await tryResolve(directivesPath, importPath, 'directives');
        }

        if (!resolvedPath && isUtils) {
            resolvedPath = await tryResolve(sharedLibPath, importPath, 'lib');
            if (!resolvedPath) {
                resolvedPath = await tryResolve(utilsPath, importPath, 'lib');
            }
        }

        if (resolvedPath) {
            // 路径穿越防护：解析结果必须位于 cwd 内，非安全路径不加入 orphaned
            if (!await isSafePath(resolvedPath, cwd)) continue;
            orphaned.push(resolvedPath);
        }
    }

    return [...new Set(orphaned)];
}

async function getDependents(
    cwd: string,
    config: BrutalistConfig,
    componentsToRemove: string[],
    manifest: BrutxManifest | null,
    useCache: boolean = true
): Promise<{ dependents: Map<string, string[]>; failures: string[] }> {
    const dependents = new Map<string, string[]>();
    const failures = new Set<string>();
    const installed = await getInstalledComponentNames(cwd, config);
    const remaining = installed.filter(c => !componentsToRemove.includes(c));

    for (const name of componentsToRemove) {
        for (const other of remaining) {
            try {
                const otherItem: RegistryItem = await getItem(other, manifest?.components[other]?.registrySource, useCache);
                if (otherItem.registryDependencies?.includes(name)) {
                    if (!dependents.has(name)) {
                        dependents.set(name, []);
                    }
                    dependents.get(name)!.push(other);
                }
            } catch (error) {
                failures.add(other);
                logger.debug(`Failed to fetch registry item for "${other}" during dependency check: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    return { dependents, failures: Array.from(failures).sort() };
}

export async function countComponentFiles(
    cwd: string,
    config: BrutalistConfig,
    componentName: string
): Promise<number | null> {
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const componentPath = path.join(componentsPath, componentName);

    if (!await fs.pathExists(componentPath)) {
        return null;
    }

    return countFilesRecursive(componentPath);
}

async function countFilesRecursive(dir: string): Promise<number> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let count = 0;
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            count += await countFilesRecursive(fullPath);
        } else if (entry.isFile()) {
            count++;
        }
    }
    return count;
}

export async function prepareRemoveComponents(
    cwd: string,
    config: BrutalistConfig,
    components: string[],
    manifest: BrutxManifest | null,
    useCache: boolean = true
): Promise<RemovePreparation> {
    const installed = await getInstalledComponentNames(cwd, config);
    const toRemove = components.filter(c => installed.includes(c));
    const notFound = components.filter(c => !installed.includes(c));
    const remaining = installed.filter(c => !toRemove.includes(c));
    const { dependents, failures: dependencyCheckFailures } = toRemove.length > 0
        ? await getDependents(cwd, config, toRemove, manifest, useCache)
        : { dependents: new Map<string, string[]>(), failures: [] as string[] };
    const orphanedFiles = toRemove.length > 0
        ? [
            ...new Set([
                ...await findOrphanedFiles(cwd, config, remaining, toRemove),
                ...await findManifestKnownFiles(cwd, config, manifest, toRemove, remaining),
            ]),
        ]
        : [];

    return {
        installed,
        toRemove,
        notFound,
        remaining,
        dependents,
        dependencyCheckFailures,
        orphanedFiles,
    };
}

export async function removeComponents(
    cwd: string,
    config: BrutalistConfig,
    componentsToRemove: string[],
    orphanedFiles: string[],
    options: RemoveExecutionOptions
): Promise<RemoveExecutionResult> {
    const transaction = new FileTransaction();
    let totalRemoved = 0;
    let orphanedRemoved = 0;

    try {
        for (const comp of componentsToRemove) {
            const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
            const componentPath = path.join(componentsPath, comp);

            if (await fs.pathExists(componentPath)) {
                const fileCount = await countFilesRecursive(componentPath);
                options.onRemoveComponent?.(comp, fileCount);
                await transaction.remove(componentPath);
                totalRemoved += fileCount;
            }
        }

        if (options.removeOrphaned) {
            for (const f of orphanedFiles) {
                // 统一安全路径校验：拒绝任何解析到 cwd 之外的路径，防止删除目录外文件
                if (!await isSafePath(f, cwd)) continue;
                if (await fs.pathExists(f)) {
                    await transaction.remove(f);
                    orphanedRemoved++;
                }
            }
        }

        await removeInstalledComponents(cwd, componentsToRemove, { transaction });
        await transaction.commit();
    } catch (error) {
        const rollbackFailures = await transaction.rollback();
        return Promise.reject(Object.assign(error instanceof Error ? error : new Error(String(error)), {
            rollbackFailures,
        }));
    }

    return {
        totalRemoved,
        orphanedRemoved,
    };
}
