import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
    scanComponentFiles,
    buildComponentIndexContent,
} from 'brutx-shared-vue/scan';
import {
    COMPONENT_METADATA,
    computeRegistryIntegrity,
    computeRegistryManifestIntegrity,
    type MergedRegistryEntry,
    type RegistryFile,
    type RegistryFileType,
    type RegistryIndex,
    type RegistryItem,
} from 'brutx-shared-vue';
import { applyManifestOverrides, LIB_EXCLUDE } from '../../ui/scripts/manifest-shared.js';
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
    CACHE_VERSION,
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
const UI_LOCALES_DIR = path.resolve(__dirname, '../../ui/src/locales');
const UI_LIB_DIR = path.resolve(__dirname, '../../ui/src/lib');
const UI_DIRECTIVES_DIR = path.resolve(__dirname, '../../ui/src/directives');
const MANIFEST_PATH = path.resolve(__dirname, '../../ui/registry-manifest.json');

let defaultCompiler = new RegistryCompiler();

export type { RegistryBuildManifest, RegistryBuildManifestOptions };

function resolveExtension(rawFileName: string, baseDir: string): string {
    if (path.extname(rawFileName)) return rawFileName;
    if (fs.existsSync(path.join(baseDir, `${rawFileName}.vue`))) return `${rawFileName}.vue`;
    if (fs.existsSync(path.join(baseDir, `${rawFileName}.ts`))) return `${rawFileName}.ts`;
    return rawFileName;
}

/**
 * 重新加载并获取 MergedRegistry（兼容旧接口）。
 */
export function loadMergedRegistry(): Record<string, MergedRegistryEntry> {
    let manifestRaw: string;
    try {
        manifestRaw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    } catch (error) {
        const cause = error instanceof Error ? error.message : String(error);
        throw new Error(
            `Failed to read ${path.relative(process.cwd(), MANIFEST_PATH)} (${cause}). ` +
            `Run pnpm --filter brutx-ui-vue prebuild:scan first to generate the UI registry manifest.`,
            { cause: error }
        );
    }
    const manifest = JSON.parse(manifestRaw);
    const metaSource = defaultCompiler['metadata'] ?? COMPONENT_METADATA;
    const merged: Record<string, MergedRegistryEntry> = {};

    for (const [name, meta] of Object.entries(metaSource)) {
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
        if (!metaSource[name]) {
            throw new Error(`Component "${name}" is in registry-manifest.json but has no metadata in COMPONENT_METADATA. Add an entry in packages/shared/src/components.ts.`);
        }
    }

    return merged;
}

export function reloadRegistry(): void {
    defaultCompiler = new RegistryCompiler();
}

export function runPrebuildScan(): void {
    const manifest = scanComponentFiles({
        componentsDir: UI_COMPONENTS_DIR,
        composablesDir: UI_COMPOSABLES_DIR,
        libDir: UI_LIB_DIR,
        directivesDir: UI_DIRECTIVES_DIR,
        libExclude: LIB_EXCLUDE,
    });
    applyManifestOverrides(manifest);
    const output = JSON.stringify(manifest, null, 2) + '\n';
    fs.writeFileSync(MANIFEST_PATH, output, 'utf-8');
}

