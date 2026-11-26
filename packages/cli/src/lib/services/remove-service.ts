import path from 'path';
import { isDeepStrictEqual } from 'node:util';
import { extractModuleSpecifiers } from 'brutx-shared-vue/ast';
import { getModuleSpecifierPath } from 'brutx-shared-vue/module-resolver';
import { getTsConfigBaseUrlCandidate, getTsConfigPathCandidates, readTsConfig, type ResolvedTsConfig } from '../env-detector.js';
import type { BrutxManifest, RegistryItem } from '../types.js';
import { resolveRegistrySources } from '../registry-source.js';
import { getInstalledComponentIdentity, readManifest, removeInstalledComponents } from '../manifest.js';
import { collectInstalledFilePaths, resolveInstalledFile, type PlannedComponentSource } from '../component-files.js';
import { scanComponentFiles } from '../component-scanner.js';
import { CliError } from '../error.js';
import { logger } from '../logger.js';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import type { ProjectContext } from '../project-context.js';
import type { FileTransaction } from '../file-transaction.js';

const SCRIPT_EXTENSIONS = ['.ts', '.js', '.mts', '.mjs'] as const;
const COMPONENT_FILE_EXTENSIONS = [...SCRIPT_EXTENSIONS, '.vue', '.tsx', '.jsx'] as const;
/** 声明文件后缀需整体剥离：`foo.d.ts` 不能被常规 `.ts` 剥离成 `foo.d`。 */
const DECLARATION_FILE_SUFFIXES = ['.d.ts', '.d.mts', '.d.cts'] as const;
const RELATIVE_IMPORT = /^(?:\.{1,2})(?:[/\\]|$)/;

export interface RemovePreparation {
    installed: string[];
    toRemove: string[];
    notFound: string[];
    remaining: string[];
    dependents: Map<string, string[]>;
    dependencyCheckFailures: string[];
    orphanedFiles: string[];
    confirmation: RemoveConfirmation;
}

interface RemoveConfirmation {
    readonly components: ReadonlyMap<string, {
        readonly identity: ReturnType<typeof getInstalledComponentIdentity>;
        readonly directory: string;
        readonly entries: ReadonlySet<string> | null;
    }>;
    readonly retainedPaths: ReadonlySet<string>;
    readonly orphanedFiles: ReadonlySet<string>;
}

export interface RemoveExecutionResult {
    totalRemoved: number;
    orphanedRemoved: number;
}

export interface RemoveExecutionOptions {
    removeOrphaned: boolean;
    /** 通过准备结果校验交互确认期间的安装记录与文件范围。 */
    confirmation?: RemoveConfirmation;
    onRemoveComponent?: (componentName: string, fileCount: number) => void;
}

