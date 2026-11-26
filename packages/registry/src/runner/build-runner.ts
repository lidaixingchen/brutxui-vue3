import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DiskFileSystemAdapter } from '../fs/disk-fs.js';
import { RegistryCompiler } from '../compiler/registry-compiler.js';
import { computeInputDigest } from '../compiler/cache-manager.js';
import { DiskEmitter } from '../emitters/disk-emitter.js';
import { signManifestFromEnv } from '../emitters/manifest-signer.js';
import { BenchmarkTracker } from './benchmark-tracker.js';
import { getDefaultPaths } from './build-paths.js';
import type { ApiContract, ComponentExportProjection } from 'brutx-shared-vue/api-contract';
import type {
    CompiledRegistryResult,
    CompilerOptions,
    CompilerPaths,
    PublicComponentProjectionSet,
} from '../compiler/types.js';

export { getDefaultPaths } from './build-paths.js';
export { runWatch } from './watch-runner.js';

export interface RunnerOptions extends CompilerOptions {
    verbose?: boolean;
    bench?: boolean;
    forceRebuild?: boolean;
}

interface UiApiContractModule {
    API_CONTRACT?: ApiContract;
    projectComponentExports?: (componentId: string) => ComponentExportProjection;
}

export async function loadPublicProjection(
    fs: CompilerOptions['fs'],
    paths: CompilerPaths,
): Promise<PublicComponentProjectionSet> {
    const apiContractPath = paths.apiContractPath;
    const adapter = fs ?? new DiskFileSystemAdapter();
    if (!apiContractPath) {
        throw new Error('API contract path is required to build the Registry component index');
    }
    if (!(await adapter.pathExists(apiContractPath))) {
        throw new Error(`API contract not found at ${apiContractPath}`);
    }

    const source = await adapter.readFile(apiContractPath, 'utf-8');
    const cacheKey = computeInputDigest(source);
    const moduleUrl = `${pathToFileURL(apiContractPath).href}?digest=${cacheKey}`;
    let loaded: UiApiContractModule;
    try {
        loaded = await import(moduleUrl) as UiApiContractModule;
    } catch (error) {
        const cause = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to load API contract at ${apiContractPath}: ${cause}`, { cause: error });
    }

    if (!loaded.API_CONTRACT || !loaded.projectComponentExports) {
        throw new Error(`API contract at ${apiContractPath} must export API_CONTRACT and projectComponentExports`);
    }

    const projectComponentExports = loaded.projectComponentExports;
    const componentNames = loaded.API_CONTRACT.entries
        .filter(entry => entry.kind === 'component')
        .map(entry => entry.id.replace(/^component:/, ''))
        .sort();
    const projection: Record<string, ComponentExportProjection> = {};
    for (const name of componentNames) {
        projection[name] = projectComponentExports(name);
    }
    return projection;
}

export interface CreatedRegistryCompiler {
    fs: NonNullable<CompilerOptions['fs']>;
    paths: CompilerPaths;
    compiler: RegistryCompiler;
}

export async function createRegistryCompiler(
    options: RunnerOptions = {},
): Promise<CreatedRegistryCompiler> {
    const fs = options.fs ?? new DiskFileSystemAdapter();
    const paths = { ...getDefaultPaths(), ...(options.paths ?? {}) };
    const publicProjection = options.publicProjection
        ?? await loadPublicProjection(fs, paths);
    const publicProjectionDigest = options.publicProjectionDigest
        ?? (options.publicProjection === undefined && paths.apiContractPath
            ? computeInputDigest(await fs.readFile(paths.apiContractPath, 'utf-8'))
            : undefined);
    const compiler = new RegistryCompiler({
        ...options,
        fs,
        paths,
        publicProjection,
        publicProjectionDigest,
    });
    return { fs, paths, compiler };
}

export async function compileRegistry(options: RunnerOptions = {}): Promise<CompiledRegistryResult> {
    const { compiler } = await createRegistryCompiler(options);
    return compiler.compileAll({ forceRebuild: options.forceRebuild });
}

export async function runBuild(options: RunnerOptions = {}): Promise<void> {
    const verbose = options.verbose ?? process.argv.includes('--verbose') ?? false;
    const isBench = options.bench ?? process.argv.includes('--bench') ?? false;

    if (verbose) {
        console.log('🚀 Starting registry build...');
    }

    try {
        const { fs, paths, compiler } = await createRegistryCompiler(options);
        const result = await compiler.compileAll({ forceRebuild: options.forceRebuild });

        // 签名 Manifest（若配置私钥）
        result.manifest = signManifestFromEnv(result.manifest, { verbose });

        // 发射产物落盘
        const emitter = new DiskEmitter(fs);
        const { writtenCount, cleanedCount } = await emitter.emit(result, paths.outputDir);

        // 保存缓存
        const cacheFilePath = path.join(path.dirname(paths.outputDir), '.registry-cache.json');
        await fs.writeJson(cacheFilePath, result.cacheRecord, { spaces: 2 });

        // 记录基准指标
        if (isBench) {
            const benchFilePath = path.join(path.dirname(paths.outputDir), 'bench.json');
            const tracker = new BenchmarkTracker(fs, benchFilePath);
            const metrics = tracker.createMetrics(result);
            await tracker.saveMetrics(metrics);
            console.log(`📊 Benchmark saved to ${path.relative(process.cwd(), benchFilePath)}`);
        }

        console.log(
            `✓ Built ${result.items.size} registry items, written ${writtenCount} files (${cleanedCount} cleaned) in ${result.totalDurationMs}ms`
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ Registry build failed: ${message}`);
        throw error;
    }
}