export function rewriteImports(code: string, componentName: string, context: RewriteContext = 'component'): string {
    return coreRewriteImports(code, componentName, context);
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

export function buildRegistryItem(name: string): RegistryItem {
    const merged = loadMergedRegistry();
    const componentInfo = merged[name];
    if (!componentInfo) {
        throw new Error(`No file mapping found for component "${name}"`);
    }

    const allRegistryDeps = new Set<string>();
    const files: RegistryFile[] = [];
    const componentFileDeps = new Set(componentInfo.files);
    const composableDeps = new Set(componentInfo.composables ?? []);
    const localeDeps = new Set<string>();
    const libDeps = new Set<string>();

    const addedComponentFiles = new Set<string>();
    while (addedComponentFiles.size < componentFileDeps.size) {
        const pending = Array.from(componentFileDeps).filter(f => !addedComponentFiles.has(f));
        for (const rawName of pending) {
            const fileName = resolveExtension(rawName, path.join(UI_COMPONENTS_DIR, name));
            const filePath = path.join(UI_COMPONENTS_DIR, name, fileName);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Source file not found at ${filePath}`);
            }
            let code = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
            code = rewriteImports(code, name, 'component');
            assertKnownRegistryDeps(code, name, fileName);
            extractRegistryDeps(code, name).forEach(d => allRegistryDeps.add(d));

            for (const d of extractComponentFileDeps(code, name)) {
                componentFileDeps.add(resolveExtension(d, path.join(UI_COMPONENTS_DIR, name)));
            }
            for (const d of extractDeps(code, 'composables')) {
                composableDeps.add(resolveExtension(d, UI_COMPOSABLES_DIR));
            }
            for (const d of extractDeps(code, 'locales')) {
                localeDeps.add(resolveExtension(d, UI_LOCALES_DIR));
            }
            for (const d of extractDeps(code, 'lib')) {
                libDeps.add(resolveExtension(d, UI_LIB_DIR));
            }

            const relPath = `components/ui/${name}/${fileName}`;
            files.push({
                path: relPath,
                content: code,
                type: getFileType(relPath),
            });
            addedComponentFiles.add(rawName);
            addedComponentFiles.add(fileName);
        }
    }

    const indexContent = rewriteImports(
        buildComponentIndexContent(Array.from(componentFileDeps)),
        name,
        'component'
    );
    const indexRelPath = `components/ui/${name}/index.ts`;
    files.push({
        path: indexRelPath,
        content: indexContent,
        type: getFileType(indexRelPath),
    });

    const addedDirectives = new Set<string>();
    const directiveDeps = new Set<string>(componentInfo.directives ?? []);
    while (addedDirectives.size < directiveDeps.size) {
        const pending = Array.from(directiveDeps).filter(d => !addedDirectives.has(d));
        for (const rawName of pending) {
            const directiveName = resolveExtension(rawName, UI_DIRECTIVES_DIR);
            const directivePath = path.join(UI_DIRECTIVES_DIR, directiveName);
            if (!fs.existsSync(directivePath)) {
                throw new Error(`Directive file not found at ${directivePath}`);
            }
            let code = fs.readFileSync(directivePath, 'utf-8').replace(/\r\n/g, '\n');
            code = rewriteImports(code, name, 'directive');
            assertKnownRegistryDeps(code, name, directiveName);
            extractRegistryDeps(code, name).forEach(d => allRegistryDeps.add(d));
            for (const d of extractDeps(code, 'composables')) directiveDeps.add(resolveExtension(d, UI_COMPOSABLES_DIR));
            for (const d of extractDeps(code, 'locales')) localeDeps.add(resolveExtension(d, UI_LOCALES_DIR));
            for (const d of extractDeps(code, 'lib')) libDeps.add(resolveExtension(d, UI_LIB_DIR));
            for (const d of extractDeps(code, 'directives')) directiveDeps.add(resolveExtension(d, UI_DIRECTIVES_DIR));

            const relPath = `directives/${directiveName}`;
            files.push({
                path: relPath,
                content: code,
                type: getFileType(relPath),
            });
            addedDirectives.add(rawName);
            addedDirectives.add(directiveName);
        }
    }

    const addedComposables = new Set<string>();
    while (addedComposables.size < composableDeps.size) {
        const pending = Array.from(composableDeps).filter(c => !addedComposables.has(c));
        for (const rawName of pending) {
            const composableName = resolveExtension(rawName, UI_COMPOSABLES_DIR);
            const composablePath = path.join(UI_COMPOSABLES_DIR, composableName);
            if (!fs.existsSync(composablePath)) {
                throw new Error(`Composable file not found at ${composablePath}`);
            }
            let code = fs.readFileSync(composablePath, 'utf-8').replace(/\r\n/g, '\n');
            code = rewriteImports(code, name, 'composable');
            assertKnownRegistryDeps(code, name, composableName);
            extractRegistryDeps(code, name).forEach(d => allRegistryDeps.add(d));
            for (const d of extractDeps(code, 'composables')) {
                composableDeps.add(resolveExtension(d, UI_COMPOSABLES_DIR));
            }
            for (const d of extractDeps(code, 'locales')) {
                localeDeps.add(resolveExtension(d, UI_LOCALES_DIR));
            }
            for (const d of extractDeps(code, 'lib')) {
                libDeps.add(resolveExtension(d, UI_LIB_DIR));
            }

            const relPath = `composables/${composableName}`;
            files.push({
                path: relPath,
                content: code,
                type: getFileType(relPath),
            });
            addedComposables.add(rawName);
            addedComposables.add(composableName);
        }
    }

    if (localeDeps.size > 0) {
        allRegistryDeps.add('locale-zh-cn');
    }

    for (const rawLibName of libDeps) {
        const libName = resolveExtension(rawLibName, UI_LIB_DIR);
        const libPath = path.join(UI_LIB_DIR, libName);
        if (!fs.existsSync(libPath)) {
            throw new Error(`Lib file not found at ${libPath}`);
        }
        let code = fs.readFileSync(libPath, 'utf-8').replace(/\r\n/g, '\n');
        code = rewriteImports(code, name, 'lib');
        assertKnownRegistryDeps(code, name, libName);
        extractRegistryDeps(code, name).forEach(d => allRegistryDeps.add(d));
        for (const d of extractDeps(code, 'lib')) {
            libDeps.add(resolveExtension(d, UI_LIB_DIR));
        }

        if (LIB_EXCLUDE.has(libName)) continue;

        const relPath = `lib/${libName}`;
        files.push({
            path: relPath,
            content: code,
            type: getFileType(relPath),
        });
    }

    const integrity = computeRegistryIntegrity(files);

    return {
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
        registryDependencies: Array.from(allRegistryDeps),
        files,
        tailwind: {},
        cssVars: {},
        integrity,
    };
}

export function computeSourceHash(name: string, fileMapping: { files: string[]; composables?: string[]; directives?: string[] }): string {
    const merged = loadMergedRegistry();
    const parts: string[] = [JSON.stringify({
        cacheVersion: CACHE_VERSION,
        componentInfo: merged[name] ?? null,
        fileMapping,
        tailwind: {},
        cssVars: {},
    })];

    const componentDeps = new Set(fileMapping.files);
    const addedComponentDeps = new Set<string>();
    const composableDeps = new Set(fileMapping.composables ?? []);
    const addedComposableDeps = new Set<string>();
    const localeDeps = new Set<string>();
    const libDeps = new Set<string>();

    const addComponentFile = (rawName: string): void => {
        const fileName = resolveExtension(rawName, path.join(UI_COMPONENTS_DIR, name));
        const filePath = path.join(UI_COMPONENTS_DIR, name, fileName);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Source file not found: ${filePath}`);
        }
        const code = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
        parts.push(code);
        const rewritten = rewriteImports(code, name, 'component');
        for (const d of extractComponentFileDeps(rewritten, name)) {
            componentDeps.add(resolveExtension(d, path.join(UI_COMPONENTS_DIR, name)));
        }
        for (const d of extractDeps(rewritten, 'composables')) {
            composableDeps.add(resolveExtension(d, UI_COMPOSABLES_DIR));
        }
        for (const d of extractDeps(rewritten, 'locales')) {
            localeDeps.add(resolveExtension(d, UI_LOCALES_DIR));
        }
        for (const d of extractDeps(rewritten, 'lib')) {
            libDeps.add(resolveExtension(d, UI_LIB_DIR));
        }
        addedComponentDeps.add(rawName);
        addedComponentDeps.add(fileName);
    };

    while (addedComponentDeps.size < componentDeps.size) {
        const pending = Array.from(componentDeps).filter(f => !addedComponentDeps.has(f));
        for (const fileName of pending) {
            addComponentFile(fileName);
        }
    }

    parts.push(buildComponentIndexContent(Array.from(componentDeps)));

    const addComposableFile = (rawName: string): void => {
        const composableName = resolveExtension(rawName, UI_COMPOSABLES_DIR);
        const composablePath = path.join(UI_COMPOSABLES_DIR, composableName);
        if (fs.existsSync(composablePath)) {
            const code = fs.readFileSync(composablePath, 'utf-8').replace(/\r\n/g, '\n');
            parts.push(code);
            const rewritten = rewriteImports(code, name, 'composable');
            for (const d of extractDeps(rewritten, 'composables')) {
                composableDeps.add(resolveExtension(d, UI_COMPOSABLES_DIR));
            }
            for (const d of extractDeps(rewritten, 'locales')) {
                localeDeps.add(resolveExtension(d, UI_LOCALES_DIR));
            }
            for (const d of extractDeps(rewritten, 'lib')) {
                libDeps.add(resolveExtension(d, UI_LIB_DIR));
            }
        }
        addedComposableDeps.add(rawName);
        addedComposableDeps.add(composableName);
    };

    const addedLocaleDeps = new Set<string>();
    while (addedComposableDeps.size < composableDeps.size || addedLocaleDeps.size < localeDeps.size) {
        const pendingComposables = Array.from(composableDeps).filter(c => !addedComposableDeps.has(c));
        for (const composableName of pendingComposables) {
            addComposableFile(composableName);
        }

        const pendingLocales = Array.from(localeDeps).filter(l => !addedLocaleDeps.has(l));
        for (const rawLocaleName of pendingLocales) {
            const localeName = resolveExtension(rawLocaleName, UI_LOCALES_DIR);
            const localePath = path.join(UI_LOCALES_DIR, localeName);
            if (fs.existsSync(localePath)) {
                const code = fs.readFileSync(localePath, 'utf-8').replace(/\r\n/g, '\n');
                parts.push(code);
                const rewritten = rewriteImports(code, name, 'locale');
                for (const d of extractDeps(rewritten, 'locales')) {
                    localeDeps.add(resolveExtension(d, UI_LOCALES_DIR));
                }
                for (const d of extractDeps(rewritten, 'composables')) {
                    composableDeps.add(resolveExtension(d, UI_COMPOSABLES_DIR));
                }
                for (const d of extractDeps(rewritten, 'lib')) {
                    libDeps.add(resolveExtension(d, UI_LIB_DIR));
                }
            }
            addedLocaleDeps.add(rawLocaleName);
            addedLocaleDeps.add(localeName);
        }
    }

    for (const rawLibName of libDeps) {
        const libName = resolveExtension(rawLibName, UI_LIB_DIR);
        const libPath = path.join(UI_LIB_DIR, libName);
        if (fs.existsSync(libPath)) {
            const code = fs.readFileSync(libPath, 'utf-8').replace(/\r\n/g, '\n');
            const rewritten = rewriteImports(code, name, 'lib');
            for (const d of extractDeps(rewritten, 'lib')) {
                libDeps.add(resolveExtension(d, UI_LIB_DIR));
            }
            if (!LIB_EXCLUDE.has(libName)) {
                parts.push(code);
            }
        }
    }

    return crypto.createHash('sha256').update(parts.join('\0')).digest('hex');
}

export function buildRegistryManifest(
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

export function assertRegistryDependencyGraph(items: RegistryReferenceItem[]): void {
    const cycles = findRegistryDependencyCycles(items);
    if (cycles.length > 0) {
        const cycleDescriptions = cycles
            .map(cycle => `Registry dependency cycle detected: ${cycle.join(' -> ')}`)
            .join('\n');
        throw new Error(cycleDescriptions);
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
    if (isWatchMode) {
        runWatch().catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });
    } else {
        run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });
    }
}