function isInsideDirectory(filePath: string, directoryPath: string): boolean {
    const relative = path.relative(directoryPath, filePath);
    return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

/**
 * 剥离 alias 前缀（如 `@/composables/` 或 legacy 的 `composables/`），
 * 返回相对 alias 根目录的路径；相对导入或无法识别的 specifier（如 ~/...）返回 null，
 * 避免按文件名猜测解析到无关的同名文件。
 */
function stripAliasPrefix(specifier: string, aliasDir: string): string | null {
    const strip = (rel: string): string | null => {
        const clean = getModuleSpecifierPath(rel);
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
    let result = getModuleSpecifierPath(specifier);
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

/**
 * 导入图按 specifier 索引来源，来源标识为组件名或手写文件路径。
 * 相对导入额外记录 importer 文件路径集合：其解析基准是 importer 实际文件所在目录，
 * 而非组件根目录。
 */
interface ImportGraph {
    /** import specifier → 导入来源集合 */
    byComponent: Map<string, Set<string>>;
    /** 相对 import specifier → 发起该 import 的文件绝对路径集合 */
    byImporterFile: Map<string, Map<string, string>>;
}

function indexImports(graph: ImportGraph, componentName: string, importerFile: string, specifiers: Iterable<string>): void {
    for (const specifier of specifiers) {
        const importers = graph.byComponent.get(specifier) ?? new Set<string>();
        importers.add(componentName);
        graph.byComponent.set(specifier, importers);
        if (RELATIVE_IMPORT.test(specifier)) {
            const files = graph.byImporterFile.get(specifier) ?? new Map<string, string>();
            files.set(importerFile, componentName);
            graph.byImporterFile.set(specifier, files);
        }
    }
}

const SOURCE_EXTENSIONS_BY_IMPORT_EXTENSION: Readonly<Record<string, readonly string[]>> = {
    '.js': ['.ts', '.tsx', '.d.ts'],
    '.jsx': ['.tsx'],
    '.mjs': ['.mts', '.d.mts'],
    '.cjs': ['.cts', '.d.cts'],
};

async function resolveImportFile(
    candidate: string,
    fs: FileSystemAdapter,
    plannedSources: ReadonlyMap<string, PlannedComponentSource>,
): Promise<string | null> {
    const extension = path.extname(candidate);
    const alternatives = SOURCE_EXTENSIONS_BY_IMPORT_EXTENSION[extension] ?? [];
    const base = candidate.slice(0, candidate.length - extension.length);
    const lookups = [
        candidate,
        ...alternatives.map(ext => `${base}${ext}`),
        ...COMPONENT_FILE_EXTENSIONS.map(ext => `${candidate}${ext}`),
        ...DECLARATION_FILE_SUFFIXES.map(ext => `${candidate}${ext}`),
        ...COMPONENT_FILE_EXTENSIONS.map(ext => path.join(candidate, `index${ext}`)),
    ];
    for (const file of lookups) {
        if (plannedSources.has(file) || (await fs.stat(file).catch(() => null))?.isFile()) return file;
    }
    return null;
}

async function findReferencedPaths(
    context: ProjectContext,
    tsConfig: ResolvedTsConfig | null,
    importGraph: ImportGraph,
    paths: ReadonlySet<string>,
    plannedSources: ReadonlyMap<string, PlannedComponentSource>,
): Promise<Set<string>> {
    const referenced = new Set<string>();
    const config = context.requireConfig();
    const importRoots = [
        ...Object.values(config.aliases),
        path.posix.dirname(config.aliases.utils),
        config.sharedBase,
    ].filter((root): root is string => Boolean(root && root !== '.'));

    const resolvePaths = async (candidates: string[]): Promise<boolean> => {
        for (const candidate of candidates) {
            if (!await context.isSafePath(candidate)) continue;
            const file = await resolveImportFile(candidate, context.fs, plannedSources);
            if (!file) continue;
            if (paths.has(file) && await context.isSafePath(file)) referenced.add(file);
            return true;
        }
        return false;
    };

    for (const specifier of importGraph.byComponent.keys()) {
        const cleanSpecifier = getModuleSpecifierPath(specifier);
        if (RELATIVE_IMPORT.test(cleanSpecifier)) {
            for (const importer of importGraph.byImporterFile.get(specifier)?.keys() ?? []) {
                await resolvePaths([path.resolve(path.dirname(importer), cleanSpecifier)]);
            }
            continue;
        }
        const mappedPaths = getTsConfigPathCandidates(cleanSpecifier, context.cwd, tsConfig);
        if (await resolvePaths(mappedPaths)) continue;
        const baseUrlPath = getTsConfigBaseUrlCandidate(cleanSpecifier, context.cwd, tsConfig);
        if (baseUrlPath && await resolvePaths([baseUrlPath])) continue;

        if (mappedPaths.length === 0 && (cleanSpecifier.startsWith('@/') || cleanSpecifier.startsWith('~/')
            || importRoots.some(root => cleanSpecifier === root || cleanSpecifier.startsWith(`${root}/`)))) {
            const candidate = await context.resolveAliasPath(cleanSpecifier, tsConfig).catch(() => null);
            if (candidate) await resolvePaths([candidate]);
        }
    }
    return referenced;
}

export async function findFilesReferencedByInstalledComponents(
    context: ProjectContext,
    manifest: BrutxManifest | null,
    paths: readonly string[],
    excludedComponents: ReadonlySet<string>,
    plannedSources: ReadonlyMap<string, PlannedComponentSource> = new Map(),
    excludedDirectories: readonly string[] = [],
): Promise<Set<string>> {
    if (paths.length === 0) return new Set();

    const tsConfig = await readTsConfig(context.cwd, context.fs);
    const candidates = new Set(paths);
    const importGraph: ImportGraph = { byComponent: new Map(), byImporterFile: new Map() };
    const seen = new Set([...paths, ...plannedSources.keys()]);
    const isSource = (file: string) => COMPONENT_FILE_EXTENSIONS.some(ext => ext === path.extname(file));
    const indexSource = async (importer: string): Promise<void> => {
        if (!isSource(importer) || !await context.isSafePath(importer) || !await context.fs.pathExists(importer)) return;
        const content = await context.fs.readFile(importer, 'utf-8');
        indexImports(importGraph, importer, importer, extractModuleSpecifiers(content, importer));
    };

    for (const [name, entry] of Object.entries(manifest?.components ?? {})) {
        for (const file of entry.files) {
            const importer = resolveInstalledFile(context, file);
            if (!seen.has(importer) && !excludedComponents.has(name)) await indexSource(importer);
            // 清单覆盖已安装文件的归属，扫描手写源码时跳过待移除或替换的旧内容。
            if (excludedComponents.has(name)) continue;
            seen.add(importer);
        }
    }
    for (const [name, entry] of Object.entries(manifest?.components ?? {})) {
        if (!excludedComponents.has(name)) continue;
        for (const file of entry.files) seen.add(resolveInstalledFile(context, file));
    }
    for (const [importer, { componentName, content }] of plannedSources) {
        if (isSource(importer)) indexImports(importGraph, componentName, importer, extractModuleSpecifiers(content, importer));
    }
    for (const file of await scanComponentFiles(context.cwd, context.fs)) {
        const importer = path.join(context.cwd, file);
        if (seen.has(importer) || excludedDirectories.some(dir => isInsideDirectory(importer, dir))) continue;
        await indexSource(importer);
    }
    const referenced = new Set<string>();
    while (candidates.size > 0 && importGraph.byComponent.size > 0) {
        const resolved = await findReferencedPaths(context, tsConfig, importGraph, candidates, plannedSources);
        importGraph.byComponent.clear();
        importGraph.byImporterFile.clear();
        // 被保留的共享文件也可能导入其他候选文件。
        for (const file of resolved) {
            referenced.add(file);
            candidates.delete(file);
            await indexSource(file);
        }
    }
    return referenced;
}

async function findManifestKnownFiles(
    context: ProjectContext,
    manifest: BrutxManifest | null,
    removedComponents: string[],
): Promise<string[]> {
    const candidateFiles: string[] = [];
    for (const component of removedComponents) {
        const entry = manifest?.components[component];
        if (!entry) continue;
        for (const manifestFile of entry.files) {
            const absolutePath = resolveInstalledFile(context, manifestFile);
            if (await context.isSafePath(absolutePath) && await context.fs.pathExists(absolutePath)) {
                candidateFiles.push(absolutePath);
            }
        }
    }
    return candidateFiles;
}

async function scanAllImports(componentsPath: string, fsAdapter: FileSystemAdapter): Promise<ImportGraph> {
    const graph: ImportGraph = { byComponent: new Map(), byImporterFile: new Map() };

    if (!await fsAdapter.pathExists(componentsPath)) {
        return graph;
    }

    async function scanDir(dir: string, componentName: string): Promise<void> {
        const entries = await fsAdapter.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await scanDir(fullPath, componentName);
                continue;
            }

            const ext = path.extname(entry.name);
            if (ext !== '.vue' && ext !== '.ts' && ext !== '.js') continue;

            const content = await fsAdapter.readFile(fullPath, 'utf-8');
            const specifiers = Array.from(content.matchAll(/from\s+['"]([^'"]+)['"]/g), match => match[1]);
            indexImports(graph, componentName, fullPath, specifiers);
        }
    }

    const dirs = await fsAdapter.readdir(componentsPath, { withFileTypes: true });
    for (const dir of dirs) {
        if (!dir.isDirectory()) continue;
        await scanDir(path.join(componentsPath, dir.name), dir.name);
    }

    return graph;
}

async function resolveScriptFile(baseDir: string, fileName: string, fsAdapter: FileSystemAdapter): Promise<string | null> {
    for (const ext of SCRIPT_EXTENSIONS) {
        const candidate = path.join(baseDir, fileName + ext);
        if (await fsAdapter.pathExists(candidate)) {
            return candidate;
        }
    }
    const noExtCandidate = path.join(baseDir, fileName);
    if (await fsAdapter.pathExists(noExtCandidate)) {
        return noExtCandidate;
    }
    return null;
}

async function findOrphanedFiles(
    context: ProjectContext,
    remainingComponents: string[],
    removedComponents: string[],
    importMap: Map<string, Set<string>>
): Promise<string[]> {
    const config = context.requireConfig();
    const composablesPath = await context.resolveAliasPath(config.aliases.composables);
    const utilsAlias = config.aliases.utils;
    const utilsDir = path.dirname(utilsAlias);
    const utilsPath = await context.resolveAliasPath(utilsDir);
    const localesPath = path.join(path.dirname(composablesPath), 'locales');
    const directivesPath = path.join(path.dirname(composablesPath), 'directives');

    const sharedBasePath = config.sharedBase
        ? await context.resolveAliasPath(config.sharedBase)
        : null;
    const sharedHooksPath = sharedBasePath ? path.join(sharedBasePath, 'hooks') : null;
    const sharedLibPath = sharedBasePath ? path.join(sharedBasePath, 'lib') : null;

    const orphaned: string[] = [];

    const tryResolve = async (basePath: string | null, specifier: string, aliasDir: string): Promise<string | null> => {
        if (!basePath || !await context.fs.pathExists(basePath)) return null;
        const relativePath = stripAliasPrefix(specifier, aliasDir);
        if (relativePath === null) return null;
        return resolveScriptFile(basePath, relativePath, context.fs);
    };

    for (const [importPath, importers] of importMap) {
        const wasOnlyUsedByRemoved = [...importers].every(c => removedComponents.includes(c));
        if (!wasOnlyUsedByRemoved) continue;

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
            if (!await context.isSafePath(resolvedPath)) continue;
            orphaned.push(resolvedPath);
        }
    }

    return [...new Set(orphaned)];
}

