import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DiskFileSystemAdapter } from '../fs/disk-fs.js';
import { RegistryCompiler } from '../compiler/registry-compiler.js';
import { DiskEmitter } from '../emitters/disk-emitter.js';
import { signManifestFromEnv } from '../emitters/manifest-signer.js';
import { BenchmarkTracker } from './benchmark-tracker.js';
import { RegistryWatcher } from './watcher.js';
import type { CompilerOptions, CompilerPaths } from '../compiler/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RunnerOptions extends CompilerOptions {
    verbose?: boolean;
    bench?: boolean;
    forceRebuild?: boolean;
}

export function getDefaultPaths(): CompilerPaths {
    return {
        componentsDir: path.resolve(__dirname, '../../../../packages/ui/src/components'),
        composablesDir: path.resolve(__dirname, '../../../../packages/ui/src/composables'),
        localesDir: path.resolve(__dirname, '../../../../packages/ui/src/locales'),
        libDir: path.resolve(__dirname, '../../../../packages/ui/src/lib'),
        directivesDir: path.resolve(__dirname, '../../../../packages/ui/src/directives'),
        manifestPath: path.resolve(__dirname, '../../../../packages/ui/registry-manifest.json'),
        outputDir: path.resolve(__dirname, '../../registry'),
    };
}

export async function runBuild(options: RunnerOptions = {}): Promise<void> {
    const fs = options.fs ?? new DiskFileSystemAdapter();
    const paths = { ...getDefaultPaths(), ...(options.paths ?? {}) };
    const verbose = options.verbose ?? process.argv.includes('--verbose') ?? false;
    const isBench = options.bench ?? process.argv.includes('--bench') ?? false;

    if (verbose) {
        console.log('🚀 Starting registry build...');
    }

    try {
        const compiler = new RegistryCompiler({
            fs,
            paths,
            ...options,
        });

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

export async function runWatch(options: RunnerOptions = {}): Promise<void> {
    const paths = { ...getDefaultPaths(), ...(options.paths ?? {}) };
    console.log('👀 Starting registry build in watch mode...');

    // 初始执行一次构建
    await runBuild(options);

    const watcher = new RegistryWatcher(paths, {
        onRebuild: async () => {
            await runBuild(options);
        },
    });

    watcher.start();
}
