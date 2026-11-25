import { isUtf8 } from 'node:buffer';
import path from 'node:path';
import {
    COMPONENT_METADATA,
    DEFAULT_LIB_EXCLUDE,
    type MergedRegistryEntry,
    type RegistryFile,
} from 'brutx-shared-vue';
import {
    createComponentModuleResolver,
    isComponentSourceDirectory,
    relativeModulePath,
} from 'brutx-shared-vue/scan';
import { toPosixPath } from 'brutx-shared-vue/path';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import { DiskFileSystemAdapter } from '../fs/disk-fs.js';
import {
    getModuleSpecifierPath,
    isModuleExtensionSubstitution,
    type ModuleResolution,
    type ModuleResolver,
} from 'brutx-shared-vue/module-resolver';
import type { AnalyzedModuleSource, RewrittenModuleSource } from './ast-rewriter.js';
import {
    analyzeModuleSource,
    assertKnownRegistryDeps,
    extractComponentFileDeps,
    extractDeps,
    extractRegistryDeps,
    getFileType,
    rewriteAnalyzedImports,
    resolveRewrittenSpecifier,
} from './ast-rewriter.js';
import { buildRegistryComponentIndex } from './public-index.js';
import type {
    ComponentIndexBuilder,
    CompilerPaths,
    PublicComponentProjection,
    RewriteContext,
} from './types.js';

export interface ResolvedComponentClosure {
    files: RegistryFile[];
    registryDependencies: string[];
}

const MODULE_SOURCE_PATTERN = /\.(?:vue|[cm]?[jt]sx?)$/u;

export async function readRegistryText(fs: FileSystemAdapter, filename: string, owner: string): Promise<string> {
    const source = await fs.readFile(filename, 'utf-8');
    let isRepresentable = Buffer.from(source, 'utf-8').toString('utf-8') === source;
    if (isRepresentable && source.includes('\uFFFD')) {
        const encoded = await fs.readFile(filename, 'base64');
        // 内存文件系统对字符串直接返回原文，对字节文件应用指定编码。
        isRepresentable = encoded === source || isUtf8(Buffer.from(encoded, 'base64'));
    }
    if (!isRepresentable) {
        throw new Error(`Registry item "${owner}" cannot deliver "${filename}" as lossless UTF-8 text`);
    }
    return source;
}

interface SourceGroup {
    context: RewriteContext;
    directory: string;
    deliveryPath: string;
    files: RegistryFile[];
}

interface DeliveryTarget {
    path: string;
    group?: SourceGroup;
    componentIndex?: boolean;
}

export class DependencyAnalysisSession {
    private readonly analyses = new Map<string, Map<string, AnalyzedModuleSource>>();
    private resolverPromise?: Promise<ModuleResolver>;

    constructor(
        private readonly moduleResolver?: ModuleResolver,
        private readonly createResolver?: () => Promise<ModuleResolver>,
    ) {}

    public async getModuleResolver(): Promise<ModuleResolver | undefined> {
        if (this.moduleResolver) return this.moduleResolver;
        this.resolverPromise ??= this.createResolver?.();
        return this.resolverPromise;
    }

    public analyze(source: string, filename: string): AnalyzedModuleSource {
        let bySource: Map<string, AnalyzedModuleSource> | undefined = this.analyses.get(filename);
        if (!bySource) {
            bySource = new Map<string, AnalyzedModuleSource>();
            this.analyses.set(filename, bySource);
        }

        const cached: AnalyzedModuleSource | undefined = bySource.get(source);
        if (cached) return cached;

        const analyzed: AnalyzedModuleSource = this.moduleResolver
            ? {
                source,
                filename,
                analysis: this.moduleResolver.analyze(source, filename).analysis,
            }
            : analyzeModuleSource(source, filename);
        bySource.set(source, analyzed);
        return analyzed;
    }
}

export class DependencyResolver {
    constructor(
        private fs: FileSystemAdapter,
        private paths: CompilerPaths,
        private libExclude: ReadonlySet<string> = DEFAULT_LIB_EXCLUDE,
        private componentIndexBuilder?: ComponentIndexBuilder,
        private moduleResolver?: ModuleResolver,
        private getPublicProjection?: (name: string) => PublicComponentProjection | undefined,
    ) {}

