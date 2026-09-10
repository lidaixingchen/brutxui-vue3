import { describe, it, expect } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { DiagnosticEngine, previewRepair } from '../src/lib/services/diagnostic-service.js';
import { configSchemaRule, configVersionRule, configStyleRule } from '../src/lib/diagnostics/rules/config-rules.js';
import { structureAliasesRule, structureUtilsFileRule, structureUtilsCnRule, resolveUtilsBasePath } from '../src/lib/diagnostics/rules/structure-rules.js';
import { tailwindTokensRule } from '../src/lib/diagnostics/rules/tailwind-rules.js';
import { integrityOrphansRule, findOrphanFilesInVfs } from '../src/lib/diagnostics/rules/integrity-rules.js';
import { ProjectContext } from '../src/lib/project-context.js';
import type { CheckResult, DiagnosticContext, DiagnosticRule } from '../src/lib/diagnostics/types.js';
import { CURRENT_CONFIG_VERSION, SCHEMA_URL, UTILS_TEMPLATE } from '../src/lib/constants.js';
import type { BrutalistConfig, InstalledComponentManifest } from '../src/lib/types.js';

function createDummyCheck(overrides?: Partial<CheckResult>): CheckResult {
    return {
        ruleId: 'test.rule',
        category: 'config',
        name: 'Test Check',
        status: 'error',
        message: 'Test message',
        ...overrides,
    };
}

