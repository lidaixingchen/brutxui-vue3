import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import {
    CustomRuleLoader,
    defineDiagnosticRule,
    defineDiagnosticRules,
} from '../src/lib/diagnostics/custom-rule-loader.js';
import { DiagnosticEngine } from '../src/lib/diagnostics/engine.js';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import type { BrutalistConfig, DiagnosticRule } from '../src/lib/index.js';

describe('Custom Rules Loader & Fault Isolation Sandbox', () => {
    describe('DSL Factory Functions', () => {
        it('defineDiagnosticRule returns the same rule object with type inference', () => {
            const rule: DiagnosticRule = {
                id: 'custom.my-rule',
                category: 'custom',
                name: 'My Custom Rule',
                check: async () => ({
                    ruleId: 'custom.my-rule',
                    category: 'custom',
                    name: 'My Custom Rule',
                    status: 'pass',
                    message: 'Passed custom check.',
                }),
            };

            const defined = defineDiagnosticRule(rule);
            expect(defined).toBe(rule);
            expect(defined.id).toBe('custom.my-rule');
        });

        it('defineDiagnosticRules returns array of rules', () => {
            const rules: DiagnosticRule[] = [
                {
                    id: 'custom.rule-1',
                    category: 'custom',
                    name: 'Rule 1',
                    check: async () => ({
                        ruleId: 'custom.rule-1',
                        name: 'Rule 1',
                        status: 'pass',
                        message: 'Rule 1 passed',
                    }),
                },
            ];

            const defined = defineDiagnosticRules(rules);
            expect(defined).toEqual(rules);
            expect(defined).toHaveLength(1);
        });
    });

    describe('CustomRuleLoader & Sandbox Execution', () => {
        const testTmpDir = path.resolve(process.cwd(), 'tests/.tmp-rules');

        it('loads TypeScript rules dynamically via CustomRuleLoader', async () => {
            await fs.ensureDir(testTmpDir);
            const ruleFile = path.join(testTmpDir, 'valid-rule.ts');
            const ruleCode = `
                export default {
                    id: 'custom.sample-ts',
                    category: 'custom',
                    name: 'Sample TypeScript Rule',
                    async check(ctx) {
                        return {
                            ruleId: 'custom.sample-ts',
                            category: 'custom',
                            name: 'Sample TypeScript Rule',
                            status: 'pass',
                            message: 'Dynamic TS rule loaded and executed successfully.',
                        };
                    },
                };
            `;
            await fs.writeFile(ruleFile, ruleCode, 'utf-8');

            try {
                const loader = new CustomRuleLoader(testTmpDir);
                const loadedRules = await loader.loadPlugin(ruleFile);

                expect(loadedRules).toHaveLength(1);
                expect(loadedRules[0].id).toBe('custom.sample-ts');

                const memFs = new MemoryFileSystemAdapter();
                await memFs.ensureDir('/project');

                const engine = new DiagnosticEngine();
                await engine.loadPlugins([ruleFile], testTmpDir);

                const report = await engine.diagnose({
                    cwd: '/project',
                    fs: memFs,
                    ruleIds: ['custom.sample-ts'],
                });

                expect(report.getByRuleId('custom.sample-ts')).toHaveLength(1);
                expect(report.getByRuleId('custom.sample-ts')[0].status).toBe('pass');
            } finally {
                await fs.remove(testTmpDir);
            }
        });

        it('isolates syntax and runtime errors in custom plugin loading without crashing', async () => {
            await fs.ensureDir(testTmpDir);
            const brokenRuleFile = path.join(testTmpDir, 'broken-rule.ts');
            const brokenCode = `
                throw new Error("Simulated plugin initialization crash");
            `;
            await fs.writeFile(brokenRuleFile, brokenCode, 'utf-8');

            try {
                const loader = new CustomRuleLoader(testTmpDir);
                const loadedRules = await loader.loadPlugin(brokenRuleFile);

                expect(loadedRules).toHaveLength(1);
                expect(loadedRules[0].id).toContain('custom.loader-error');

                const memFs = new MemoryFileSystemAdapter();
                const engine = new DiagnosticEngine(loadedRules);
                const report = await engine.diagnose({
                    cwd: '/project',
                    fs: memFs,
                });

                expect(report.hasErrors).toBe(true);
                const errorCheck = report.checks.find(c => c.ruleId.startsWith('custom.loader-error'));
                expect(errorCheck).toBeDefined();
                expect(errorCheck?.status).toBe('error');
                expect(errorCheck?.message).toContain('Simulated plugin initialization crash');
            } finally {
                await fs.remove(testTmpDir);
            }
        });

        it('isolates uncaught exceptions inside rule check method (Fault Isolation Sandbox)', async () => {
            const throwingRule: DiagnosticRule = {
                id: 'custom.throw-error',
                category: 'custom',
                name: 'Throwing Rule',
                async check() {
                    throw new Error('Uncaught exception inside rule check logic');
                },
            };

            const memFs = new MemoryFileSystemAdapter();
            const engine = new DiagnosticEngine([throwingRule]);

            const report = await engine.diagnose({
                cwd: '/project',
                fs: memFs,
            });

            expect(report.hasErrors).toBe(true);
            const check = report.getByRuleId('custom.throw-error')[0];
            expect(check).toBeDefined();
            expect(check.status).toBe('error');
            expect(check.category).toBe('custom');
            expect(check.message).toContain('Uncaught exception inside rule check logic');
        });

        it('supports plugins configuration in components.json automatically', async () => {
            await fs.ensureDir(testTmpDir);
            const pluginFile = path.join(testTmpDir, 'configured-plugin.ts');
            const pluginCode = `
                export default [
                    {
                        id: 'custom.configured-rule',
                        category: 'custom',
                        name: 'Configured Plugin Rule',
                        async check() {
                            return {
                                ruleId: 'custom.configured-rule',
                                category: 'custom',
                                name: 'Configured Plugin Rule',
                                status: 'pass',
                                message: 'Loaded from components.json plugins array',
                            };
                        },
                    },
                ];
            `;
            await fs.writeFile(pluginFile, pluginCode, 'utf-8');

            try {
                const memFs = new MemoryFileSystemAdapter();
                await memFs.ensureDir('/project');

                const config: BrutalistConfig = {
                    $schema: 'https://lidaixingchen/schema.json',
                    $version: 1,
                    style: 'brutalism',
                    tailwind: { config: '', css: 'src/main.css' },
                    aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
                    plugins: [pluginFile],
                };

                await memFs.writeFile('/project/components.json', JSON.stringify(config, null, 2));

                const engine = new DiagnosticEngine();
                const report = await engine.diagnose({
                    cwd: '/project',
                    fs: memFs,
                    ruleIds: ['custom.configured-rule'],
                });

                expect(report.getByRuleId('custom.configured-rule')).toHaveLength(1);
                expect(report.getByRuleId('custom.configured-rule')[0].status).toBe('pass');
            } finally {
                await fs.remove(testTmpDir);
            }
        });
    });
});
