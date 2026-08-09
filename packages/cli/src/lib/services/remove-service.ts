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
const COMPONENT_FILE_EXTENSIONS = [...SCRIPT_EXTENSIONS, '.vue', '.tsx', '.jsx'] as const;
/** 声明文件后缀需整体剥离：`foo.d.ts` 不能被常规 `.ts` 剥离成 `foo.d`。 */
const DECLARATION_FILE_SUFFIXES = ['.d.ts', '.d.mts', '.d.cts'] as const;
/** 引用判定并发批量大小：避免一次打开过多文件句柄。 */
const REFERENCE_CHECK_BATCH_SIZE = 10;

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

/**
 * 剥离 alias 前缀（如 `@/composables/` 或 legacy 的 `composables/`），
 * 返回相对 alias 根目录的路径；相对导入或无法识别的 specifier（如 ~/...）返回 null，
 * 避免按文件名猜测解析到无关的同名文件。
 */
function stripAliasPrefix(specifier: string, aliasDir: string): string | null {
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
    return null;
}

/** 规范化 import specifier：去查询串、扩展名与尾部 /index，便于跨形式比较。 */
function normalizeImportTarget(specifier: string): string {
    let result = specifier.split(/[?#]/)[0];
    // 声明后缀整体优先剥离：`foo.d.ts` → `foo`，与源码 `@/types/foo` 的无扩展名形式对齐，
    // 避免先被常规 `.ts` 截断成 `foo.d` 导致声明文件被误判为未被引用
    for (const suffix of DECLARATION_FILE_SUFFIXES) {
        if (result.endsWith(suffix)) {
            result = result.slice(0, -suffix.length);
            break;
        }
    }
    for (const ext of COMPONENT_FILE_EXTENSIONS) {
        if (result.endsWith(ext)) {
            result = result.slice(0, -ext.length);
            break;
        }
    }
    if (result.endsWith('/index')) {
        result = result.slice(0, -'/index'.length);
    }
    return result;
}

/** 判断 import specifier 是否指向 components 目录下名为 componentName 的组件。 */
function importTargetsComponent(specifier: string, componentName: string, componentsAliasDir: string): boolean {
    const stripped = stripAliasPrefix(specifier, componentsAliasDir);
    if (stripped === null) return false;
    const target = normalizeImportTarget(stripped);
    return target === componentName || target.startsWith(`${componentName}/`);
}

interface AliasDirEntry {
    aliasDir: string;
    absDir: string;
}

/** 解析各 alias 配置对应的绝对目录，供 import 图引用校验（#103）匹配使用。 */
async function resolveAliasDirs(cwd: string, config: BrutalistConfig, componentsPath: string): Promise<AliasDirEntry[]> {
    const entries: AliasDirEntry[] = [
        { aliasDir: config.aliases.components.replace(/^@\//, ''), absDir: componentsPath },
        { aliasDir: config.aliases.composables.replace(/^@\//, ''), absDir: await resolveAliasPath(config.aliases.composables, cwd) },
    ];
    const utilsDirAlias = path.dirname(config.aliases.utils);
    entries.push({
        aliasDir: utilsDirAlias.replace(/^@\//, ''),
        absDir: await resolveAliasPath(utilsDirAlias, cwd),
    });
    if (config.sharedBase) {
        entries.push({
            aliasDir: config.sharedBase.replace(/^@\//, ''),
            absDir: await resolveAliasPath(config.sharedBase, cwd),
        });
    }
    return entries;
}

/**
 * 组件间 import 图：specifier → 组件名集合（#102 依赖检查、孤立判定共用）。
 * 相对导入额外记录 importer 文件路径集合：其解析基准是 importer 实际文件所在目录，
 * 而非组件根目录（#B）。
 */
interface ImportGraph {
    /** import specifier → 发起该 import 的组件名集合 */
    byComponent: Map<string, Set<string>>;
    /** 相对 import specifier → 发起该 import 的文件绝对路径集合 */
    byImporterFile: Map<string, Set<string>>;
}

/** 由 importer 文件绝对路径推导所属组件名（componentsPath 下第一层目录）；不在组件目录内时返回 null。 */
function importerComponentName(componentsPath: string, importerFile: string): string | null {
    const relative = path.relative(componentsPath, importerFile);
    if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
        return null;
    }
    return relative.split(path.sep)[0];
}

/** 相对 import 解析结果缓存：结果只取决于 (importerFile, specifier)，组件路径固定时进程内稳定（#D）。 */
const relativeImportResolveCache = new Map<string, Map<string, Promise<string | null>>>();

/** 把以 importer 文件所在目录为基准的相对 import 解析为绝对路径，无法解析时返回 null。 */
function resolveRelativeImport(importerFile: string, specifier: string): Promise<string | null> {
    let importerEntries = relativeImportResolveCache.get(importerFile);
    if (!importerEntries) {
        importerEntries = new Map<string, Promise<string | null>>();
        relativeImportResolveCache.set(importerFile, importerEntries);
    }
    const cached = importerEntries.get(specifier);
    if (cached) {
        return cached;
    }
    const promise = resolveRelativeImportUncached(importerFile, specifier);
    importerEntries.set(specifier, promise);
    return promise;
}

async function resolveRelativeImportUncached(importerFile: string, specifier: string): Promise<string | null> {
    const candidate = path.resolve(path.dirname(importerFile), specifier);
    const stat = await fs.stat(candidate).catch(() => null);
    if (stat !== null) {
        if (stat.isDirectory()) {
            // 目录导入（`./shared` 指向 shared/index.*）：先判断目录，避免把目录路径
            // 直接当解析结果与目标文件比较（pathExists 对目录返回 true 会短路）
            return resolveScriptFile(candidate, 'index');
        }
        return candidate;
    }
    return resolveScriptFile(path.dirname(candidate), path.basename(candidate));
}

/**
 * 判断目标文件是否仍被 remaining 组件以 import 引用：
 * 覆盖 alias 形式（@/composables/x 等）与相对路径形式（./../x）两类 import，
 * 供 manifest 孤立判定在删除前用 import 图交叉确认（#103）。
 */
async function isReferencedByRemainingComponents(
    absoluteFile: string,
    aliasDirs: AliasDirEntry[],
    componentsPath: string,
    importGraph: ImportGraph,
    remainingComponents: Set<string>
): Promise<boolean> {
    // 以 aliasDir 为维度存储规范化目标（#C）：`composables/index` 与 `@/components/index`
    // 规范化后同为 `index`，合并进同一 Set 会丢失 alias 身份造成误匹配，孤立清理被静默跳过
    const fileTargets = new Map<string, Set<string>>();
    for (const { aliasDir, absDir } of aliasDirs) {
        const rel = path.relative(absDir, absoluteFile);
        if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) continue;
        if (!fileTargets.has(aliasDir)) {
            fileTargets.set(aliasDir, new Set());
        }
        fileTargets.get(aliasDir)!.add(normalizeImportTarget(rel.split(path.sep).join('/')));
    }

    for (const [specifier, importers] of importGraph.byComponent) {
        if (![...importers].some(importer => remainingComponents.has(importer))) continue;

        if (specifier.startsWith('.')) {
            const importerFiles = importGraph.byImporterFile.get(specifier);
            if (!importerFiles) continue;
            for (const importerFile of importerFiles) {
                // 相对导入按 importer 实际文件所在目录解析（#B），
                // 归属组件由文件路径推导，限定 remaining 组件内的 importer
                const componentName = importerComponentName(componentsPath, importerFile);
                if (componentName === null || !remainingComponents.has(componentName)) continue;
                const resolved = await resolveRelativeImport(importerFile, specifier);
                if (resolved !== null && path.resolve(resolved) === path.resolve(absoluteFile)) {
                    return true;
                }
            }
            continue;
        }

        for (const { aliasDir } of aliasDirs) {
            const stripped = stripAliasPrefix(specifier, aliasDir);
            if (stripped === null) continue;
            // 限定同一 alias 域内比较（stripAliasPrefix 已按 aliasDir 剥离，配对自然成立）
            if (fileTargets.get(aliasDir)?.has(normalizeImportTarget(stripped))) {
                return true;
            }
        }
    }

    return false;
}

async function findManifestKnownFiles(
    cwd: string,
    config: BrutalistConfig,
    manifest: BrutxManifest | null,
    removedComponents: string[],
    remainingComponents: string[],
    importGraph: ImportGraph
): Promise<string[]> {
    if (!manifest) {
        return [];
    }

    const remainingFiles = new Set(
        remainingComponents.flatMap(component => manifest.components[component]?.files ?? [])
    );
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const removedComponentDirs = removedComponents.map(component => path.join(componentsPath, component));
    const remainingSet = new Set(remainingComponents);
    const aliasDirs = await resolveAliasDirs(cwd, config, componentsPath);

    // 先收集通过前置安全检查的候选文件，再小批量并发执行引用判定（#D），
    // 避免逐文件串行等待 import 图磁盘 IO
    const candidateFiles: string[] = [];
    for (const component of removedComponents) {
        const entry = manifest.components[component];
        if (!entry) continue;

        for (const manifestFile of entry.files) {
            if (remainingFiles.has(manifestFile)) continue;

            const absolutePath = path.resolve(cwd, manifestFile);
            if (!await isSafePath(absolutePath, cwd)) continue;
            if (removedComponentDirs.some(dir => isInsideDirectory(absolutePath, dir))) continue;
            if (!await fs.pathExists(absolutePath)) continue;
            candidateFiles.push(absolutePath);
        }
    }

    const knownFiles: string[] = [];
    for (let offset = 0; offset < candidateFiles.length; offset += REFERENCE_CHECK_BATCH_SIZE) {
        const batch = candidateFiles.slice(offset, offset + REFERENCE_CHECK_BATCH_SIZE);
        const referencedFlags = await Promise.all(
            batch.map(file => isReferencedByRemainingComponents(file, aliasDirs, componentsPath, importGraph, remainingSet))
        );
        for (let i = 0; i < batch.length; i++) {
            // #103：删除前用 import 图交叉确认——若 remaining 组件仍引用该文件
            // （如工具函数被移动至共享位置后继续被引用），不判为孤立，避免引用断裂
            if (!referencedFlags[i]) {
                knownFiles.push(batch[i]);
            }
        }
    }

    const uniqueKnownFiles = [...new Set(knownFiles)];

    // 折中提示：import 图仅覆盖组件间引用，无法确认项目其他（非组件）代码是否仍在引用
    // 这些位于共享位置的文件；保留删除行为（与既有测试契约一致），仅以 warning 提醒
    const sharedOrphans = uniqueKnownFiles.filter(file => !isInsideDirectory(file, componentsPath));
    if (sharedOrphans.length > 0) {
        logger.warn(
            `${sharedOrphans.length} shared file(s) declared by the removed component(s) are orphaned based on manifest ownership — ` +
            `verify they are not imported by non-component code (e.g. App.vue, main.ts).`
        );
    }

    return uniqueKnownFiles;
}

async function scanAllImports(componentsPath: string): Promise<ImportGraph> {
    const byComponent = new Map<string, Set<string>>();
    const byImporterFile = new Map<string, Set<string>>();

    if (!await fs.pathExists(componentsPath)) {
        return { byComponent, byImporterFile };
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
                if (!byComponent.has(importPath)) {
                    byComponent.set(importPath, new Set());
                }
                byComponent.get(importPath)!.add(componentName);
                // 相对导入按 importer 实际文件所在目录解析（#B），单独记录文件路径
                if (importPath.startsWith('.')) {
                    if (!byImporterFile.has(importPath)) {
                        byImporterFile.set(importPath, new Set());
                    }
                    byImporterFile.get(importPath)!.add(fullPath);
                }
            }
        }
    }

    const dirs = await fs.readdir(componentsPath, { withFileTypes: true });
    for (const dir of dirs) {
        if (!dir.isDirectory()) continue;
        await scanDir(path.join(componentsPath, dir.name), dir.name);
    }

    return { byComponent, byImporterFile };
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
    removedComponents: string[],
    importMap: Map<string, Set<string>>
): Promise<string[]> {
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
    useCache: boolean = true,
    importMap: Map<string, Set<string>> = new Map()
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

    // #102：用组件间真实 import 交叉校验，补齐 registryDependencies 元数据缺失/过期
    // 导致的依赖漏检（如代码中实际 import 了被删组件但元数据未声明）
    if (importMap.size > 0) {
        const removedSet = new Set(componentsToRemove);
        const componentsAliasDir = config.aliases.components.replace(/^@\//, '');
        for (const name of componentsToRemove) {
            for (const [specifier, importers] of importMap) {
                if (!importTargetsComponent(specifier, name, componentsAliasDir)) continue;
                for (const importer of importers) {
                    if (removedSet.has(importer)) continue;
                    if (!dependents.has(name)) {
                        dependents.set(name, []);
                    }
                    const list = dependents.get(name)!;
                    if (!list.includes(importer)) {
                        list.push(importer);
                    }
                }
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
    // 组件间 import 图只需构建一次，供依赖检查（#102）与孤立文件判定（#103）共用，
    // 避免多次全量扫描组件目录；相对导入另按 importer 文件路径记录（#B）
    const emptyImportGraph: ImportGraph = { byComponent: new Map(), byImporterFile: new Map() };
    const importGraph = toRemove.length > 0
        ? await scanAllImports(await resolveAliasPath(config.aliases.components, cwd))
        : emptyImportGraph;
    const { dependents, failures: dependencyCheckFailures } = toRemove.length > 0
        ? await getDependents(cwd, config, toRemove, manifest, useCache, importGraph.byComponent)
        : { dependents: new Map<string, string[]>(), failures: [] as string[] };
    const orphanedFiles = toRemove.length > 0
        ? [
            ...new Set([
                ...await findOrphanedFiles(cwd, config, remaining, toRemove, importGraph.byComponent),
                ...await findManifestKnownFiles(cwd, config, manifest, toRemove, remaining, importGraph),
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
        // #104：resolveAliasPath 涉及 tsconfig 解析与异步 IO 且结果与迭代无关，
        // 提升到循环外只解析一次
        const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
        for (const comp of componentsToRemove) {
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