    public createAnalysisSession(): DependencyAnalysisSession {
        return new DependencyAnalysisSession(this.moduleResolver, async () => {
            if (this.fs instanceof DiskFileSystemAdapter) return createComponentModuleResolver(this.paths);

            const files = new Set<string>();
            const scan = async (directory: string): Promise<void> => {
                if (!(await this.fs.pathExists(directory))) return;
                for (const entry of await this.fs.readdir(directory, { withFileTypes: true })) {
                    const filename = path.resolve(directory, entry.name);
                    if (entry.isDirectory() && isComponentSourceDirectory(entry.name)) {
                        await scan(filename);
                    } else if (entry.isFile()) {
                        files.add(toPosixPath(filename));
                    }
                }
            };
            const { componentsDir, composablesDir, directivesDir, libDir, localesDir, typesDir } = this.paths;
            await Promise.all([componentsDir, composablesDir, directivesDir, libDir, localesDir, typesDir]
                .filter((directory): directory is string => Boolean(directory))
                .map(scan));
            return createComponentModuleResolver(this.paths, filename => files.has(filename));
        });
    }

    private resolveSourcePath(
        directory: string,
        name: string,
        moduleResolver?: ModuleResolver,
    ): string {
        return moduleResolver?.resolve(path.resolve(directory, 'index.ts'), `./${name}`).resolvedPath
            ?? path.resolve(directory, name);
    }

