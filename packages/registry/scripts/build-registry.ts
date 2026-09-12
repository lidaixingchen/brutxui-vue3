import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scanComponentFiles } from 'brutx-shared-vue/scan';
import {
    computeRegistryManifestIntegrity,
    COMPONENT_METADATA,
    type MergedRegistryEntry,
    type RegistryFileType,
    type RegistryIndex,
    type RegistryItem,
} from 'brutx-shared-vue';
import {
    RegistryCompiler,
    rewriteImports as coreRewriteImports,
    extractDeps as coreExtractDeps,
    extractRegistryDeps as coreExtractRegistryDeps,
    extractComponentFileDeps as coreExtractComponentFileDeps,
    extractUnknownRegistryDeps as coreExtractUnknownRegistryDeps,
    assertKnownRegistryDeps as coreAssertKnownRegistryDeps,
    getFileType as coreGetFileType,
    buildRegistrySbom as coreBuildRegistrySbom,
    computeSbomIntegrity as coreComputeSbomIntegrity,
    computeSbomSerialNumber as coreComputeSbomSerialNumber,
    signManifestFromEnv as coreSignManifestFromEnv,
    computeInputDigest,
    createRegistryCompiler,
    runBuild,
    runWatch,
    type RegistryBuildManifest,
    type RegistryBuildManifestOptions,
    type RewriteContext,
} from '../src/index.js';
import {
    findRegistryDependencyCycles,
    REGISTRY_MANIFEST_SCHEMA_URL,
    type RegistryReferenceItem,
} from './validate-utils.js';

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

    const metadata = COMPONENT_METADATA;
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
    const expectedManifest = scanComponentFiles({
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
    return coreRewriteImports(code, componentName, context, undefined, filename);
}

export function extractDeps(code: string, dirPrefix: string): string[] {
    return coreExtractDeps(code, dirPrefix);
}

export function getFileType(filePath: string): RegistryFileType {
    return coreGetFileType(filePath);
}

export function extractRegistryDeps(code: string, componentName: string): string[] {
    return coreExtractRegistryDeps(code, componentName);
}

export function extractComponentFileDeps(code: string, componentName: string): string[] {
    return coreExtractComponentFileDeps(code, componentName);
}

export function extractUnknownRegistryDeps(code: string): string[] {
    return coreExtractUnknownRegistryDeps(code);
}

export function assertKnownRegistryDeps(code: string, ownerName: string, sourceLabel: string): string[] {
    return coreAssertKnownRegistryDeps(code, ownerName, sourceLabel);
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

export function assertRegistryDependencyGraph(items: RegistryReferenceItem[]): void {
    const cycles = findRegistryDependencyCycles(items);
    if (cycles.length > 0) {
        throw new Error(cycles
            .map(cycle => `Registry dependency cycle detected: ${cycle.join(' -> ')}`)
            .join('\n'));
    }
}

export function buildRegistrySbom(index: RegistryIndex, manifestIntegrity: string) {
    return coreBuildRegistrySbom(index, manifestIntegrity);
}

export function computeSbomIntegrity(sbom: Parameters<typeof coreComputeSbomIntegrity>[0]) {
    return coreComputeSbomIntegrity(sbom);
}

export function computeSbomSerialNumber(sbom: Parameters<typeof coreComputeSbomSerialNumber>[0]) {
    return coreComputeSbomSerialNumber(sbom);
}

export function signManifestFromEnv(manifest: RegistryBuildManifest) {
    return coreSignManifestFromEnv(manifest);
}

export async function run() {
    await runBuild();
}

export { runWatch };

const isVitestRuntime = process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined;

if (!isVitestRuntime && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const isWatchMode = process.argv.includes('--watch') || process.env.BRUTX_WATCH === '1';
    const start = isWatchMode ? runWatch : run;
    start().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
