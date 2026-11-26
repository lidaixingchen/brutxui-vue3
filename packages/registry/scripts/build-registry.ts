import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { MergedRegistryEntry, RegistryFileType, RegistryIndex, RegistryItem } from 'brutx-shared-vue';
import type {
    RegistryCompiler,
    RegistryBuildManifest,
    RegistryBuildManifestOptions,
    RewriteContext,
    SbomGeneratorOptions,
    computeSbomIntegrity as coreComputeSbomIntegrity,
    computeSbomSerialNumber as coreComputeSbomSerialNumber,
    createRegistryCompiler,
} from '../src/index.js';
import { runWatch } from '../src/runner/watch-runner.js';

const isVitestRuntime = process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined;
const isMain = !isVitestRuntime && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const helpers = isMain ? undefined : await loadScriptHelpers();

async function loadScriptHelpers() {
    const [shared, scan, registry, validation] = await Promise.all([
        import('brutx-shared-vue'),
        import('brutx-shared-vue/scan'),
        import('../src/index.js'),
        import('./validate-utils.js'),
    ]);
    return { shared, scan, registry, validation };
}

function helperModules() {
    if (!helpers) throw new Error('Registry helpers require importing the build script');
    return helpers;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_COMPONENTS_DIR = path.resolve(__dirname, '../../ui/src/components');
const UI_COMPOSABLES_DIR = path.resolve(__dirname, '../../ui/src/composables');
const UI_LIB_DIR = path.resolve(__dirname, '../../ui/src/lib');
const UI_DIRECTIVES_DIR = path.resolve(__dirname, '../../ui/src/directives');
const MANIFEST_PATH = path.resolve(__dirname, '../../ui/registry-manifest.json');
const API_CONTRACT_PATH = path.resolve(__dirname, '../../ui/api-contract.ts');

let defaultCompilerPromise: ReturnType<typeof createRegistryCompiler> | undefined;
let defaultCompilerContractDigest: string | undefined;

async function getDefaultCompiler(): Promise<RegistryCompiler> {
    const { computeInputDigest, createRegistryCompiler } = helperModules().registry;
    const contractDigest = computeInputDigest(fs.readFileSync(API_CONTRACT_PATH, 'utf-8'));
    if (!defaultCompilerPromise || defaultCompilerContractDigest !== contractDigest) {
        defaultCompilerPromise = createRegistryCompiler();
        defaultCompilerContractDigest = contractDigest;
    }
    return (await defaultCompilerPromise).compiler;
}

export type { RegistryBuildManifest, RegistryBuildManifestOptions };

export function loadMergedRegistry(): Record<string, MergedRegistryEntry> {
    let manifestRaw: string;
    try {
        manifestRaw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    } catch (error) {
        const cause = error instanceof Error ? error.message : String(error);
        throw new Error(
            `Failed to read ${path.relative(process.cwd(), MANIFEST_PATH)} (${cause}). ` +
            'Run pnpm --filter brutx-ui-vue generate first to generate the UI registry manifest.',
            { cause: error },
        );
    }

    let manifest: Record<string, {
        files: string[];
        composables: string[];
        directives: string[];
        lib: string[];
    }>;
    try {
        manifest = JSON.parse(manifestRaw) as typeof manifest;
    } catch (error) {
        const cause = error instanceof Error ? error.message : String(error);
        throw new Error(
            `Failed to parse registry-manifest.json (${cause}). ` +
            'Run pnpm --filter brutx-ui-vue generate first to regenerate the file.',
            { cause: error },
        );
    }

    const metadata = helperModules().shared.COMPONENT_METADATA;
    const merged: Record<string, MergedRegistryEntry> = {};
    for (const [name, meta] of Object.entries(metadata)) {
        const fileManifest = manifest[name];
        if (!fileManifest) {
            throw new Error(
                `Component "${name}" has metadata but is missing from registry-manifest.json. ` +
                'Run pnpm --filter brutx-ui-vue generate first.',
            );
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
        if (!metadata[name]) {
            throw new Error(
                `Component "${name}" is in registry-manifest.json but has no metadata in COMPONENT_METADATA.`,
            );
        }
    }
    return merged;
}

export function reloadRegistry(): void {
    defaultCompilerPromise = undefined;
    defaultCompilerContractDigest = undefined;
}

export function runPrebuildScan(): void {
    const expectedManifest = helperModules().scan.scanComponentFiles({
        componentsDir: UI_COMPONENTS_DIR,
        composablesDir: UI_COMPOSABLES_DIR,
        libDir: UI_LIB_DIR,
        directivesDir: UI_DIRECTIVES_DIR,
    });
    const expected = JSON.stringify(expectedManifest, null, 2) + '\n';
    const actual = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    if (actual !== expected) {
        throw new Error(
            `registry-manifest.json is stale at ${MANIFEST_PATH}; ` +
            'run pnpm --filter brutx-ui-vue generate to update the UI snapshot.',
        );
    }
}

export function rewriteImports(
    code: string,
    componentName: string,
    context: RewriteContext = 'component',
    filename?: string,
): string {
    return helperModules().registry.rewriteImports(code, componentName, context, undefined, filename);
}

export function extractDeps(code: string, dirPrefix: string): string[] {
    return helperModules().registry.extractDeps(code, dirPrefix);
}

export function getFileType(filePath: string): RegistryFileType {
    return helperModules().registry.getFileType(filePath);
}

export function extractRegistryDeps(code: string, componentName: string): string[] {
    return helperModules().registry.extractRegistryDeps(code, componentName);
}

export function extractComponentFileDeps(code: string, componentName: string): string[] {
    return helperModules().registry.extractComponentFileDeps(code, componentName);
}

export function extractUnknownRegistryDeps(code: string): string[] {
    return helperModules().registry.extractUnknownRegistryDeps(code);
}

export function assertKnownRegistryDeps(code: string, ownerName: string, sourceLabel: string): string[] {
    return helperModules().registry.assertKnownRegistryDeps(code, ownerName, sourceLabel);
}

export async function buildRegistryItem(name: string): Promise<RegistryItem> {
    const compiler = await getDefaultCompiler();
    const result = await compiler.compileItem(name);
    return result.item;
}

export async function computeSourceHash(
    name: string,
    fileMapping: { files: string[]; composables?: string[]; directives?: string[] },
): Promise<string> {
    const compiler = await getDefaultCompiler();
    return compiler.computeSourceHash(name, fileMapping);
}

export function buildRegistryManifest(
    index: RegistryIndex,
    options: RegistryBuildManifestOptions,
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

    const releaseTag = options.releaseTag
        ?? (options.registryVersion ? `v${options.registryVersion}` : 'v0.1.0');
    const baseManifest = {
        $schema: helperModules().validation.REGISTRY_MANIFEST_SCHEMA_URL,
        name: index.name,
        schemaVersion: options.schemaVersion ?? index.schemaVersion,
        registryVersion: options.registryVersion,
        releaseTag,
        buildTimestamp: options.buildTimestamp ?? null,
        gitCommit: options.gitCommit ?? null,
        itemCount: sortedItems.length,
        items,
    };
    const integrity = helperModules().shared.computeRegistryManifestIntegrity(baseManifest);
    return {
        ...baseManifest,
        integrity,
        digest: integrity,
    };
}

export { assertRegistryDependencyGraph } from '../src/compiler/dependency-graph.js';

export function buildRegistrySbom(
    index: RegistryIndex,
    manifestIntegrity: string,
    options?: SbomGeneratorOptions
) {
    return helperModules().registry.buildRegistrySbom(index, manifestIntegrity, options);
}

export function computeSbomIntegrity(sbom: Parameters<typeof coreComputeSbomIntegrity>[0]) {
    return helperModules().registry.computeSbomIntegrity(sbom);
}

export function computeSbomSerialNumber(sbom: Parameters<typeof coreComputeSbomSerialNumber>[0]) {
    return helperModules().registry.computeSbomSerialNumber(sbom);
}

export function signManifestFromEnv(manifest: RegistryBuildManifest) {
    return helperModules().registry.signManifestFromEnv(manifest);
}

export async function run() {
    const { runBuild } = await import('../src/runner/build-runner.js');
    await runBuild();
}

export { runWatch };

if (isMain) {
    const isWatchMode = process.argv.includes('--watch') || process.env.BRUTX_WATCH === '1';
    const start = isWatchMode ? runWatch : run;
    start().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
