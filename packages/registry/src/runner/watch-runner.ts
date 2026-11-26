import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { getDefaultPaths } from './build-paths.js';
import { RegistryWatcher } from './watcher.js';
import type { RunnerOptions } from './build-runner.js';

const runnerDir = path.dirname(fileURLToPath(import.meta.url));

export async function runWatch(options: RunnerOptions = {}): Promise<void> {
    const paths = { ...getDefaultPaths(), ...(options.paths ?? {}) };
    console.log('👀 Starting registry build in watch mode...');

    const watcher = new RegistryWatcher(paths, {
        additionalInputs: {
            directories: [
                path.resolve(runnerDir, '../../../shared/src'),
                path.resolve(runnerDir, '..'),
            ],
            files: [
                path.resolve(runnerDir, '../../../shared/package.json'),
                path.resolve(runnerDir, '../../package.json'),
                path.resolve(runnerDir, '../../tsconfig.json'),
            ],
        },
        // 注入的文件系统和解析器需要保留在调用进程中。
        onRebuild: options.fs || options.componentIndexBuilder || options.moduleResolver
            ? () => import('./build-runner.js').then(({ runBuild }) => runBuild(options))
            : () => runBuildInWorker(options),
    });

    await watcher.start({ buildInitially: true });
}

function runBuildInWorker(options: RunnerOptions): Promise<void> {
    return new Promise((resolve, reject) => {
        // 每次构建使用独立的模块缓存，读取共享源码及公开契约的当前内容。
        const worker = new Worker(new URL('./build-worker.ts', import.meta.url), {
            workerData: options,
            argv: process.argv.slice(2),
            execArgv: ['--import', import.meta.resolve('tsx')],
        });
        let failure: unknown;
        worker.once('error', error => {
            failure = error;
        });
        worker.once('exit', code => {
            if (code === 0) resolve();
            else reject(failure ?? new Error(`Registry build worker exited with code ${code}`));
        });
    });
}
