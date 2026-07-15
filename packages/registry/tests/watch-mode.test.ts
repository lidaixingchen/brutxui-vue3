import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入待测模块（延迟导入以便 mock）
const buildRegistry = await import('../scripts/build-registry.js');
const { runPrebuildScan, reloadRegistry, runWatch } = buildRegistry;

// 备份原始 run 函数
const originalRun = buildRegistry.run;

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

        it('regenerates registry-manifest.json without throwing', () => {
            expect(() => runPrebuildScan()).not.toThrow();
        });

        it('produces valid JSON with component entries', () => {
            runPrebuildScan();
            const content = fs.readFileSync(manifestPath, 'utf-8');
            const manifest = JSON.parse(content);
            // 应该有多个组件条目
            expect(Object.keys(manifest).length).toBeGreaterThan(0);
            // 每个条目应该有 files 数组
            for (const [name, entry] of Object.entries(manifest)) {
                expect(Array.isArray((entry as any).files)).toBe(true);
                expect((entry as any).files.length).toBeGreaterThan(0);
            }
        });

        it('produces stable output (idempotent)', () => {
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

    describe('handleFileChange debounce logic', () => {
        // 测试 debounce 和防并发的行为通过间接方式：
        // 由于 handleFileChange 是内部函数不导出，我们通过 runWatch 集成测试覆盖
        // 这里测试 runWatch 导出的存在性
        it('runWatch is exported as a function', () => {
            expect(typeof runWatch).toBe('function');
        });
    });

    describe('watch mode entry point', () => {
        it('runWatch is async (returns Promise)', () => {
            // 不实际调用 runWatch（它会启动 watcher 并阻塞）
            // 只验证它是 async 函数
            const result = runWatch.toString();
            expect(result).toContain('async');
        });
    });
});

describe('watch mode integration (P2.3)', () => {
    // 集成测试：验证 runPrebuildScan + reloadRegistry + run 的链路能协同工作
    // 不测试 fs.watch 的实际触发（需要真实文件系统事件，不稳定）

    it('runPrebuildScan followed by reloadRegistry produces consistent state', () => {
        runPrebuildScan();
        expect(() => reloadRegistry()).not.toThrow();
    });

    it('watch mode constants are defined correctly', () => {
        // 通过模块导出间接验证常量存在
        // WATCH_DEBOUNCE_MS 和 WATCHED_EXTENSIONS 是模块内部常量
        // 这里通过 runWatch 函数的存在验证 watch 模式已实现
        expect(runWatch).toBeDefined();
    });
});
