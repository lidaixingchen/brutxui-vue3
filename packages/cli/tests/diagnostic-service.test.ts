import { describe, it, expect } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { diagnose, repair, DiagnosticEngine } from '../src/lib/services/diagnostic-service.js';
import { isNodeVersionSupported, nodeVersionRule, workspaceHintRule } from '../src/lib/diagnostics/rules/env-rules.js';
import type { DiagnosticRule } from '../src/lib/diagnostics/types.js';

describe('DiagnosticEngine & Env Rules (Ticket 1)', () => {
    describe('isNodeVersionSupported', () => {
        it('supports >= 22.5.0', () => {
            expect(isNodeVersionSupported('22.5.0')).toBe(true);
            expect(isNodeVersionSupported('22.5.1')).toBe(true);
            expect(isNodeVersionSupported('22.6.0')).toBe(true);
            expect(isNodeVersionSupported('23.0.0')).toBe(true);
            expect(isNodeVersionSupported('22.5.0-nightly')).toBe(true);
        });

        it('rejects < 22.5.0', () => {
            expect(isNodeVersionSupported('22.4.9')).toBe(false);
            expect(isNodeVersionSupported('20.10.0')).toBe(false);
            expect(isNodeVersionSupported('18.0.0')).toBe(false);
        });
    });

    describe('diagnose() in MemoryFileSystemAdapter', () => {
        it('produces pure data report with env rules on clean sandbox', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');

            const report = await diagnose({
                cwd: '/app',
                fs,
                categories: ['env'],
            });

            expect(report.summary.total).toBeGreaterThanOrEqual(1);
            expect(report.getByCategory('env').length).toBe(report.summary.total);
            expect(report.getByRuleId('env.node-version').length).toBe(1);
            expect(report.hasErrors).toBe(false);
        });

        it('supports filtering by ruleIds and categories', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');

            const report = await diagnose({
                cwd: '/app',
                fs,
                ruleIds: ['env.node-version'],
            });

            expect(report.summary.total).toBe(1);
            expect(report.checks[0].ruleId).toBe('env.node-version');
            expect(report.getByRuleId('env.node-version')).toHaveLength(1);
        });

        it('detects monorepo subpackages correctly', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/monorepo');
            await fs.writeFile('/monorepo/pnpm-workspace.yaml', 'packages:\n  - "packages/*"\n');
            await fs.ensureDir('/monorepo/packages/pkg-a');
            await fs.writeFile('/monorepo/packages/pkg-a/package.json', JSON.stringify({ name: 'pkg-a' }));

            const report = await diagnose({
                cwd: '/monorepo/packages/pkg-a',
                fs,
                ruleIds: ['env.workspace-hint'],
            });

            expect(report.summary.total).toBe(1);
            const hint = report.getByRuleId('env.workspace-hint')[0];
            expect(hint).toBeDefined();
            expect(hint.status).toBe('warn');
            expect(hint.message).toContain('Detected monorepo subpackage');
        });

        it('handles custom rules in DiagnosticEngine', async () => {
            const customRule: DiagnosticRule = {
                id: 'custom.test',
                category: 'integrity',
                name: 'Custom Test Rule',
                async check() {
                    return {
                        ruleId: 'custom.test',
                        category: 'integrity',
                        name: 'Custom Test Rule',
                        status: 'warn',
                        message: 'Custom warning message',
                    };
                },
            };

            const engine = new DiagnosticEngine([customRule]);
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');

            const report = await engine.diagnose({ cwd: '/app', fs });
            expect(report.summary.total).toBe(1);
            expect(report.hasWarnings).toBe(true);
            expect(report.getByStatus('warn')).toHaveLength(1);
            expect(report.getByCategory('integrity')).toHaveLength(1);
        });
    });

    describe('Config Domain Rules & Atomic Repair (Ticket 2)', () => {
        it('reports error when components.json does not exist', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');

            const report = await diagnose({
                cwd: '/app',
                fs,
                categories: ['config'],
            });

            expect(report.summary.total).toBe(1);
            expect(report.hasErrors).toBe(true);
            const existsCheck = report.getByRuleId('config.exists')[0];
            expect(existsCheck.status).toBe('error');
        });

        it('detects and fixes missing schema, version and style', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');
            // 初始化一个不完整的配置
            const initialConfig = {
                tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            };
            await fs.writeJson('/app/components.json', initialConfig);

            const initialReport = await diagnose({
                cwd: '/app',
                fs,
                categories: ['config'],
            });

            expect(initialReport.getByRuleId('config.exists')[0].status).toBe('pass');
            expect(initialReport.getByRuleId('config.schema')[0].status).toBe('warn');
            expect(initialReport.getByRuleId('config.version')[0].status).toBe('warn');
            expect(initialReport.getByRuleId('config.style')[0].status).toBe('warn');
            expect(initialReport.fixableCount).toBe(3);

            // 执行自愈
            const repairReport = await repair({
                cwd: '/app',
                fs,
                categories: ['config'],
            });

            expect(repairReport.applied).toHaveLength(3);
            expect(repairReport.failed).toHaveLength(0);
            expect(repairReport.configUpdated).toBe(true);

            // 检查写回后的内存文件
            const updatedConfig = await fs.readJson<any>('/app/components.json');
            expect(updatedConfig.$schema).toBeDefined();
            expect(updatedConfig.$version).toBe(1);
            expect(updatedConfig.style).toBe('brutalism');

            // 验证最新报告中已全部 pass
            expect(repairReport.freshReport.getByRuleId('config.schema')[0].status).toBe('pass');
            expect(repairReport.freshReport.getByRuleId('config.version')[0].status).toBe('pass');
            expect(repairReport.freshReport.getByRuleId('config.style')[0].status).toBe('pass');
            expect(repairReport.freshReport.hasErrors).toBe(false);
            expect(repairReport.freshReport.hasWarnings).toBe(false);
        });

        it('respects dryRun option and rolls back changes', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');
            const initialConfig = {
                tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            };
            await fs.writeJson('/app/components.json', initialConfig);

            const repairReport = await repair({
                cwd: '/app',
                fs,
                categories: ['config'],
                dryRun: true,
            });

            expect(repairReport.applied).toHaveLength(3);
            expect(repairReport.configUpdated).toBe(false);

            // 文件应保持未修改
            const persistedConfig = await fs.readJson<any>('/app/components.json');
            expect(persistedConfig.$schema).toBeUndefined();
            expect(persistedConfig.$version).toBeUndefined();
        });

        it('detects deprecated brutalism plugin in tailwind config', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');
            await fs.writeJson('/app/components.json', {
                $schema: 'https://example.com/schema.json',
                $version: 1,
                style: 'brutalism',
                tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            });
            await fs.writeFile('/app/tailwind.config.js', `
                module.exports = {
                    plugins: [require('brutx-ui-vue/brutalism-plugin')],
                };
            `);

            const report = await diagnose({
                cwd: '/app',
                fs,
                ruleIds: ['config.deprecated-plugin'],
            });

            expect(report.summary.total).toBe(1);
            const pluginCheck = report.getByRuleId('config.deprecated-plugin')[0];
            expect(pluginCheck.status).toBe('warn');
            expect(pluginCheck.message).toContain('deprecated empty brutalism plugin');
        });
    });

    describe('Tailwind & Structure Rules with Topological Repair (Ticket 3)', () => {
        it('diagnoses and fixes tailwind tokens missing in existing css file', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app/src');
            await fs.writeJson('/app/components.json', {
                $schema: 'https://example.com/schema.json',
                $version: 1,
                style: 'brutalism',
                tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            });
            await fs.writeFile('/app/src/styles.css', '@import "tailwindcss";');

            const report = await diagnose({
                cwd: '/app',
                fs,
                categories: ['tailwind'],
            });

            expect(report.getByRuleId('tailwind.css-exists')[0].status).toBe('pass');
            const tokenCheck = report.getByRuleId('tailwind.tokens')[0];
            expect(tokenCheck.status).toBe('error');
            expect(tokenCheck.fixId).toBe('inject-css-tokens');

            // 执行自愈
            const repairReport = await repair({
                cwd: '/app',
                fs,
                categories: ['tailwind'],
            });

            expect(repairReport.applied).toHaveLength(1);
            const updatedCss = await fs.readFile('/app/src/styles.css', 'utf-8');
            expect(updatedCss).toContain('/* brutx-ui:start */');
            expect(updatedCss).toContain('/* brutx-ui:end */');
            expect(repairReport.freshReport.getByRuleId('tailwind.tokens')[0].status).toBe('pass');
        });

        it('performs deterministic topological repair for structure: directory -> utils file -> cn function', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app/src');
            await fs.writeJson('/app/package.json', {
                dependencies: {
                    vue: '^3.5.0',
                    clsx: '^2.0.0',
                    'tailwind-merge': '^2.0.0',
                    'class-variance-authority': '^0.7.0',
                    'reka-ui': '^2.9.0',
                },
            });
            await fs.writeJson('/app/components.json', {
                $schema: 'https://example.com/schema.json',
                $version: 1,
                style: 'brutalism',
                tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            });

            // 初始状态：无 components 目录，无 utils.ts 文件
            const initialReport = await diagnose({
                cwd: '/app',
                fs,
                categories: ['structure'],
            });

            expect(initialReport.getByRuleId('structure.aliases')[0].status).toBe('warn');
            expect(initialReport.getByRuleId('structure.utils-file')[0].status).toBe('error');
            expect(initialReport.getByRuleId('structure.utils-cn')[0].status).toBe('error');

            // 一键自愈：由于拓扑顺序，aliases (创建目录) 与 utils-file (创建文件) 先执行，保证 cn() 追加安全
            const repairReport = await repair({
                cwd: '/app',
                fs,
                categories: ['structure'],
            });

            expect(repairReport.applied.length).toBeGreaterThanOrEqual(2);
            expect(repairReport.failed).toHaveLength(0);

            // 验证 components 目录已创建
            expect(await fs.pathExists('/app/src/components')).toBe(true);

            // 验证 utils.ts 已创建且包含 cn 函数
            expect(await fs.pathExists('/app/src/lib/utils.ts')).toBe(true);
            const utilsContent = await fs.readFile('/app/src/lib/utils.ts', 'utf-8');
            expect(utilsContent).toContain('export function cn');

            // 验证复检全 pass
            expect(repairReport.freshReport.getByRuleId('structure.aliases')[0].status).toBe('pass');
            expect(repairReport.freshReport.getByRuleId('structure.utils-file')[0].status).toBe('pass');
            expect(repairReport.freshReport.getByRuleId('structure.utils-cn')[0].status).toBe('pass');
        });

        it('safely appends cn() into existing utils without duplicating imports', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app/src/lib');
            await fs.writeJson('/app/components.json', {
                $schema: 'https://example.com/schema.json',
                $version: 1,
                style: 'brutalism',
                tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            });
            // 手写一个只有 helper 的 utils.ts
            await fs.writeFile('/app/src/lib/utils.ts', 'import { clsx } from "clsx";\nexport function myHelper() {}\n');

            const repairReport = await repair({
                cwd: '/app',
                fs,
                ruleIds: ['structure.utils-cn'],
            });

            expect(repairReport.applied).toHaveLength(1);
            const content = await fs.readFile('/app/src/lib/utils.ts', 'utf-8');
            expect(content).toContain('tailwind-merge');
            expect(content).toContain('export function cn');

            // 再次执行自愈，应为 skipped，不重复注入
            const secondRepair = await repair({
                cwd: '/app',
                fs,
                ruleIds: ['structure.utils-cn'],
            });
            expect(secondRepair.applied).toHaveLength(0);
        });
    });
});