    private async assertPublicProjectionSources(
        componentName: string,
        projection: PublicComponentProjection,
        moduleResolver: ModuleResolver | undefined,
    ): Promise<void> {
        const componentDir = path.join(this.paths.componentsDir, componentName);
        for (const item of projection.exports) {
            const source = item.source.split(/[?#]/)[0];
            let baseDir: string;
            let relativeSource: string;
            if (source.startsWith('./')) {
                baseDir = componentDir;
                relativeSource = source.slice(2);
            } else if (/^(?:\.\.\/)+types\//u.test(source)) {
                if (!this.paths.typesDir) {
                    throw new Error(`Types directory is required for public projection of "${componentName}"`);
                }
                baseDir = this.paths.typesDir;
                relativeSource = source.replace(/^(?:\.\.\/)+types\//u, '');
            } else if (/^(?:\.\.\/)+directives\//u.test(source)) {
                baseDir = this.paths.directivesDir;
                relativeSource = source.replace(/^(?:\.\.\/)+directives\//u, '');
            } else if (/^@\/types\//u.test(source)) {
                if (!this.paths.typesDir) {
                    throw new Error(`Types directory is required for public projection of "${componentName}"`);
                }
                baseDir = this.paths.typesDir;
                relativeSource = source.replace(/^@\/types\//u, '');
            } else if (/^@\/directives\//u.test(source)) {
                baseDir = this.paths.directivesDir;
                relativeSource = source.replace(/^@\/directives\//u, '');
            } else {
                throw new Error(
                    `Unsupported public projection source "${item.source}" for Registry component "${componentName}"`,
                );
            }

            const resolvedPath = this.resolveSourcePath(baseDir, relativeSource, moduleResolver);
            if (!relativeModulePath(baseDir, resolvedPath)) {
                throw new Error(
                    `Public projection source escapes its source directory: "${item.source}" for Registry component "${componentName}"`,
                );
            }
            let isFile: boolean;
            try {
                isFile = (await this.fs.stat(resolvedPath)).isFile();
            } catch {
                isFile = false;
            }
            if (!isFile) {
                throw new Error(
                    `Public projection source not found at ${resolvedPath} for Registry component "${componentName}"`,
                );
            }
        }
    }

    private getGroups(componentName: string): SourceGroup[] {
        const paths = this.paths;
        const groups: SourceGroup[] = [
            { context: 'component', directory: path.join(paths.componentsDir, componentName), deliveryPath: `components/ui/${componentName}`, files: [] },
            { context: 'composable', directory: paths.composablesDir, deliveryPath: 'composables', files: [] },
        ];
        if (paths.typesDir) {
            groups.push({ context: 'types', directory: paths.typesDir, deliveryPath: 'types', files: [] });
        }
        groups.push(
            { context: 'directive', directory: paths.directivesDir, deliveryPath: 'directives', files: [] },
            { context: 'locale', directory: paths.localesDir, deliveryPath: 'locales', files: [] },
            { context: 'lib', directory: paths.libDir, deliveryPath: 'lib', files: [] },
        );
        return groups;
    }

    private toDeliverySpecifier(
        specifier: string,
        target: DeliveryTarget,
    ): string {
        const sourcePath = getModuleSpecifierPath(specifier);
        const suffix = specifier.slice(sourcePath.length);
        const sourceExtension = path.extname(sourcePath);
        const resolvedExtension = path.posix.extname(target.path);
        if (target.componentIndex && path.basename(sourcePath, sourceExtension) !== 'index') {
            return `@/${path.posix.dirname(target.path)}${suffix}`;
        }

        const stem = resolvedExtension ? target.path.slice(0, -resolvedExtension.length) : target.path;
        const omitTypeScriptExtension = /^\.tsx?$/u.test(resolvedExtension)
            && (path.basename(sourcePath) === path.posix.basename(stem) || (!sourceExtension && !path.posix.extname(stem)));
        if (omitTypeScriptExtension) return `@/${stem}${suffix}`;
        if (isModuleExtensionSubstitution(sourceExtension, resolvedExtension)) {
            return `@/${stem}${sourceExtension}${suffix}`;
        }
        return `@/${target.path}${suffix}`;
    }

    private getDeliveryTarget(
        resolvedPath: string,
        groups: readonly SourceGroup[],
        knownComponents?: ReadonlySet<string>,
    ): DeliveryTarget | undefined {
        const group = groups.find(candidate => relativeModulePath(candidate.directory, resolvedPath));
        const componentPath = relativeModulePath(this.paths.componentsDir, resolvedPath);
        const componentName = componentPath?.split('/')[0];
        const isKnown = componentName && (knownComponents?.has(componentName) ?? Boolean(COMPONENT_METADATA[componentName]));
        if (componentPath?.includes('/') && (!group || group.context === 'component' || isKnown)) {
            return {
                path: `components/ui/${componentPath}`,
                group: group?.context === 'component' ? group : undefined,
                componentIndex: /^[^/]+\/index\.ts$/u.test(componentPath),
            };
        }
        if (!group) return undefined;
        return { path: `${group.deliveryPath}/${relativeModulePath(group.directory, resolvedPath)}`, group };
    }

    private getGeneratedIndexPath(
        resolution: ModuleResolution | undefined,
        owner: string,
        knownComponents?: ReadonlySet<string>,
    ): string | undefined {
        if (resolution?.kind !== 'unresolved') return undefined;
        const missing = resolution.diagnostics.find(diagnostic => diagnostic.code === 'MODULE_NOT_FOUND');
        return missing?.candidates?.find(filename => {
            const target = relativeModulePath(this.paths.componentsDir, filename);
            const componentName = target && /^([^/]+)\/index\.ts$/u.exec(target)?.[1];
            if (!componentName) return false;
            return componentName === owner || (
                (knownComponents?.has(componentName) ?? true) && Boolean(this.getPublicProjection?.(componentName))
            );
        });
    }

    private async rewriteSource(
        source: string,
        filename: string,
        group: SourceGroup,
        componentName: string,
        groups: readonly SourceGroup[],
        knownComponents: Set<string> | undefined,
        session: DependencyAnalysisSession,
    ): Promise<RewrittenModuleSource> {
        if (!MODULE_SOURCE_PATTERN.test(filename)) {
            return { code: source, filename, dependencies: [] };
        }
        const analyzed = session.analyze(source, filename);
        const moduleResolver = await session.getModuleResolver();
        const strictResolution = Boolean(this.moduleResolver) || this.fs instanceof DiskFileSystemAdapter;
        if (strictResolution && analyzed.analysis.completeness === 'invalid') {
            const details = analyzed.analysis.diagnostics.map(diagnostic => diagnostic.message).join('; ');
            throw new Error(`Failed to parse module references in "${filename}": ${details}`);
        }

        const rewrittenSpecifiers = new Map<string, string>();
        const resolvedReferences: NonNullable<RewrittenModuleSource['resolvedReferences']>[number][] = [];
        for (const { specifier } of analyzed.analysis.dependencies) {
            const resolution = moduleResolver?.resolve(filename, specifier);
            const resolvedPath = resolution?.kind === 'internal'
                ? resolution.resolvedPath
                : this.getGeneratedIndexPath(resolution, componentName, knownComponents);
            if (resolvedPath) {
                const target = this.getDeliveryTarget(resolvedPath, groups, knownComponents);
                const rewrittenSpecifier = target ? this.toDeliverySpecifier(specifier, target) : specifier;
                rewrittenSpecifiers.set(specifier, rewrittenSpecifier);
                resolvedReferences.push({ specifier: rewrittenSpecifier, resolvedPath });
                continue;
            }
            if (strictResolution && resolution && resolution.kind !== 'external' && /^(?:\.|\/|@\/)/u.test(specifier)) {
                const details = resolution.diagnostics.map(diagnostic => diagnostic.message).join('; ');
                throw new Error(`Unable to resolve module "${specifier}" from "${filename}": ${details}`);
            }
            const rewrittenSpecifier = resolveRewrittenSpecifier(specifier, componentName, group.context, knownComponents);
            rewrittenSpecifiers.set(specifier, rewrittenSpecifier);
            resolvedReferences.push({ specifier: rewrittenSpecifier });
        }

        return {
            ...rewriteAnalyzedImports(analyzed, componentName, group.context, knownComponents, rewrittenSpecifiers),
            resolvedReferences,
        };
    }

    public async resolveComponentClosure(
        name: string,
        componentInfo: MergedRegistryEntry,
        knownComponents?: Set<string>,
        publicProjection?: PublicComponentProjection,
        session: DependencyAnalysisSession = this.createAnalysisSession(),
    ): Promise<ResolvedComponentClosure> {
        if (!publicProjection) {
            throw new Error(`Public component projection is required for Registry component "${name}"`);
        }

        const moduleResolver = await session.getModuleResolver();
        await this.assertPublicProjectionSources(name, publicProjection, moduleResolver);
        const groups = this.getGroups(name);
        const componentGroup = groups[0];
        const registryDependencies = new Set<string>();
        const queuedFiles = new Set<string>();
        const pending: { group: SourceGroup; filename: string }[] = [];

        const enqueue = (group: SourceGroup, filename: string): void => {
            if (queuedFiles.has(filename)) return;
            queuedFiles.add(filename);
            pending.push({ group, filename });
        };

        const addDependencies = (rewritten: RewrittenModuleSource): void => {
            assertKnownRegistryDeps(rewritten, name, path.basename(rewritten.filename), knownComponents);
            for (const dependency of extractRegistryDeps(rewritten, name, knownComponents)) {
                registryDependencies.add(dependency);
            }

            for (const reference of rewritten.resolvedReferences ?? []) {
                const filename = reference.resolvedPath;
                if (!filename) continue;
                const sourceGroup = this.getDeliveryTarget(filename, groups, knownComponents)?.group;
                if (sourceGroup) enqueue(sourceGroup, filename);
            }

            const unresolved = {
                ...rewritten,
                dependencies: rewritten.dependencies.filter(dependency =>
                    rewritten.resolvedReferences?.some(reference =>
                        reference.specifier === dependency.specifier && !reference.resolvedPath,
                    ),
                ),
            };
            for (const group of groups) {
                const names = group.context === 'component'
                    ? extractComponentFileDeps(unresolved, name)
                    : extractDeps(unresolved, group.deliveryPath);
                for (const filename of names) {
                    enqueue(group, this.resolveSourcePath(group.directory, filename, moduleResolver));
                }
            }
        };

        const seededFiles = {
            component: componentInfo.files,
            composable: componentInfo.composables,
            directive: componentInfo.directives,
            lib: componentInfo.lib?.filter(filename => !this.libExclude.has(filename)),
            locale: [],
            types: [],
        };
        const indexFilename = path.resolve(componentGroup.directory, 'index.ts');
        queuedFiles.add(toPosixPath(indexFilename));
        for (const group of groups) {
            for (const file of seededFiles[group.context] ?? []) {
                const filename = this.resolveSourcePath(group.directory, file, moduleResolver);
                const target = this.getDeliveryTarget(filename, groups, knownComponents);
                if (target?.group || !target) enqueue(target?.group ?? group, filename);
            }
        }

        const index = await this.rewriteSource(
            buildRegistryComponentIndex(publicProjection, this.componentIndexBuilder),
            indexFilename,
            componentGroup,
            name,
            groups,
            knownComponents,
            session,
        );
        addDependencies(index);

        for (const { group, filename } of pending) {
            const relativePath = relativeModulePath(group.directory, filename);
            if (!relativePath) throw new Error(`Source file is outside of its directory: ${filename}`);
            if (group.context === 'locale') registryDependencies.add('locale-zh-cn');

            const exists = await this.fs.pathExists(filename);
            if (!exists) {
                if (group.context === 'locale') continue;
                const label = {
                    component: 'Source',
                    composable: 'Composable',
                    directive: 'Directive',
                    lib: 'Lib',
                    types: 'Type',
                }[group.context];
                throw new Error(`${label} file not found at ${filename}`);
            }

            const raw = await readRegistryText(this.fs, filename, name);
            const source = MODULE_SOURCE_PATTERN.test(filename) ? raw.replace(/\r\n/g, '\n') : raw;
            const rewritten = await this.rewriteSource(source, filename, group, name, groups, knownComponents, session);
            addDependencies(rewritten);

            if (group.context === 'locale' || (group.context === 'lib' && this.libExclude.has(relativePath))) continue;
            const deliveryPath = `${group.deliveryPath}/${relativePath}`;
            group.files.push({ path: deliveryPath, content: rewritten.code, type: getFileType(deliveryPath) });
        }

        const indexPath = `${componentGroup.deliveryPath}/index.ts`;
        componentGroup.files.push({ path: indexPath, content: index.code, type: getFileType(indexPath) });
        return {
            files: groups.flatMap(group => group.files),
            registryDependencies: Array.from(registryDependencies).sort(),
        };
    }
}
