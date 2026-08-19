import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    COMPONENT_METADATA,
    CSS_VARS,
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
import { LIB_EXCLUDE } from '../../../ui/scripts/manifest-shared.js';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import { DiskFileSystemAdapter } from '../fs/disk-fs.js';
import { rewriteImports } from './ast-rewriter.js';
import { DependencyResolver } from './dependency-resolver.js';
import { CACHE_VERSION, CacheManager } from './cache-manager.js';
import type {
    CompiledItemResult,
    CompiledRegistryResult,
    CompilerOptions,
    CompilerPaths,
    RegistryBuildManifest,
    RegistryBuildManifestOptions,
    RegistrySbom,
    SbomComponent,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_TAILWIND_CONFIG: Record<string, unknown> = {};

const DEFAULT_PATHS: CompilerPaths = {
    componentsDir: path.resolve(__dirname, '../../../ui/src/components'),
    composablesDir: path.resolve(__dirname, '../../../ui/src/composables'),
    localesDir: path.resolve(__dirname, '../../../ui/src/locales'),
    libDir: path.resolve(__dirname, '../../../ui/src/lib'),
    directivesDir: path.resolve(__dirname, '../../../ui/src/directives'),
    manifestPath: path.resolve(__dirname, '../../../ui/registry-manifest.json'),
    outputDir: path.resolve(__dirname, '../../registry'),
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
    private libExclude: Set<string>;
    private metadata: Record<string, ComponentMetadataEntry>;
    private dependencyResolver: DependencyResolver;
    private cacheManager: CacheManager;

    constructor(options: CompilerOptions = {}) {
        this.fs = options.fs ?? new DiskFileSystemAdapter();
        this.paths = { ...DEFAULT_PATHS, ...(options.paths ?? {}) };
        this.tailwindConfig = options.tailwindConfig ?? DEFAULT_TAILWIND_CONFIG;
        this.cssVars = options.cssVars ?? (CSS_VARS as unknown as Record<string, string>);
        this.libExclude = options.libExclude ?? LIB_EXCLUDE;
        this.metadata = options.metadata ?? COMPONENT_METADATA;

        this.dependencyResolver = new DependencyResolver(this.fs, this.paths, this.libExclude);
        const cacheFilePath = path.join(path.dirname(this.paths.outputDir), '.registry-cache.json');
        this.cacheManager = new CacheManager(this.fs, cacheFilePath);
    }

    public async loadMergedRegistry(): Promise<Record<string, MergedRegistryEntry>> {
        let manifestRaw: string;
        try {
            manifestRaw = await this.fs.readFile(this.paths.manifestPath, 'utf-8');
        } catch (error) {
            const cause = error instanceof Error ? error.message : String(error);
            throw new Error(
                `Failed to read registry-manifest.json (${cause}). ` +
                `Run pnpm --filter brutx-ui-vue prebuild:scan first to generate the UI registry manifest.`
            );
        }

        const manifest = JSON.parse(manifestRaw) as RegistryManifest;
        const merged: Record<string, MergedRegistryEntry> = {};

        for (const [name, meta] of Object.entries(this.metadata)) {
            const fileManifest = manifest[name];
            if (!fileManifest) {
                throw new Error(`Component "${name}" has metadata but is missing from registry-manifest.json. Run pnpm --filter brutx-ui-vue prebuild:scan.`);
            }
            merged[name] = {
                ...meta,
                files: [...fileManifest.files],
                composables: [...fileManifest.composables],
                directives: [...fileManifest.directives],
                lib: [...fileManifest.lib],
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
        const { files, registryDependencies } = await this.dependencyResolver.resolveComponentClosure(
            name,
            componentInfo,
            knownComponents
        );

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

        const sourceHash = await this.cacheManager.computeSourceHash(
            name,
            {
                files: componentInfo.files,
                composables: componentInfo.composables,
                directives: componentInfo.directives,
            },
            componentInfo,
            this.tailwindConfig,
            this.cssVars,
            this.paths,
            this.libExclude
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

            for (const localeFile of tsFiles) {
                const fullPath = path.join(this.paths.localesDir, localeFile);
                const raw = await this.fs.readFile(fullPath, 'utf-8');
                const code = rewriteImports(raw.replace(/\r\n/g, '\n'), 'locale-zh-cn', 'locale');
                localeFiles.push({
                    path: `locales/${localeFile}`,
                    content: code,
                    type: 'registry:lib',
                });
                localeHashParts.push(code);
            }
        }

        const localeHash = crypto.createHash('sha256').update([
            JSON.stringify({
                cacheVersion: CACHE_VERSION,
                tailwind: this.tailwindConfig,
                cssVars: this.cssVars,
            }),
            ...localeHashParts,
        ].join('\0')).digest('hex');

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

        const itemsMap = new Map<string, RegistryItem>();
        const itemResults: CompiledItemResult[] = [];
        const cacheRecord: Record<string, string> = {};

        const indexItems: RegistryIndexItem[] = [];

        // 1. 编译各组件
        for (const name of componentNames) {
            const res = await this.compileItem(name, mergedRegistry);
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
        const localeRes = await this.compileLocaleZhCn();
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

        // 3. 构建 RegistryIndex
        const index: RegistryIndex = {
            $schema: 'https://ui.shadcn.com/schema/registry-index.json',
            name: 'brutx-ui-vue',
            schemaVersion: REGISTRY_SCHEMA_VERSION,
            registryVersion: '0.1.0',
            homepage: 'https://github.com/lidaixingchen/brutxui-vue3',
            items: indexItems,
        };

        // 4. 构建 RegistryBuildManifest
        const manifest = this.buildManifest(index, {
            registryVersion: index.registryVersion,
            schemaVersion: index.schemaVersion,
            buildTimestamp: null,
            gitCommit: null,
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

        const baseManifest = {
            $schema: REGISTRY_MANIFEST_SCHEMA_URL,
            name: index.name,
            schemaVersion: options.schemaVersion ?? index.schemaVersion,
            registryVersion: options.registryVersion,
            buildTimestamp: options.buildTimestamp ?? null,
            gitCommit: options.gitCommit ?? null,
            itemCount: sortedItems.length,
            items,
        };

        const integrity = computeRegistryManifestIntegrity(baseManifest);

        return {
            ...baseManifest,
            integrity,
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