async function getDependents(
    context: ProjectContext,
    componentsToRemove: string[],
    manifest: BrutxManifest | null,
    useCache: boolean = true,
    importMap: Map<string, Set<string>> = new Map()
): Promise<{ dependents: Map<string, string[]>; failures: string[] }> {
    const dependents = new Map<string, string[]>();
    const failures = new Set<string>();
    const installed = await context.getInstalledComponentNames();
    const remaining = installed.filter(c => !componentsToRemove.includes(c));

    for (const name of componentsToRemove) {
        for (const other of remaining) {
            try {
                const configuredSources = resolveRegistrySources(context.requireConfig(), manifest?.components[other]?.registrySource);
                const effectiveSource = manifest?.components[other]?.registrySource ?? configuredSources[0];
                const otherItem: RegistryItem = await context.getRegistryClient().fetchItem(other, {
                    sourceOverride: effectiveSource,
                    useCache,
                });
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

    if (importMap.size > 0) {
        const removedSet = new Set(componentsToRemove);
        const componentsAliasDir = context.requireConfig().aliases.components.replace(/^@\//, '');
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
    context: ProjectContext,
    componentName: string,
    retainedPaths: ReadonlySet<string> = new Set(),
): Promise<number | null> {
    const componentPath = await context.resolveComponentDir(componentName);

    if (!await context.fs.pathExists(componentPath)) {
        return null;
    }

    return processComponentDirectory(componentPath, retainedPaths, context.fs);
}

async function countFilesRecursive(dir: string, fsAdapter: FileSystemAdapter): Promise<number> {
    const entries = await fsAdapter.readdir(dir, { withFileTypes: true });

    let count = 0;
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            count += await countFilesRecursive(fullPath, fsAdapter);
        } else if (entry.isFile()) {
            count++;
        }
    }
    return count;
}

async function getDirectoryEntries(directory: string, fs: FileSystemAdapter): Promise<Set<string>> {
    const entries = new Set<string>();
    if (!await fs.pathExists(directory)) return entries;

    async function collect(current: string): Promise<void> {
        entries.add(current);
        for (const entry of await fs.readdir(current, { withFileTypes: true })) {
            const target = path.join(current, entry.name);
            if (entry.isDirectory()) await collect(target);
            else entries.add(target);
        }
    }

    await collect(directory);
    return entries;
}

async function getOrphansWithoutCurrentReferences(
    context: ProjectContext,
    manifest: BrutxManifest | null,
    paths: readonly string[],
    removedNames: ReadonlySet<string>,
    removedDirectories: readonly string[],
): Promise<string[]> {
    const referenced = await findFilesReferencedByInstalledComponents(
        context, manifest, paths, removedNames, undefined, removedDirectories,
    );
    return paths.filter(file => !referenced.has(file));
}

export async function prepareRemoveComponents(
    context: ProjectContext,
    components: string[],
    manifest: BrutxManifest | null = null,
    useCache: boolean = true
): Promise<RemovePreparation> {
    manifest ??= await readManifest(context.cwd, context.fs);
    const installed = await context.getInstalledComponentNames();
    const toRemove = [...new Set(components.filter(c => installed.includes(c)))];
    const notFound = components.filter(c => !installed.includes(c));
    const remaining = installed.filter(c => !toRemove.includes(c));

    const confirmedComponents = await Promise.all(toRemove.map(async (name) => {
        const directory = await context.resolveComponentDir(name);
        const entries = await getDirectoryEntries(directory, context.fs).catch(() => null);
        const identity = getInstalledComponentIdentity(manifest?.components[name]);
        return [name, { identity, directory, entries }] as const;
    }));
    const removedComponentDirs = confirmedComponents.map(([, component]) => component.directory);
    const removedNames = new Set(toRemove);
    const remainingFiles = collectInstalledFilePaths(context, manifest, removedNames);

    const emptyImportGraph: ImportGraph = { byComponent: new Map(), byImporterFile: new Map() };
    const importGraph = toRemove.length > 0
        ? await scanAllImports(await context.resolveComponentsDir(), context.fs)
        : emptyImportGraph;
    const { dependents, failures: dependencyCheckFailures } = toRemove.length > 0
        ? await getDependents(context, toRemove, manifest, useCache, importGraph.byComponent)
        : { dependents: new Map<string, string[]>(), failures: [] as string[] };
    const orphanedFiles = toRemove.length > 0
        ? [
            ...new Set([
                ...await findOrphanedFiles(context, remaining, toRemove, importGraph.byComponent),
                ...await findManifestKnownFiles(context, manifest, toRemove),
            ]),
        ]
        : [];
    const candidates = orphanedFiles.filter(file => !remainingFiles.has(file)
        && !removedComponentDirs.some(dir => isInsideDirectory(file, dir)));
    const confirmedOrphans = await getOrphansWithoutCurrentReferences(context, manifest, candidates, removedNames, removedComponentDirs);

    return {
        installed,
        toRemove,
        notFound,
        remaining,
        dependents,
        dependencyCheckFailures,
        orphanedFiles: confirmedOrphans,
        confirmation: {
            components: new Map(confirmedComponents),
            retainedPaths: remainingFiles,
            orphanedFiles: new Set(confirmedOrphans),
        },
    };
}

export async function removeComponents(
    context: ProjectContext,
    componentsToRemove: string[],
    orphanedFiles: string[] = [],
    options: RemoveExecutionOptions = { removeOrphaned: true }
): Promise<RemoveExecutionResult> {
    const transaction = context.createTransaction();

    try {
        await transaction.lockProjectWrites();
        const manifest = await readManifest(context.cwd, context.fs);
        const removedNames = new Set(componentsToRemove);
        const componentDirs = await Promise.all([...removedNames].map(async name => {
            const directory = await context.resolveComponentDir(name);
            if (options.confirmation) {
                const confirmed = options.confirmation.components.get(name);
                const confirmedEntries = confirmed?.entries;
                const identity = getInstalledComponentIdentity(manifest?.components[name]);
                if (!confirmed || !confirmedEntries || !isDeepStrictEqual(confirmed.identity, identity)
                    || confirmed.directory !== directory
                    || [...await getDirectoryEntries(directory, context.fs)].some(entry => !confirmedEntries.has(entry))) {
                    throw new CliError(`Component "${name}" changed while removal was pending. Run remove again.`, { code: 'ACTION_CONFLICT' });
                }
            }
            return [name, directory] as const;
        }));
        const retainedPaths = collectInstalledFilePaths(context, manifest, removedNames);
        for (const file of options.confirmation?.retainedPaths ?? []) retainedPaths.add(file);
        const candidates: string[] = [];
        if (options.removeOrphaned) {
            for (const target of new Set(orphanedFiles.map(file => path.resolve(file)))) {
                if (options.confirmation && !options.confirmation.orphanedFiles.has(target)) continue;
                if (retainedPaths.has(target) || componentDirs.some(([, dir]) => isInsideDirectory(target, dir))) continue;
                if (await context.isSafePath(target) && await context.fs.pathExists(target)) candidates.push(target);
            }
        }
        const removableOrphans = await getOrphansWithoutCurrentReferences(
            context, manifest, candidates, removedNames, componentDirs.map(([, directory]) => directory),
        );
        const componentRemovalCounts = await awaitConcurrentResults(
            componentDirs.map(async ([comp, componentPath]) => {
                if (await context.fs.pathExists(componentPath)) {
                    const fileCount = await processComponentDirectory(componentPath, retainedPaths, context.fs, transaction);
                    options.onRemoveComponent?.(comp, fileCount);
                    return fileCount;
                }
                return 0;
            })
        );
        const totalRemoved = componentRemovalCounts.reduce((sum, count) => sum + count, 0);
        await awaitConcurrentResults(removableOrphans.map(file => transaction.remove(file)));

        await removeInstalledComponents(context.cwd, [...removedNames], { transaction }, context.fs);
        await transaction.commit();

        return {
            totalRemoved,
            orphanedRemoved: removableOrphans.length,
        };
    } catch (error) {
        const rollbackFailures = await transaction.rollback();
        return Promise.reject(Object.assign(error instanceof Error ? error : new Error(String(error)), {
            rollbackFailures,
        }));
    }
}

async function processComponentDirectory(
    directory: string,
    retainedPaths: ReadonlySet<string>,
    fs: FileSystemAdapter,
    transaction?: FileTransaction,
): Promise<number> {
    if (retainedPaths.has(directory)) return 0;
    if (![...retainedPaths].some(file => isInsideDirectory(file, directory))) {
        const fileCount = await countFilesRecursive(directory, fs);
        await transaction?.remove(directory);
        return fileCount;
    }

    let fileCount = 0;
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const target = path.join(directory, entry.name);
        if (retainedPaths.has(target)) continue;
        if (entry.isDirectory()) {
            fileCount += await processComponentDirectory(target, retainedPaths, fs, transaction);
        } else {
            await transaction?.remove(target);
            if (entry.isFile()) fileCount++;
        }
    }
    return fileCount;
}

async function awaitConcurrentResults<T>(tasks: Promise<T>[]): Promise<T[]> {
    let firstFailure: unknown;
    let hasFailed = false;
    const observedTasks = tasks.map((task) => task.catch((error: unknown) => {
        if (!hasFailed) {
            hasFailed = true;
            firstFailure = error;
        }
        throw error;
    }));
    const results = await Promise.allSettled(observedTasks);

    if (hasFailed) {
        throw firstFailure;
    }

    return results.map((result) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        throw result.reason;
    });
}

