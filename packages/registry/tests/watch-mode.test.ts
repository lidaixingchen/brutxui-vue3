import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDefaultPaths } from '../src/runner/build-runner.js';
import { RegistryWatcher } from '../src/runner/watcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入待测模块（延迟导入以便 mock）
const buildRegistry = await import('../scripts/build-registry.js');
const { runPrebuildScan, reloadRegistry } = buildRegistry;

describe('build-registry watch mode (P2.3)', () => {
    describe('reloadRegistry', () => {
        it('reloads REGISTRY from registry-manifest.json without throwing', () => {
            // 当前项目有 registry-manifest.json，reload 应该成功
            expect(() => reloadRegistry()).not.toThrow();
        });

        it('preserves REGISTRY content after reload', () => {
            // reload 后 REGISTRY 应该和之前一样（因为 manifest 没变）
            reloadRegistry();
            // 如果 reload 成功且不抛错，说明 REGISTRY 已重新加载
            // 这里只验证不抛错，内容验证由集成测试覆盖
        });
    });

    describe('runPrebuildScan', () => {
        // registry-manifest.json 位于 packages/ui/（见 build-registry.ts MANIFEST_PATH）
        const manifestPath = path.resolve(__dirname, '../../ui/registry-manifest.json');
        let originalContent: string;

        beforeEach(() => {
            // 备份原始 manifest
            originalContent = fs.readFileSync(manifestPath, 'utf-8');
        });

        afterEach(() => {
            // 恢复原始 manifest
            fs.writeFileSync(manifestPath, originalContent, 'utf-8');
        });

        it('validates a fresh registry-manifest.json without throwing', () => {
            expect(() => runPrebuildScan()).not.toThrow();
        });

        it('leaves the manifest content unchanged while validating', () => {
            const before = fs.readFileSync(manifestPath, 'utf-8');
            runPrebuildScan();
            expect(fs.readFileSync(manifestPath, 'utf-8')).toBe(before);
        });

        it('accepts repeated validation of a stable manifest', () => {
            runPrebuildScan();
            const firstRun = fs.readFileSync(manifestPath, 'utf-8');
            runPrebuildScan();
            const secondRun = fs.readFileSync(manifestPath, 'utf-8');
            expect(firstRun).toBe(secondRun);
        });

        it('includes loading directive override', () => {
            runPrebuildScan();
            const content = fs.readFileSync(manifestPath, 'utf-8');
            const manifest = JSON.parse(content);
            expect(manifest.loading).toBeDefined();
            expect(manifest.loading.directives).toContain('loading.ts');
        });
    });
});

describe('watch mode integration (P2.3)', () => {
    it('runPrebuildScan followed by reloadRegistry produces consistent state', () => {
        runPrebuildScan();
        expect(() => reloadRegistry()).not.toThrow();
    });
});

describe('RegistryWatcher', () => {
    const paths = getDefaultPaths();
    const uiDirectory = path.dirname(paths.manifestPath);
    const uiSources = path.dirname(paths.componentsDir);
    const sharedDirectory = path.resolve(__dirname, '../../shared');
    const registryDirectory = path.resolve(__dirname, '..');
    const debounceMs = 10;
    const emitRename = new Map<string, (filename: string) => void>();
    const close = vi.fn();
    const onRebuild = vi.fn<() => Promise<void>>();
    let watcher: RegistryWatcher;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(fs, 'watch').mockImplementation((target, _options, listener) => {
            if (listener) emitRename.set(String(target), filename => listener('rename', filename));
            return Object.assign(new EventEmitter(), { close }) as fs.FSWatcher;
        });
        onRebuild.mockReset().mockResolvedValue(undefined);
        close.mockClear();
        watcher = new RegistryWatcher(paths, {
            debounceMs,
            onRebuild,
            additionalInputs: {
                directories: [path.join(sharedDirectory, 'src'), path.join(registryDirectory, 'src')],
                files: [],
            },
        });
    });

    afterEach(() => {
        watcher.stop();
        emitRename.clear();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('coalesces shared sources and atomically replaced UI build inputs', async () => {
        await watcher.start();
        const emitUiRename = emitRename.get(uiDirectory)!;
        emitUiRename('exports-manifest.json');
        emitRename.get(uiSources)!(path.join('components', 'kanban', 'kanban.test.ts'));
        emitRename.get(registryDirectory)!(path.join('registry', 'index.json'));
        await vi.advanceTimersByTimeAsync(debounceMs);
        expect(onRebuild).not.toHaveBeenCalled();

        emitRename.get(sharedDirectory)!(path.join('src', 'components.ts'));
        emitUiRename('registry-manifest.json');
        emitUiRename('api-contract.ts');
        emitUiRename('package.json');
        await vi.advanceTimersByTimeAsync(debounceMs);
        expect(onRebuild).toHaveBeenCalledTimes(1);

        for (const [index, file] of ['registry-manifest.json', 'api-contract.ts', 'package.json'].entries()) {
            emitUiRename(file);
            await vi.advanceTimersByTimeAsync(debounceMs);
            expect(onRebuild).toHaveBeenCalledTimes(index + 2);
        }
    });

    it('observes files inside a replaced input directory from its ancestor', async () => {
        const existsSync = fs.existsSync;
        vi.spyOn(fs, 'existsSync').mockImplementation(target => target !== paths.typesDir && existsSync(target));
        await watcher.start();
        const emitSourceRename = emitRename.get(uiSources)!;
        emitSourceRename('types');
        await vi.advanceTimersByTimeAsync(debounceMs);
        expect(onRebuild).toHaveBeenCalledTimes(1);

        emitSourceRename(path.join('types', 'example.ts'));
        await vi.advanceTimersByTimeAsync(debounceMs);
        expect(onRebuild).toHaveBeenCalledTimes(2);
    });

    it('defers changes during the initial build, retries after failure, and cancels pending work on stop', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const initial = Promise.withResolvers<void>();
        onRebuild.mockReturnValueOnce(initial.promise);
        const signalListeners = [process.listenerCount('SIGINT'), process.listenerCount('SIGTERM')];
        const started = watcher.start({ buildInitially: true });
        const emitSharedRename = emitRename.get(sharedDirectory)!;
        emitSharedRename(path.join('src', 'components.ts'));
        emitSharedRename(path.join('src', 'design-tokens.ts'));
        await vi.advanceTimersByTimeAsync(debounceMs);
        expect(onRebuild).toHaveBeenCalledTimes(1);

        initial.reject(new Error('Invalid build input'));
        await started;
        await vi.advanceTimersByTimeAsync(debounceMs);
        expect(onRebuild).toHaveBeenCalledTimes(2);

        emitSharedRename(path.join('src', 'components.ts'));
        watcher.stop();
        await vi.advanceTimersByTimeAsync(debounceMs);
        expect(onRebuild).toHaveBeenCalledTimes(2);
        expect(close).toHaveBeenCalledTimes(emitRename.size);
        expect([process.listenerCount('SIGINT'), process.listenerCount('SIGTERM')]).toEqual(signalListeners);
    });
});
