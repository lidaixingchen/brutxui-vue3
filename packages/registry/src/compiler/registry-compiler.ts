import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    COMPONENT_METADATA,
    CSS_VARS,
    DEFAULT_LIB_EXCLUDE,
    computeRegistryIntegrity,
    computeRegistryManifestIntegrity,
    type ComponentMetadataEntry,
    type MergedRegistryEntry,
    type RegistryFile,
    type RegistryIndex,
    type RegistryIndexItem,
    type RegistryItem,
    type RegistryManifest,
} from 'brutx-shared-vue';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import { DiskFileSystemAdapter } from '../fs/disk-fs.js';
import { rewriteImports } from './ast-rewriter.js';
import { DependencyResolver } from './dependency-resolver.js';
import { CACHE_VERSION, CacheManager, computeInputDigest } from './cache-manager.js';
import type {
    CompiledItemResult,
    CompiledRegistryResult,
    CompilerOptions,
    CompilerPaths,
    RegistryBuildManifest,
    RegistryBuildManifestOptions,
    RegistrySbom,
    SbomComponent,
    ComponentIndexBuilder,
    PublicComponentProjection,
    PublicComponentProjectionSet,
} from './types.js';
import type { ModuleResolver } from 'brutx-shared-vue/module-resolver';

function isComponentProjection(
    value: PublicComponentProjectionSet,
): value is PublicComponentProjection {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
        && 'componentId' in value
        && typeof value.componentId === 'string'
        && Array.isArray(value.exports);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_TAILWIND_CONFIG: Record<string, unknown> = {};

const DEFAULT_PATHS: CompilerPaths = {
    componentsDir: path.resolve(__dirname, '../../../ui/src/components'),
    composablesDir: path.resolve(__dirname, '../../../ui/src/composables'),
    localesDir: path.resolve(__dirname, '../../../ui/src/locales'),
    libDir: path.resolve(__dirname, '../../../ui/src/lib'),
    directivesDir: path.resolve(__dirname, '../../../ui/src/directives'),
    typesDir: path.resolve(__dirname, '../../../ui/src/types'),
    manifestPath: path.resolve(__dirname, '../../../ui/registry-manifest.json'),
    outputDir: path.resolve(__dirname, '../../registry'),
    apiContractPath: path.resolve(__dirname, '../../../ui/api-contract.ts'),
};

const REGISTRY_MANIFEST_SCHEMA_URL = 'https://lidaixingchen.github.io/brutxui-vue3/registry-manifest.schema.json';
const REGISTRY_SCHEMA_VERSION = 1;
const SBOM_SPEC_VERSION = '1.5';
const SBOM_FORMAT = 'CycloneDX';

export class RegistryCompiler {
    private fs: FileSystemAdapter;
    private paths: CompilerPaths;
    private tailwindConfig: Record<string, unknown>;
    private cssVars: Record<string, string>;
    private libExclude: ReadonlySet<string>;
    private metadata: Record<string, ComponentMetadataEntry>;
    private dependencyResolver: DependencyResolver;
    private cacheManager: CacheManager;
    private registryVersion?: string;
    private releaseTag?: string;
    private gitCommit?: string | null;
    private publicProjection?: PublicComponentProjectionSet;
    private publicProjectionDigest: string;
    private componentIndexBuilder?: ComponentIndexBuilder;
    private moduleResolver?: ModuleResolver;
    private manifestDigest: string | null = null;
    private manifestOverride?: CompilerOptions['manifestOverrides'];
    private validateManifestFreshness: boolean;
    private configuredManifest?: RegistryManifest;

    constructor(options: CompilerOptions = {}) {
        this.fs = options.fs ?? new DiskFileSystemAdapter();
        this.paths = { ...DEFAULT_PATHS, ...(options.paths ?? {}) };
        this.tailwindConfig = options.tailwindConfig ?? DEFAULT_TAILWIND_CONFIG;
        this.cssVars = options.cssVars ?? (CSS_VARS as unknown as Record<string, string>);
        this.libExclude = options.libExclude ?? DEFAULT_LIB_EXCLUDE;
        this.metadata = options.metadata ?? COMPONENT_METADATA;
        this.registryVersion = options.registryVersion;
        this.releaseTag = options.releaseTag;
        this.gitCommit = options.gitCommit;
        this.publicProjection = options.publicProjection;
        this.publicProjectionDigest = options.publicProjectionDigest
            ?? computeInputDigest(options.publicProjection ?? null);
        this.componentIndexBuilder = options.componentIndexBuilder;
        this.moduleResolver = options.moduleResolver;
        this.manifestOverride = options.manifestOverrides;
        this.validateManifestFreshness = options.validateManifestFreshness ?? true;
        this.configuredManifest = options.manifest;

        this.dependencyResolver = new DependencyResolver(
            this.fs,
            this.paths,
            this.libExclude,
            this.componentIndexBuilder,
            this.moduleResolver,
        );
        const cacheFilePath = path.join(path.dirname(this.paths.outputDir), '.registry-cache.json');
        this.cacheManager = new CacheManager(this.fs, cacheFilePath);
    }

    public getMetadata(): Record<string, ComponentMetadataEntry> {
        return this.metadata;
    }

    private async listComponentSourceFiles(componentDir: string, relativeDir = ''): Promise<string[]> {
        if (!(await this.fs.pathExists(componentDir))) return [];

        const entries = await this.fs.readdir(componentDir, { withFileTypes: true });
        const files: string[] = [];
        for (const entry of entries) {
            const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
            const absolutePath = path.join(componentDir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
                files.push(...await this.listComponentSourceFiles(absolutePath, relativePath));
                continue;
            }

            if (!entry.isFile()) continue;
            if (entry.name === 'index.ts' || /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(entry.name)) continue;
            if (/\.(vue|ts|css)$/.test(entry.name)) files.push(relativePath.replace(/\\/g, '/'));
        }
        return files.sort();
    }

    private async assertManifestFresh(manifest: RegistryManifest): Promise<void> {
        const componentsDir = this.paths.componentsDir;
        if (!(await this.fs.pathExists(componentsDir))) {
            throw new Error(`Components directory not found: ${componentsDir}`);
        }

        const entries = await this.fs.readdir(componentsDir, { withFileTypes: true });
        const sourceComponents = entries
            .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
            .map(entry => entry.name)
            .sort();
        const problems: string[] = [];

        for (const name of sourceComponents) {
            const manifestEntry = manifest[name];
            if (!manifestEntry) {
                problems.push(`component ${name} is missing from registry-manifest.json`);
                continue;
            }

            const sourceFiles = await this.listComponentSourceFiles(path.join(componentsDir, name));
            const manifestFiles = [...manifestEntry.files].map(file => file.replace(/\\/g, '/')).sort();
            const sourceSet = new Set(sourceFiles);
            const manifestSet = new Set(manifestFiles);
            for (const file of sourceFiles) {
                if (!manifestSet.has(file)) problems.push(`component ${name} is missing file ${file}`);
            }
            for (const file of manifestFiles) {
                if (!sourceSet.has(file)) problems.push(`component ${name} lists missing file ${file}`);
            }

            const referencedFiles: ReadonlyArray<readonly [string, string, string]> = [
                ...manifestEntry.composables.map(file => [this.paths.composablesDir, file, 'composable'] as const),
                ...manifestEntry.directives.map(file => [this.paths.directivesDir, file, 'directive'] as const),
                ...manifestEntry.lib.map(file => [this.paths.libDir, file, 'lib'] as const),
            ];
            for (const [baseDir, file, kind] of referencedFiles) {
                const candidate = path.extname(file) ? file : `${file}.ts`;
                if (!(await this.fs.pathExists(path.join(baseDir, candidate)))) {
                    problems.push(`component ${name} references missing ${kind} ${file}`);
                }
            }

        }
        for (const name of Object.keys(manifest)) {
            if (!sourceComponents.includes(name)) {
                problems.push(`registry-manifest.json contains missing component ${name}`);
            }
        }

        if (problems.length > 0) {
            throw new Error(
                `registry-manifest.json is stale; run pnpm --filter brutx-ui-vue generate:\n${problems
                    .map(problem => `  - ${problem}`)
                    .join('\n')}`
            );
        }
    }

    private getComponentProjection(name: string): PublicComponentProjection | undefined {
        const projection = this.publicProjection;
        if (!projection) return undefined;
        if (isComponentProjection(projection)) {
            return projection.componentId === name ? projection : undefined;
        }
        return projection[name];
    }

    private async computeItemSourceHash(
        name: string,
        fileMapping: { files: string[]; composables?: string[]; directives?: string[] },
        componentInfo: MergedRegistryEntry,
        closure: Awaited<ReturnType<DependencyResolver['resolveComponentClosure']>>,
    ): Promise<string> {
        return this.cacheManager.computeSourceHash(
            name,
            fileMapping,
            componentInfo,
            this.tailwindConfig,
            this.cssVars,
            this.paths,
            this.libExclude,
            {
                closure,
                knownComponents: new Set(Object.keys(this.metadata)),
                publicProjection: this.getComponentProjection(name),
                publicProjectionDigest: this.publicProjectionDigest,
                manifestDigest: this.manifestDigest ?? undefined,
                componentIndexBuilder: this.componentIndexBuilder,
                moduleResolver: this.moduleResolver,
            },
        );
    }

    public async computeSourceHash(
        name: string,
        fileMapping: { files: string[]; composables?: string[]; directives?: string[] },
        mergedRegistry?: Record<string, MergedRegistryEntry>,
    ): Promise<string> {
        const registry = mergedRegistry ?? await this.loadMergedRegistry();
        if (this.manifestDigest === null) await this.loadMergedRegistry();
        const componentInfo = registry[name];
        if (!componentInfo) throw new Error(`No file mapping found for component "${name}"`);
        const normalizedFileMapping = {
            files: [...fileMapping.files],
            composables: fileMapping.composables ? [...fileMapping.composables] : undefined,
            directives: fileMapping.directives ? [...fileMapping.directives] : undefined,
        };
        const closure = await this.dependencyResolver.resolveComponentClosure(
            name,
            {
                ...componentInfo,
                files: normalizedFileMapping.files,
                composables: normalizedFileMapping.composables ?? componentInfo.composables,
                directives: normalizedFileMapping.directives ?? componentInfo.directives,
            },
            new Set(Object.keys(registry)),
            this.getComponentProjection(name),
        );
        return this.computeItemSourceHash(name, normalizedFileMapping, componentInfo, closure);
    }

    public async loadMergedRegistry(): Promise<Record<string, MergedRegistryEntry>> {
        let manifest: RegistryManifest;
        if (this.configuredManifest) {
            manifest = this.configuredManifest;
            this.manifestDigest = computeInputDigest(manifest);
        } else {
            let manifestRaw: string;
            try {
                manifestRaw = await this.fs.readFile(this.paths.manifestPath, 'utf-8');
            } catch (error) {
                const cause = error instanceof Error ? error.message : String(error);
                throw new Error(
                    `Failed to read registry-manifest.json (${cause}). ` +
                    `Run pnpm --filter brutx-ui-vue generate first to generate the UI registry manifest.`,
                    { cause: error }
                );
            }

            try {
                manifest = JSON.parse(manifestRaw) as RegistryManifest;
                this.manifestDigest = computeInputDigest(manifest);
            } catch (error) {
                const cause = error instanceof Error ? error.message : String(error);
                throw new Error(
                    `Failed to parse registry-manifest.json (${cause}). ` +
                    `Run pnpm --filter brutx-ui-vue generate first to regenerate the file.`,
                    { cause: error }
                );
            }
        }

        if (this.validateManifestFreshness) {
            await this.assertManifestFresh(manifest);
        }
        const merged: Record<string, MergedRegistryEntry> = {};

        for (const [name, meta] of Object.entries(this.metadata)) {
            const fileManifest = manifest[name];
            if (!fileManifest) {
                throw new Error(`Component "${name}" has metadata but is missing from registry-manifest.json. Run pnpm --filter brutx-ui-vue prebuild:scan.`);
            }
            const override = this.manifestOverride?.[name];
            merged[name] = {
                ...meta,
                files: [...fileManifest.files],
                composables: [...fileManifest.composables],
                directives: [...fileManifest.directives],
                lib: [...fileManifest.lib],
                ...override,
            };
        }

        for (const name of Object.keys(manifest)) {
            if (!this.metadata[name]) {
                throw new Error(`Component "${name}" is in registry-manifest.json but has no metadata in COMPONENT_METADATA. Add an entry in packages/shared/src/components.ts.`);
            }
        }

        return merged;
    }

    public async compileItem(
        name: string,
        mergedRegistry?: Record<string, MergedRegistryEntry>
    ): Promise<CompiledItemResult> {
        const startTime = Date.now();
        const registry = mergedRegistry ?? (await this.loadMergedRegistry());
        const componentInfo = registry[name];
        if (!componentInfo) {
            throw new Error(`No file mapping found for component "${name}"`);
        }

        const knownComponents = new Set(Object.keys(registry));
        const publicProjection = this.getComponentProjection(name);
        const closure = await this.dependencyResolver.resolveComponentClosure(
            name,
            componentInfo,
            knownComponents,
            publicProjection,
        );
        const { files, registryDependencies } = closure;

        const integrity = computeRegistryIntegrity(files);

        const item: RegistryItem = {
            $schema: 'https://ui.shadcn.com/schema/registry-item.json',
            name,
            type: 'registry:ui',
            title: componentInfo.title,
            description: componentInfo.description,
            category: componentInfo.category,
            examples: [...(componentInfo.examples ?? [])],
            status: componentInfo.status,
            replacement: componentInfo.replacement,
            dependencies: [...(componentInfo.dependencies ?? [])],
            registryDependencies,
            files,
            tailwind: this.tailwindConfig,
            cssVars: this.cssVars,
            integrity,
        };

        const sourceHash = await this.computeItemSourceHash(
            name,
            {
                files: componentInfo.files,
                composables: componentInfo.composables,
                directives: componentInfo.directives,
            },
            componentInfo,
            closure,
        );

        const durationMs = Date.now() - startTime;
        return {
            name,
            item,
            sourceHash,
            cached: false,
            durationMs,
        };
    }

    public async compileLocaleZhCn(): Promise<CompiledItemResult> {
        const startTime = Date.now();
        const localeFiles: RegistryFile[] = [];
        const localeHashParts: string[] = [];

        if (await this.fs.pathExists(this.paths.localesDir)) {
            const dirents = await this.fs.readdir(this.paths.localesDir, { withFileTypes: true });
            const tsFiles = dirents
                .filter(d => d.isFile() && d.name.endsWith('.ts') && !d.name.endsWith('.test.ts'))
                .map(d => d.name)
                .sort();

            const contents = await Promise.all(
                tsFiles.map(localeFile =>
                    this.fs.readFile(path.join(this.paths.localesDir, localeFile), 'utf-8')
                )
            );

            tsFiles.forEach((localeFile, idx) => {
                const raw = contents[idx] ?? '';
                const code = rewriteImports(raw.replace(/\r\n/g, '\n'), 'locale-zh-cn', 'locale');
                localeFiles.push({
                    path: `locales/${localeFile}`,
                    content: code,
                    type: 'registry:lib',
                });
                localeHashParts.push(code);
            });
        }

        const localeHash = crypto.createHash('sha256').update(computeInputDigest({
                cacheVersion: CACHE_VERSION,
                tailwind: this.tailwindConfig,
                cssVars: this.cssVars,
                manifestDigest: this.manifestDigest,
                files: localeHashParts,
            })).digest('hex');

        const localeIntegrity = computeRegistryIntegrity(localeFiles);

        const item: RegistryItem = {
            $schema: 'https://ui.shadcn.com/schema/registry-item.json',
            name: 'locale-zh-cn',
            type: 'registry:lib',
            title: 'Locale Zh CN',
            description: 'Chinese (Simplified) locale data files for BrutxUI components.',
            dependencies: [],
            registryDependencies: [],
            files: localeFiles,
            tailwind: this.tailwindConfig,
            cssVars: this.cssVars,
            integrity: localeIntegrity,
        };

        const durationMs = Date.now() - startTime;
        return {
            name: 'locale-zh-cn',
            item,
            sourceHash: localeHash,
            cached: false,
            durationMs,
        };
    }

    public async compileAll(options: { forceRebuild?: boolean } = {}): Promise<CompiledRegistryResult> {
        const totalStartTime = Date.now();
        const mergedRegistry = await this.loadMergedRegistry();
        const componentNames = Object.keys(mergedRegistry).sort();
        const previousCache = options.forceRebuild ? {} : await this.cacheManager.loadCache();

        const itemsMap = new Map<string, RegistryItem>();
        const itemResults: CompiledItemResult[] = [];
        const cacheRecord: Record<string, string> = {};

        const indexItems: RegistryIndexItem[] = [];

        // 1. 编译各组件
        for (const name of componentNames) {
            const compiled = await this.compileItem(name, mergedRegistry);
            const res: CompiledItemResult = {
                ...compiled,
                cached: previousCache[name] === compiled.sourceHash,
            };
            itemsMap.set(name, res.item);
            itemResults.push(res);
            cacheRecord[name] = res.sourceHash;

            indexItems.push({
                name: res.item.name,
                type: res.item.type,
                title: res.item.title,
                description: res.item.description,
                category: res.item.category,
                examples: res.item.examples,
                status: res.item.status,
                replacement: res.item.replacement,
                dependencies: res.item.dependencies,
                registryDependencies: res.item.registryDependencies,
                files: res.item.files.map(f => ({ path: f.path, type: f.type })),
                tailwind: this.tailwindConfig,
                cssVars: this.cssVars,
                integrity: res.item.integrity,
            });
        }

        // 2. 编译 locale-zh-cn
        const compiledLocale = await this.compileLocaleZhCn();
        const localeRes: CompiledItemResult = {
            ...compiledLocale,
            cached: previousCache[compiledLocale.name] === compiledLocale.sourceHash,
        };
        itemsMap.set(localeRes.name, localeRes.item);
        itemResults.push(localeRes);
        cacheRecord[localeRes.name] = localeRes.sourceHash;

        indexItems.push({
            name: localeRes.item.name,
            type: localeRes.item.type,
            title: localeRes.item.title,
            description: localeRes.item.description,
            dependencies: localeRes.item.dependencies,
            registryDependencies: localeRes.item.registryDependencies,
            files: localeRes.item.files.map(f => ({ path: f.path, type: f.type })),
            tailwind: this.tailwindConfig,
            cssVars: this.cssVars,
            integrity: localeRes.item.integrity,
        });

        const resolvedVersion = await this.resolveVersion();
        const resolvedReleaseTag = this.resolveReleaseTag(resolvedVersion);
        const resolvedGitCommit = this.resolveGitCommit();

        // 3. 构建 RegistryIndex
        const index: RegistryIndex = {
            $schema: 'https://ui.shadcn.com/schema/registry.json',
            name: 'brutx-ui-vue',
            schemaVersion: REGISTRY_SCHEMA_VERSION,
            registryVersion: resolvedVersion,
            homepage: 'https://github.com/lidaixingchen/brutxui-vue3',
            items: indexItems,
        };

        // 4. 构建 RegistryBuildManifest
        const manifest = this.buildManifest(index, {
            registryVersion: resolvedVersion,
            schemaVersion: index.schemaVersion,
            releaseTag: resolvedReleaseTag,
            buildTimestamp: null,
            gitCommit: resolvedGitCommit,
        });

        // 5. 构建 SBOM
        const sbom = this.buildSbom(index, manifest.integrity);

        const totalDurationMs = Date.now() - totalStartTime;

        return {
            index,
            manifest,
            sbom,
            items: itemsMap,
            itemResults,
            cacheRecord,
            totalDurationMs,
        };
    }

    private async resolveVersion(): Promise<string> {
        if (this.registryVersion) return this.registryVersion;
        if (process.env.BRUTX_UI_VERSION) return process.env.BRUTX_UI_VERSION.trim();
        try {
            const uiPkgPath = path.resolve(path.dirname(this.paths.manifestPath), 'package.json');
            const pkgRaw = await this.fs.readFile(uiPkgPath, 'utf-8');
            const pkg = JSON.parse(pkgRaw) as { version?: string };
            if (pkg.version) return pkg.version;
        } catch {
            // fallback
        }
        return '0.1.0';
    }

    private resolveReleaseTag(version: string): string {
        if (this.releaseTag) return this.releaseTag;
        if (process.env.BRUTX_RELEASE_TAG) return process.env.BRUTX_RELEASE_TAG.trim();
        return `v${version}`;
    }

    private resolveGitCommit(): string | null {
        if (this.gitCommit !== undefined) return this.gitCommit;
        if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT.trim();
        try {
            return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf-8' }).trim() || null;
        } catch {
            return null;
        }
    }

    private buildManifest(
        index: RegistryIndex,
        options: RegistryBuildManifestOptions
    ): RegistryBuildManifest {
        const sortedItems = [...index.items].sort((a, b) => a.name.localeCompare(b.name));
        const items: RegistryBuildManifest['items'] = {};

        for (const item of sortedItems) {
            items[item.name] = {
                integrity: item.integrity,
                fileCount: item.files.length,
                dependencies: [...item.dependencies].sort(),
                registryDependencies: [...item.registryDependencies].sort(),
                category: item.category,
                examples: [...(item.examples ?? [])].sort(),
                status: item.status,
                replacement: item.replacement,
            };
        }

        const releaseTag = options.releaseTag ?? (options.registryVersion ? `v${options.registryVersion}` : 'v0.1.0');
        const baseManifest = {
            $schema: REGISTRY_MANIFEST_SCHEMA_URL,
            name: index.name,
            schemaVersion: options.schemaVersion ?? index.schemaVersion,
            registryVersion: options.registryVersion,
            releaseTag,
            buildTimestamp: options.buildTimestamp ?? null,
            gitCommit: options.gitCommit ?? null,
            itemCount: sortedItems.length,
            items,
        };

        const integrity = computeRegistryManifestIntegrity(baseManifest);

        return {
            ...baseManifest,
            integrity,
            digest: integrity,
        };
    }

    private buildSbom(index: RegistryIndex, manifestIntegrity: string): RegistrySbom {
        const components: SbomComponent[] = [];
        const seenNpmDeps = new Set<string>();

        for (const item of index.items) {
            components.push({
                'bom-ref': `brutx:${item.name}`,
                type: 'application',
                name: item.name,
                version: index.registryVersion,
                description: item.description,
                hashes: [
                    { alg: 'SHA-256', content: item.integrity.replace(/^sha256-/, '') },
                ],
                dependencies: [
                    ...item.dependencies.map(dep => `npm:${dep}`),
                    ...item.registryDependencies.map(dep => `brutx:${dep}`),
                ],
            });

            for (const dep of item.dependencies) {
                if (!seenNpmDeps.has(dep)) {
                    seenNpmDeps.add(dep);
                }
            }
        }

        for (const dep of [...seenNpmDeps].sort()) {
            components.push({
                'bom-ref': `npm:${dep}`,
                type: 'library',
                name: dep,
            });
        }

        const sortedComponents = [...components].sort((a, b) => a['bom-ref'].localeCompare(b['bom-ref']));

        const rawForHash = JSON.stringify({
            bomFormat: SBOM_FORMAT,
            specVersion: SBOM_SPEC_VERSION,
            components: sortedComponents,
        });
        const integrity = `sha256-${crypto.createHash('sha256').update(rawForHash).digest('hex')}`;
        const serialHash = crypto.createHash('sha256').update(`${manifestIntegrity}:${integrity}`).digest('hex');
        const serialNumber = `urn:uuid:${serialHash.slice(0, 8)}-${serialHash.slice(8, 12)}-4${serialHash.slice(13, 16)}-a${serialHash.slice(17, 20)}-${serialHash.slice(20, 32)}`;

        return {
            $schema: 'http://cyclonedx.org/schema/bom-1.5.schema.json',
            bomFormat: SBOM_FORMAT,
            specVersion: SBOM_SPEC_VERSION,
            version: 1,
            serialNumber,
            metadata: {
                timestamp: null,
                tools: [{ vendor: 'BrutxUI', name: 'brutx-registry-compiler', version: '0.1.0' }],
                component: {
                    'bom-ref': `brutx:${index.name}`,
                    type: 'application',
                    name: index.name,
                    version: index.registryVersion,
                },
            },
            components: sortedComponents,
            integrity,
            manifestIntegrity,
        };
    }
}