describe('Declarative Diagnostic Repair Plans & Unified Diff Preview', () => {
    describe('Pure Data Assertions on Rule.planFix()', () => {
        it('configSchemaRule emits a pure patch-config action', async () => {
            expect(configSchemaRule.planFix).toBeDefined();
            const dummyContext: DiagnosticContext = {
                cwd: '/app',
                projectContext: {} as unknown as ProjectContext,
                fs: new MemoryFileSystemAdapter(),
                config: null,
                manifest: null,
                offline: true,
            };
            const result = await configSchemaRule.planFix!(dummyContext, createDummyCheck({ ruleId: 'config.schema' }));
            expect(result.status).toBe('planned');
            if (result.status === 'planned') {
                expect(result.plan.ruleId).toBe('config.schema');
                expect(result.plan.actions).toEqual([
                    {
                        type: 'patch-config',
                        patch: { $schema: SCHEMA_URL },
                        description: 'Add $schema field',
                    },
                ]);
            }
        });

        it('configVersionRule emits a pure patch-config action', async () => {
            const dummyContext: DiagnosticContext = {
                cwd: '/app',
                projectContext: {} as unknown as ProjectContext,
                fs: new MemoryFileSystemAdapter(),
                config: null,
                manifest: null,
                offline: true,
            };
            const result = await configVersionRule.planFix!(dummyContext, createDummyCheck({ ruleId: 'config.version' }));
            expect(result.status).toBe('planned');
            if (result.status === 'planned') {
                expect(result.plan.ruleId).toBe('config.version');
                expect(result.plan.actions).toEqual([
                    {
                        type: 'patch-config',
                        patch: { $version: CURRENT_CONFIG_VERSION },
                        description: `Set $version to ${CURRENT_CONFIG_VERSION}`,
                    },
                ]);
            }
        });

        it('configStyleRule emits a pure patch-config action', async () => {
            const dummyContext: DiagnosticContext = {
                cwd: '/app',
                projectContext: {} as unknown as ProjectContext,
                fs: new MemoryFileSystemAdapter(),
                config: null,
                manifest: null,
                offline: true,
            };
            const result = await configStyleRule.planFix!(dummyContext, createDummyCheck({ ruleId: 'config.style' }));
            expect(result.status).toBe('planned');
            if (result.status === 'planned') {
                expect(result.plan.ruleId).toBe('config.style');
                expect(result.plan.actions).toEqual([
                    {
                        type: 'patch-config',
                        patch: { style: 'brutalism' },
                        description: 'Set style to "brutalism"',
                    },
                ]);
            }
        });

        it('structureAliasesRule emits an ensure-dir action', async () => {
            const fs = new MemoryFileSystemAdapter();
            const projectContext = await ProjectContext.loadUninitialized('/app', {
                fs,
                configOverride: {
                    $schema: SCHEMA_URL,
                    $version: CURRENT_CONFIG_VERSION,
                    style: 'brutalism',
                    tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                    aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
                },
            });
            const ctx: DiagnosticContext = {
                cwd: '/app',
                projectContext,
                fs,
                config: projectContext.config ?? null,
                manifest: null,
                offline: true,
            };

            const result = await structureAliasesRule.planFix!(ctx, createDummyCheck({ ruleId: 'structure.aliases' }));
            expect(result.status).toBe('planned');
            if (result.status === 'planned') {
                expect(result.plan.ruleId).toBe('structure.aliases');
                expect(result.plan.actions).toHaveLength(1);
                const action = result.plan.actions[0];
                expect(action.type).toBe('ensure-dir');
                if (action.type === 'ensure-dir') {
                    expect(action.dirPath).toContain('components');
                }
            }
        });

        it('structureUtilsFileRule emits a write-file action with UTILS_TEMPLATE', async () => {
            const fs = new MemoryFileSystemAdapter();
            const projectContext = await ProjectContext.loadUninitialized('/app', {
                fs,
                configOverride: {
                    $schema: SCHEMA_URL,
                    $version: CURRENT_CONFIG_VERSION,
                    style: 'brutalism',
                    tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                    aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
                },
            });
            const ctx: DiagnosticContext = {
                cwd: '/app',
                projectContext,
                fs,
                config: projectContext.config ?? null,
                manifest: null,
                offline: true,
            };

            const result = await structureUtilsFileRule.planFix!(ctx, createDummyCheck({ ruleId: 'structure.utils-file' }));
            expect(result.status).toBe('planned');
            if (result.status === 'planned') {
                expect(result.plan.ruleId).toBe('structure.utils-file');
                const expectedPath = (await resolveUtilsBasePath(ctx)) + '.ts';
                expect(result.plan.actions).toEqual([
                    {
                        type: 'write-file',
                        filePath: expectedPath,
                        content: UTILS_TEMPLATE,
                        description: 'Create utils.ts with template',
                    },
                ]);
            }
        });

        it('structureUtilsCnRule skips when utils file is missing', async () => {
            const fs = new MemoryFileSystemAdapter();
            const projectContext = await ProjectContext.loadUninitialized('/app', {
                fs,
                configOverride: {
                    $schema: SCHEMA_URL,
                    $version: CURRENT_CONFIG_VERSION,
                    style: 'brutalism',
                    tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                    aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
                },
            });
            const ctx: DiagnosticContext = {
                cwd: '/app',
                projectContext,
                fs,
                config: projectContext.config ?? null,
                manifest: null,
                offline: true,
            };

            const result = await structureUtilsCnRule.planFix!(ctx, createDummyCheck({ ruleId: 'structure.utils-cn' }));
            expect(result.status).toBe('skipped');
            if (result.status === 'skipped') {
                expect(result.reason).toContain('Utils file not found');
            }
        });

        it('tailwindTokensRule emits pure write-file actions without touching disk', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app/src');
            await fs.writeFile('/app/src/styles.css', '@import "tailwindcss";\n');

            const projectContext = await ProjectContext.loadUninitialized('/app', {
                fs,
                configOverride: {
                    $schema: SCHEMA_URL,
                    $version: CURRENT_CONFIG_VERSION,
                    style: 'brutalism',
                    tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                    aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
                },
            });
            const ctx: DiagnosticContext = {
                cwd: '/app',
                projectContext,
                fs,
                config: projectContext.config ?? null,
                manifest: null,
                offline: true,
            };

            const result = await tailwindTokensRule.planFix!(ctx, createDummyCheck({ ruleId: 'tailwind.tokens' }));
            expect(result.status).toBe('planned');
            if (result.status === 'planned') {
                expect(result.plan.ruleId).toBe('tailwind.tokens');
                expect(result.plan.actions.length).toBeGreaterThanOrEqual(1);
                const writeAction = result.plan.actions.find(a => a.type === 'write-file');
                expect(writeAction).toBeDefined();
            }

            // 验证磁盘上的 styles.css 未被修改
            const diskCss = await fs.readFile('/app/src/styles.css', 'utf-8');
            expect(diskCss).not.toContain('/* brutx-ui:start */');
        });

        it('integrityOrphansRule emits remove-path actions for orphan files without touching others', async () => {
            const fs = new MemoryFileSystemAdapter();
            const projectContext = await ProjectContext.loadUninitialized('/app', {
                fs,
                configOverride: {
                    $schema: SCHEMA_URL,
                    $version: CURRENT_CONFIG_VERSION,
                    style: 'brutalism',
                    tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                    aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
                },
            });

            await fs.ensureDir('/app/src/components/ui/button');
            await fs.writeFile('/app/src/components/ui/button/Button.vue', '<template><button/></template>');
            await fs.writeFile('/app/src/components/ui/button/orphan.ts', 'export const stray = true;');

            const manifest: InstalledComponentManifest = {
                components: {
                    button: {
                        name: 'button',
                        version: '1.0.0',
                        files: ['src/components/ui/button/Button.vue'],
                        dependencies: [],
                        devDependencies: [],
                        registryDependencies: [],
                    },
                },
            };

            const ctx: DiagnosticContext = {
                cwd: '/app',
                projectContext,
                fs,
                config: projectContext.config ?? null,
                manifest,
                offline: true,
            };

            const result = await integrityOrphansRule.planFix!(ctx, createDummyCheck({
                ruleId: 'integrity.orphans',
                componentName: 'button',
            }));

            expect(result.status).toBe('planned');
            if (result.status === 'planned') {
                expect(result.plan.ruleId).toBe('integrity.orphans');
                expect(result.plan.actions).toHaveLength(1);
                const action = result.plan.actions[0];
                expect(action.type).toBe('remove-path');
                if (action.type === 'remove-path') {
                    expect(action.targetPath).toContain('orphan.ts');
                }
            }
        });

        it('findOrphanFilesInVfs does not treat root project files or other components as orphans', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app/src/components/ui/button');
            await fs.writeFile('/app/src/main.ts', 'console.log("entry");');
            await fs.writeFile('/app/src/App.vue', '<template><div/></template>');
            await fs.writeFile('/app/src/components/index.ts', 'export * from "./ui";');
            await fs.writeFile('/app/src/components/ui/button/Button.vue', '<template><button/></template>');
            await fs.writeFile('/app/src/components/ui/button/orphan.ts', 'export const orphan = 1;');

            const buttonEntry = {
                name: 'button',
                version: '1.0.0',
                files: ['src/components/ui/button/Button.vue'],
                dependencies: [],
                devDependencies: [],
                registryDependencies: [],
            };

            const allManifestFiles = new Set([
                path.resolve('/app/src/components/ui/button/Button.vue'),
            ]);

            const orphans = await findOrphanFilesInVfs('/app', buttonEntry, fs, allManifestFiles);
            expect(orphans).toEqual(['src/components/ui/button/orphan.ts']);
            expect(orphans).not.toContain('src/main.ts');
            expect(orphans).not.toContain('src/App.vue');
            expect(orphans).not.toContain('src/components/index.ts');
        });
    });

    describe('DiagnosticEngine.previewRepair()', () => {
        it('generates unified diff for components.json without modifying disk', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');
            await fs.writeJson('/app/components.json', {
                style: 'brutalism',
                tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            });

            const preview = await previewRepair({
                cwd: '/app',
                fs,
                categories: ['config'],
            });

            expect(preview.plans.length).toBeGreaterThanOrEqual(2);
            expect(preview.fileDiffs).toHaveLength(1);
            expect(preview.fileDiffs[0].filePath).toBe('components.json');
            expect(preview.fileDiffs[0].unifiedDiff).toContain('"$schema"');
            expect(preview.fileDiffs[0].unifiedDiff).toContain('"$version"');

            // 验证磁盘上的 components.json 没有任何修改
            const diskConfig = await fs.readJson<BrutalistConfig>('/app/components.json');
            expect(diskConfig.$schema).toBeUndefined();
            expect(diskConfig.$version).toBeUndefined();
        });

        it('generates unified diff for code files during repair preview', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app/src');
            await fs.writeJson('/app/components.json', {
                $schema: SCHEMA_URL,
                $version: CURRENT_CONFIG_VERSION,
                style: 'brutalism',
                tailwind: { config: 'tailwind.config.js', css: '@/styles.css' },
                aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            });
            await fs.writeFile('/app/src/styles.css', '@import "tailwindcss";\n');

            const preview = await previewRepair({
                cwd: '/app',
                fs,
                categories: ['tailwind'],
            });

            expect(preview.plans.length).toBe(1);
            expect(preview.fileDiffs.some(f => f.filePath.endsWith('styles.css'))).toBe(true);
            const cssDiff = preview.fileDiffs.find(f => f.filePath.endsWith('styles.css'))!;
            expect(cssDiff.unifiedDiff).toContain('+/* brutx-ui:start */');
            expect(cssDiff.unifiedDiff).toContain('+/* brutx-ui:end */');

            // 验证磁盘上的 styles.css 未被修改
            const rawCss = await fs.readFile('/app/src/styles.css', 'utf-8');
            expect(rawCss).not.toContain('/* brutx-ui:start */');
        });
    });

    describe('Pre-flight Collision Detection & Mutex Gates', () => {
        it('detects and throws CliError when two rules target the same file with conflicting contents', async () => {
            const conflictingRuleA: DiagnosticRule = {
                id: 'custom.conflict-a',
                category: 'custom',
                name: 'Conflict Rule A',
                async check() {
                    return createDummyCheck({
                        ruleId: 'custom.conflict-a',
                        name: 'Conflict A',
                        fixId: 'fix-conflict',
                    });
                },
                async planFix() {
                    return {
                        status: 'planned',
                        plan: {
                            fixId: 'fix-conflict',
                            ruleId: 'custom.conflict-a',
                            description: 'Write Version A',
                            actions: [
                                {
                                    type: 'write-file',
                                    filePath: '/app/src/conflict.txt',
                                    content: 'VERSION_A',
                                },
                            ],
                        },
                    };
                },
            };

            const conflictingRuleB: DiagnosticRule = {
                id: 'custom.conflict-b',
                category: 'custom',
                name: 'Conflict Rule B',
                async check() {
                    return createDummyCheck({
                        ruleId: 'custom.conflict-b',
                        name: 'Conflict B',
                        fixId: 'fix-conflict',
                    });
                },
                async planFix() {
                    return {
                        status: 'planned',
                        plan: {
                            fixId: 'fix-conflict',
                            ruleId: 'custom.conflict-b',
                            description: 'Write Version B',
                            actions: [
                                {
                                    type: 'write-file',
                                    filePath: '/app/src/conflict.txt',
                                    content: 'VERSION_B',
                                },
                            ],
                        },
                    };
                },
            };

            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app/src');

            const engine = new DiagnosticEngine([conflictingRuleA, conflictingRuleB]);

            await expect(engine.previewRepair({ cwd: '/app', fs })).rejects.toThrow(
                /Conflicting write actions detected for path/
            );
        });

        it('detects write-file and remove-path collision on the same path', async () => {
            const writeRule: DiagnosticRule = {
                id: 'custom.write',
                category: 'custom',
                name: 'Write Rule',
                async check() {
                    return createDummyCheck({ ruleId: 'custom.write', fixId: 'write' });
                },
                async planFix() {
                    return {
                        status: 'planned',
                        plan: {
                            fixId: 'write',
                            ruleId: 'custom.write',
                            description: 'Write file',
                            actions: [{ type: 'write-file', filePath: '/app/clash.txt', content: 'hello' }],
                        },
                    };
                },
            };

            const removeRule: DiagnosticRule = {
                id: 'custom.remove',
                category: 'custom',
                name: 'Remove Rule',
                async check() {
                    return createDummyCheck({ ruleId: 'custom.remove', fixId: 'remove' });
                },
                async planFix() {
                    return {
                        status: 'planned',
                        plan: {
                            fixId: 'remove',
                            ruleId: 'custom.remove',
                            description: 'Remove file',
                            actions: [{ type: 'remove-path', targetPath: '/app/clash.txt' }],
                        },
                    };
                },
            };

            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');
            const engine = new DiagnosticEngine([writeRule, removeRule]);

            await expect(engine.previewRepair({ cwd: '/app', fs })).rejects.toThrow(
                /Conflicting actions detected: path.*is targeted by both write-file and remove-path/
            );
        });

        it('allows multiple rules to target the same file if their content is identical (idempotent write)', async () => {
            const ruleA: DiagnosticRule = {
                id: 'custom.dup-a',
                category: 'custom',
                name: 'Dup Rule A',
                async check() {
                    return createDummyCheck({ ruleId: 'custom.dup-a', fixId: 'dup' });
                },
                async planFix() {
                    return {
                        status: 'planned',
                        plan: {
                            fixId: 'dup',
                            ruleId: 'custom.dup-a',
                            description: 'Write Same Content',
                            actions: [{ type: 'write-file', filePath: '/app/same.txt', content: 'IDENTICAL' }],
                        },
                    };
                },
            };

            const ruleB: DiagnosticRule = {
                id: 'custom.dup-b',
                category: 'custom',
                name: 'Dup Rule B',
                async check() {
                    return createDummyCheck({ ruleId: 'custom.dup-b', fixId: 'dup' });
                },
                async planFix() {
                    return {
                        status: 'planned',
                        plan: {
                            fixId: 'dup',
                            ruleId: 'custom.dup-b',
                            description: 'Write Same Content',
                            actions: [{ type: 'write-file', filePath: '/app/same.txt', content: 'IDENTICAL' }],
                        },
                    };
                },
            };

            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');

            const engine = new DiagnosticEngine([ruleA, ruleB]);
            const preview = await engine.previewRepair({ cwd: '/app', fs });
            expect(preview.plans).toHaveLength(2);
            expect(preview.fileDiffs).toHaveLength(1);
        });

        it('detects case-insensitive write conflict on Windows/macOS', async () => {
            const ruleA: DiagnosticRule = {
                id: 'custom.case-a',
                category: 'custom',
                name: 'Case A',
                async check() {
                    return createDummyCheck({ ruleId: 'custom.case-a', fixId: 'case' });
                },
                async planFix() {
                    return {
                        status: 'planned',
                        plan: {
                            fixId: 'case',
                            ruleId: 'custom.case-a',
                            description: 'Write Utils.txt',
                            actions: [{ type: 'write-file', filePath: '/app/Utils.txt', content: 'UPPER' }],
                        },
                    };
                },
            };

            const ruleB: DiagnosticRule = {
                id: 'custom.case-b',
                category: 'custom',
                name: 'Case B',
                async check() {
                    return createDummyCheck({ ruleId: 'custom.case-b', fixId: 'case' });
                },
                async planFix() {
                    return {
                        status: 'planned',
                        plan: {
                            fixId: 'case',
                            ruleId: 'custom.case-b',
                            description: 'Write utils.txt',
                            actions: [{ type: 'write-file', filePath: '/app/utils.txt', content: 'LOWER' }],
                        },
                    };
                },
            };

            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');
            const engine = new DiagnosticEngine([ruleA, ruleB]);

            if (process.platform === 'win32' || process.platform === 'darwin') {
                await expect(engine.previewRepair({ cwd: '/app', fs })).rejects.toThrow(
                    /Conflicting write actions detected for path/
                );
            }
        });
    });

    describe('Fresh Project Init Repair Closure', () => {
        it('writes components.json to disk even when originalConfig is null', async () => {
            const fs = new MemoryFileSystemAdapter();
            await fs.ensureDir('/app');

            const initConfigRule: DiagnosticRule = {
                id: 'config.init',
                category: 'config',
                name: 'Initialize Configuration',
                requiresConfig: false,
                async check(ctx) {
                    if (!ctx.config) {
                        return createDummyCheck({
                            ruleId: 'config.init',
                            status: 'error',
                            fixId: 'init-config',
                            message: 'Config missing',
                        });
                    }
                    return createDummyCheck({ ruleId: 'config.init', status: 'pass' });
                },
                async planFix() {
                    return {
                        status: 'planned',
                        plan: {
                            fixId: 'init-config',
                            ruleId: 'config.init',
                            description: 'Initialize components.json',
                            actions: [
                                {
                                    type: 'patch-config',
                                    patch: {
                                        $schema: SCHEMA_URL,
                                        $version: CURRENT_CONFIG_VERSION,
                                        style: 'brutalism',
                                    },
                                },
                            ],
                        },
                    };
                },
            };

            const engine = new DiagnosticEngine([initConfigRule]);
            const repairReport = await engine.repair({ cwd: '/app', fs });

            expect(repairReport.configUpdated).toBe(true);
            const writtenConfig = await fs.readJson<BrutalistConfig>('/app/components.json');
            expect(writtenConfig.$schema).toBe(SCHEMA_URL);
            expect(writtenConfig.$version).toBe(CURRENT_CONFIG_VERSION);
            expect(writtenConfig.style).toBe('brutalism');
        });
    });
});
