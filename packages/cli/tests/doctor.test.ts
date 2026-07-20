import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { BrutalistConfig, CheckResult, DoctorOptions, BrutxManifest, InstalledComponentManifest } from '../src/lib/types.js';
import { FixId } from '../src/lib/types.js';
import { computeInstalledContentHash } from '../src/lib/manifest.js';

vi.mock('../src/lib/registry.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/lib/registry.js')>();
    return { ...actual, readConfigSafe: vi.fn() };
});

vi.mock('../src/lib/constants.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/lib/constants.js')>();
    return {
        ...actual,
        getBrutalistCssStyles: vi.fn().mockResolvedValue('/* injected brutalist css tokens */'),
    };
});

vi.mock('../src/lib/project.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/lib/project.js')>();
    return { ...actual, resolveAliasPath: vi.fn() };
});

import * as registry from '../src/lib/registry.js';
import * as constants from '../src/lib/constants.js';
import * as project from '../src/lib/project.js';
import { doctor } from '../src/commands/doctor.js';

const mockedReadConfigSafe = vi.mocked(registry.readConfigSafe);
const mockedGetBrutalistCssStyles = vi.mocked(constants.getBrutalistCssStyles);
const mockedResolveAliasPath = vi.mocked(project.resolveAliasPath);

function makeConfig(overrides: Partial<BrutalistConfig> = {}): BrutalistConfig {
    return {
        $schema: 'https://example.com/schema.json',
        $version: 1,
        style: 'brutalism',
        tailwind: { config: 'tailwind.config.js', css: '@/styles/globals.css' },
        aliases: {
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables',
        },
        ...overrides,
    };
}

async function createTempProject(): Promise<string> {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-doctor-'));
    await fs.writeJson(path.join(cwd, 'tsconfig.json'), {
        compilerOptions: {
            baseUrl: '.',
            paths: { '@/*': ['./src/*'] },
        },
    });
    await fs.ensureDir(path.join(cwd, 'src'));
    return cwd;
}

async function setupHealthyProject(cwd: string): Promise<void> {
    await fs.writeJson(path.join(cwd, 'package.json'), {
        dependencies: {
            vue: '^3.5.0',
            clsx: '^2.0.0',
            'tailwind-merge': '^2.0.0',
            'class-variance-authority': '^0.7.0',
            'reka-ui': '^2.9.0',
            '@lucide/vue': '^0.400.0',
        },
    });
    await fs.ensureDir(path.join(cwd, 'src', 'styles'));
    await fs.writeFile(
        path.join(cwd, 'src', 'styles', 'globals.css'),
        ':root { --color-brutal-bg: #fff; }\n.bg-brutal-primary { color: red; }\n.animate-in { animation: fade-in; }',
    );
    await fs.ensureDir(path.join(cwd, 'src', 'components'));
    await fs.ensureDir(path.join(cwd, 'src', 'lib'));
    await fs.writeFile(
        path.join(cwd, 'src', 'lib', 'utils.ts'),
        'export function cn(...inputs: any[]) { return inputs.join(" "); }',
    );
    await fs.writeJson(path.join(cwd, 'components.json'), { style: 'brutalism' });
}

async function runDoctor(cwd: string, options: Partial<DoctorOptions> = {}): Promise<CheckResult[]> {
    let output = '';
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: unknown) => {
        output += String(chunk);
        return true;
    }) as typeof process.stdout.write);

    try {
        await doctor({ cwd, json: true, ...options });
    } catch {
        // CliError is expected when there are errors
    }

    writeSpy.mockRestore();

    if (output) {
        return JSON.parse(output) as CheckResult[];
    }
    return [];
}

function suppressConsole(): void {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
}

beforeEach(() => {
    mockedResolveAliasPath.mockImplementation(async (alias: string, cwd: string) => {
        const match = alias.match(/^(@[^/]*|~)\/(.*)/);
        if (!match) return path.join(cwd, alias);
        const [, , relativePath] = match;
        return path.join(cwd, 'src', relativePath);
    });
    mockedGetBrutalistCssStyles.mockResolvedValue('/* injected brutalist css tokens */');
    // P1-5：避免 checkRegistryReachability 发真实网络请求，默认返回 200 OK
    vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200, statusText: 'OK' }),
    );
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// checkConfigExists
// ---------------------------------------------------------------------------
describe('checkConfigExists', () => {
    it('should pass when components.json exists', async () => {
        const cwd = await createTempProject();
        try {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const nodeCheck = results.find((r) => r.name === 'Node.js version');
            expect(nodeCheck?.status).toBe('pass');

            const check = results.find((r) => r.name === 'components.json exists');
            expect(check?.status).toBe('pass');
            expect(check?.message).toContain('found');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should error when components.json does not exist', async () => {
        const cwd = await createTempProject();
        try {
            mockedReadConfigSafe.mockResolvedValue(null);
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'components.json exists');
            expect(check?.status).toBe('error');
            expect(check?.message).toContain('not found');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should skip all other checks when config is null', async () => {
        const cwd = await createTempProject();
        try {
            mockedReadConfigSafe.mockResolvedValue(null);
            const results = await runDoctor(cwd, { silent: true });
            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('Node.js version');
            expect(results[1].name).toBe('components.json exists');
        } finally {
            await fs.remove(cwd);
        }
    });
});

// ---------------------------------------------------------------------------
// checkSchema
// ---------------------------------------------------------------------------
describe('checkSchema', () => {
    it('should pass when $schema is present', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig({ $schema: 'https://example.com/schema.json' }));
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === '$schema field present');
            expect(check?.status).toBe('pass');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should warn when $schema is missing', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            const config = makeConfig();
            delete config.$schema;
            mockedReadConfigSafe.mockResolvedValue(config);
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === '$schema field present');
            expect(check?.status).toBe('warn');
            expect(check?.fixId).toBe(FixId.AddSchema);
        } finally {
            await fs.remove(cwd);
        }
    });
});

// ---------------------------------------------------------------------------
// checkStyle
// ---------------------------------------------------------------------------
describe('checkStyle', () => {
    it('should pass when style field is present', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig({ style: 'brutalism' }));
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'style field present');
            expect(check?.status).toBe('pass');
            expect(check?.message).toContain('brutalism');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should warn when style field is missing', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig({ style: '' }));
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'style field present');
            expect(check?.status).toBe('warn');
            expect(check?.fixId).toBe(FixId.SetStyle);
        } finally {
            await fs.remove(cwd);
        }
    });
});

// ---------------------------------------------------------------------------
// checkTailwindCss
// ---------------------------------------------------------------------------
describe('checkTailwindCss', () => {
    it('should pass when CSS file exists and contains tokens', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'tailwind.css contains BrutxUI tokens');
            expect(check?.status).toBe('pass');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should error when CSS file does not exist', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.remove(path.join(cwd, 'src', 'styles', 'globals.css'));
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'tailwind.css points to real file');
            expect(check?.status).toBe('error');
            expect(check?.message).toContain('not found');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should error when CSS file exists but missing tokens', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.writeFile(
                path.join(cwd, 'src', 'styles', 'globals.css'),
                'body { margin: 0; }',
            );
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'tailwind.css contains BrutxUI tokens');
            expect(check?.status).toBe('error');
            expect(check?.fixId).toBe(FixId.InjectCssTokens);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should warn when tailwind config imports deprecated brutalism plugin', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.writeFile(
                path.join(cwd, 'tailwind.config.js'),
                `const brutalism = require('brutx-ui-vue/brutalism-plugin');
export default { plugins: [brutalism] };`,
            );
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });

            const check = results.find((r) => r.name === 'deprecated brutalism plugin');
            expect(check?.status).toBe('warn');
            expect(check?.message).toContain('styles.css');
        } finally {
            await fs.remove(cwd);
        }
    });
});

// ---------------------------------------------------------------------------
// checkAliases
// ---------------------------------------------------------------------------
describe('checkAliases', () => {
    it('should pass when both components dir and utils file exist', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const componentsCheck = results.find((r) => r.name.includes('aliases.components'));
            const utilsCheck = results.find((r) => r.name.includes('aliases.utils'));
            expect(componentsCheck?.status).toBe('pass');
            expect(utilsCheck?.status).toBe('pass');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should warn when components directory does not exist', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.remove(path.join(cwd, 'src', 'components'));
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name.includes('aliases.components'));
            expect(check?.status).toBe('warn');
            expect(check?.fixId).toBe(FixId.CreateComponentsDir);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should error when utils file does not exist', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.remove(path.join(cwd, 'src', 'lib', 'utils.ts'));
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name.includes('aliases.utils'));
            expect(check?.status).toBe('error');
            expect(check?.fixId).toBe(FixId.CreateUtilsFile);
        } finally {
            await fs.remove(cwd);
        }
    });
});

// ---------------------------------------------------------------------------
// checkDependencies
// ---------------------------------------------------------------------------
describe('checkDependencies', () => {
    it('should pass when all required and optional deps are installed', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const depChecks = results.filter((r) => r.name.includes('installed'));
            expect(depChecks.length).toBeGreaterThan(0);
            expect(depChecks.every((c) => c.status === 'pass')).toBe(true);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should error when a required dependency is missing', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.writeJson(path.join(cwd, 'package.json'), {
                dependencies: {
                    vue: '^3.5.0',
                    clsx: '^2.0.0',
                    'tailwind-merge': '^2.0.0',
                    '@lucide/vue': '^0.400.0',
                },
            });
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const cvaCheck = results.find((r) => r.name.includes('class-variance-authority'));
            expect(cvaCheck?.status).toBe('error');
            expect(cvaCheck?.message).toContain('Missing');

            const rekaCheck = results.find((r) => r.name.includes('reka-ui'));
            expect(rekaCheck?.status).toBe('error');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should warn when optional dependency @lucide/vue is missing', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.writeJson(path.join(cwd, 'package.json'), {
                dependencies: {
                    vue: '^3.5.0',
                    clsx: '^2.0.0',
                    'tailwind-merge': '^2.0.0',
                    'class-variance-authority': '^0.7.0',
                    'reka-ui': '^2.9.0',
                },
            });
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const optionalCheck = results.find((r) => r.name.includes('@lucide/vue'));
            expect(optionalCheck?.status).toBe('warn');
            expect(optionalCheck?.message).toContain('Optional');
        } finally {
            await fs.remove(cwd);
        }
    });
});

// ---------------------------------------------------------------------------
// checkWorkspaceHint
// ---------------------------------------------------------------------------
describe('checkWorkspaceHint', () => {
    it('should not emit workspace hint in non-monorepo project', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const hint = results.find((r) => r.name === 'workspace hint');
            expect(hint).toBeUndefined();
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should not emit workspace hint when cwd is the workspace root itself', async () => {
        const root = await createTempProject();
        try {
            await setupHealthyProject(root);
            await fs.writeFile(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(root, { silent: true });
            const hint = results.find((r) => r.name === 'workspace hint');
            expect(hint).toBeUndefined();
        } finally {
            await fs.remove(root);
        }
    });

    it('should warn when running inside a monorepo subpackage', async () => {
        const root = await createTempProject();
        try {
            await fs.writeFile(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n');
            const subpkg = path.join(root, 'apps', 'web');
            await fs.ensureDir(subpkg);
            await setupHealthyProject(subpkg);
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(subpkg, { silent: true });
            const hint = results.find((r) => r.name === 'workspace hint');
            expect(hint).toBeDefined();
            expect(hint?.status).toBe('warn');
            expect(hint?.message).toContain('monorepo subpackage');
            expect(hint?.message).toContain('pnpm-workspace.yaml');
        } finally {
            await fs.remove(root);
        }
    });
});

// ---------------------------------------------------------------------------
// checkUtilsFunction
// ---------------------------------------------------------------------------
describe('checkUtilsFunction', () => {
    it('should pass when cn() function exists in utils file', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'cn() function exists');
            expect(check?.status).toBe('pass');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should error when utils file does not exist', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.remove(path.join(cwd, 'src', 'lib', 'utils.ts'));
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'cn() function exists');
            expect(check?.status).toBe('error');
            expect(check?.message).toContain('not found');
            expect(check?.fixId).toBe(FixId.AddCnFunction);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should error when utils file exists but cn() function is missing', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.writeFile(
                path.join(cwd, 'src', 'lib', 'utils.ts'),
                'export function helper() { return 42; }',
            );
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'cn() function exists');
            expect(check?.status).toBe('error');
            expect(check?.message).toContain('cn() function not found');
            expect(check?.fixId).toBe(FixId.AddCnFunction);
        } finally {
            await fs.remove(cwd);
        }
    });
});

// ---------------------------------------------------------------------------
// checkConfigVersion
// ---------------------------------------------------------------------------
describe('checkConfigVersion', () => {
    it('should pass when $version matches current version', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig({ $version: 1 }));
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'config version');
            expect(check?.status).toBe('pass');
            expect(check?.message).toContain('1');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should warn when $version is missing', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            const config = makeConfig();
            delete config.$version;
            mockedReadConfigSafe.mockResolvedValue(config);
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'config version');
            expect(check?.status).toBe('warn');
            expect(check?.message).toContain('missing');
            expect(check?.fixId).toBe(FixId.AddConfigVersion);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should warn when $version is outdated', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig({ $version: 0 }));
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'config version');
            expect(check?.status).toBe('warn');
            expect(check?.message).toContain('outdated');
            expect(check?.fixId).toBe(FixId.AddConfigVersion);
        } finally {
            await fs.remove(cwd);
        }
    });
});

// ---------------------------------------------------------------------------
// Fixes
// ---------------------------------------------------------------------------
describe('fixes', () => {
    it('AddSchema: should add $schema to components.json', async () => {
        const cwd = await createTempProject();
        try {
            suppressConsole();
            await setupHealthyProject(cwd);
            const config = makeConfig();
            delete config.$schema;
            mockedReadConfigSafe.mockResolvedValue(config);

            await runDoctor(cwd, { fix: true, yes: true, fixOnly: FixId.AddSchema });

            const written = await fs.readJson(path.join(cwd, 'components.json'));
            expect(written.$schema).toBe('https://lidaixingchen.github.io/brutxui-vue3/schema.json');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('SetStyle: should set style to "brutalism"', async () => {
        const cwd = await createTempProject();
        try {
            suppressConsole();
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig({ style: '' }));

            await runDoctor(cwd, { fix: true, yes: true, fixOnly: FixId.SetStyle });

            const written = await fs.readJson(path.join(cwd, 'components.json'));
            expect(written.style).toBe('brutalism');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('InjectCssTokens: should inject CSS tokens into existing CSS file', async () => {
        const cwd = await createTempProject();
        try {
            suppressConsole();
            await setupHealthyProject(cwd);
            await fs.writeFile(
                path.join(cwd, 'src', 'styles', 'globals.css'),
                'body { margin: 0; }',
            );
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            await runDoctor(cwd, { fix: true, yes: true, fixOnly: FixId.InjectCssTokens });

            const content = await fs.readFile(path.join(cwd, 'src', 'styles', 'globals.css'), 'utf-8');
            expect(content).toContain('body { margin: 0; }');
            expect(content).toContain('/* injected brutalist css tokens */');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('CreateComponentsDir: should create missing components directory', async () => {
        const cwd = await createTempProject();
        try {
            suppressConsole();
            await setupHealthyProject(cwd);
            await fs.remove(path.join(cwd, 'src', 'components'));
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            expect(await fs.pathExists(path.join(cwd, 'src', 'components'))).toBe(false);

            await runDoctor(cwd, { fix: true, yes: true, fixOnly: FixId.CreateComponentsDir });

            expect(await fs.pathExists(path.join(cwd, 'src', 'components'))).toBe(true);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('CreateUtilsFile: should create missing utils file', async () => {
        const cwd = await createTempProject();
        try {
            suppressConsole();
            await setupHealthyProject(cwd);
            await fs.remove(path.join(cwd, 'src', 'lib', 'utils.ts'));
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            expect(await fs.pathExists(path.join(cwd, 'src', 'lib', 'utils.ts'))).toBe(false);

            await runDoctor(cwd, { fix: true, yes: true, fixOnly: FixId.CreateUtilsFile });

            const exists = await fs.pathExists(path.join(cwd, 'src', 'lib', 'utils.ts'));
            expect(exists).toBe(true);
            const content = await fs.readFile(path.join(cwd, 'src', 'lib', 'utils.ts'), 'utf-8');
            expect(content).toContain('export function cn');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('AddCnFunction: should add cn() function to existing utils file', async () => {
        const cwd = await createTempProject();
        try {
            suppressConsole();
            await setupHealthyProject(cwd);
            await fs.writeFile(
                path.join(cwd, 'src', 'lib', 'utils.ts'),
                'export function helper() { return 42; }',
            );
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            await runDoctor(cwd, { fix: true, yes: true, fixOnly: FixId.AddCnFunction });

            const content = await fs.readFile(path.join(cwd, 'src', 'lib', 'utils.ts'), 'utf-8');
            expect(content).toContain('export function helper');
            expect(content).toContain('export function cn');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('AddConfigVersion: should add $version to components.json', async () => {
        const cwd = await createTempProject();
        try {
            suppressConsole();
            await setupHealthyProject(cwd);
            const config = makeConfig();
            delete config.$version;
            mockedReadConfigSafe.mockResolvedValue(config);

            await runDoctor(cwd, { fix: true, yes: true, fixOnly: FixId.AddConfigVersion });

            const written = await fs.readJson(path.join(cwd, 'components.json'));
            expect(written.$version).toBe(1);
        } finally {
            await fs.remove(cwd);
        }
    });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe('edge cases', () => {
    it('should handle corrupted components.json gracefully', async () => {
        const cwd = await createTempProject();
        try {
            await fs.writeFile(path.join(cwd, 'components.json'), '{ this is not valid JSON }}}');
            mockedReadConfigSafe.mockResolvedValue(null);
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'components.json exists');
            expect(check?.status).toBe('error');
            expect(results).toHaveLength(2);
            expect(results[0].name).toBe('Node.js version');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should handle CSS file that does not exist at all', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.remove(path.join(cwd, 'src', 'styles'));
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });
            const check = results.find((r) => r.name === 'tailwind.css points to real file');
            expect(check?.status).toBe('error');
            expect(check?.message).toContain('not found');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should handle utils.ts that exists but is partially corrupted (no cn function)', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.writeFile(
                path.join(cwd, 'src', 'lib', 'utils.ts'),
                '// corrupted file\nexport const FOO = "bar";',
            );
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });

            const cnCheck = results.find((r) => r.name === 'cn() function exists');
            expect(cnCheck?.status).toBe('error');
            expect(cnCheck?.message).toContain('cn() function not found');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should report no fixable issues when all checks pass', async () => {
        const cwd = await createTempProject();
        try {
            suppressConsole();
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const results = await runDoctor(cwd, { fix: true, yes: true });
            const nonPass = results.filter((r) => r.status !== 'pass');
            expect(nonPass).toHaveLength(0);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should handle missing package.json gracefully for dependency checks', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.remove(path.join(cwd, 'package.json'));
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });

            const depChecks = results.filter((r) => r.name.includes('installed'));
            expect(depChecks).toHaveLength(0);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should detect export const cn in addition to export function cn', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await fs.writeFile(
                path.join(cwd, 'src', 'lib', 'utils.ts'),
                'export const cn = (...inputs: any[]) => inputs.join(" ");',
            );
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const results = await runDoctor(cwd, { silent: true });

            const cnCheck = results.find((r) => r.name === 'cn() function exists');
            expect(cnCheck?.status).toBe('pass');
        } finally {
            await fs.remove(cwd);
        }
    });
});

// ---------------------------------------------------------------------------
// Manifest-driven integrity drift detection (P0-1)
// ---------------------------------------------------------------------------

function makeManifestEntry(
    componentName: string,
    files: string[],
    installedContentHash: string,
    overrides: Partial<InstalledComponentManifest> = {},
): InstalledComponentManifest {
    return {
        name: componentName,
        registrySource: 'https://example.test/registry',
        integrity: `sha256-${componentName}-integrity`,
        installedContentHash,
        installedAt: '2026-07-16T00:00:00.000Z',
        files,
        dependencies: ['vue'],
        registryDependencies: [],
        category: 'action',
        examples: [],
        status: 'stable',
        ...overrides,
    };
}

async function writeManifest(cwd: string, manifest: BrutxManifest): Promise<void> {
    await fs.ensureDir(path.join(cwd, '.brutx'));
    await fs.writeJson(path.join(cwd, '.brutx', 'manifest.json'), manifest, { spaces: 4 });
}

async function setupManifestProject(
    cwd: string,
    components: Record<string, { files: Array<{ relPath: string; content: string }>; registryDeps?: string[] }>,
): Promise<BrutxManifest> {
    const manifestComponents: Record<string, InstalledComponentManifest> = {};
    for (const [name, spec] of Object.entries(components)) {
        const absPaths: string[] = [];
        for (const f of spec.files) {
            const absPath = path.join(cwd, f.relPath);
            await fs.ensureDir(path.dirname(absPath));
            await fs.writeFile(absPath, f.content, 'utf-8');
            absPaths.push(absPath);
        }
        const installedContentHash = await computeInstalledContentHash(absPaths);
        manifestComponents[name] = makeManifestEntry(
            name,
            absPaths.map(p => path.relative(cwd, p).split(path.sep).join('/')),
            installedContentHash,
            { registryDependencies: spec.registryDeps ?? [] },
        );
    }
    const manifest: BrutxManifest = { version: 1, components: manifestComponents };
    await writeManifest(cwd, manifest);
    return manifest;
}

describe('manifest-driven integrity checks', () => {
    beforeEach(() => {
        suppressConsole();
    });

    it('passes when component files match installed snapshot', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await setupManifestProject(cwd, {
                button: {
                    files: [
                        { relPath: 'src/components/ui/button/Button.vue', content: '<template><button /></template>' },
                        { relPath: 'src/components/ui/button/button-variants.ts', content: 'export const buttonVariants = {}' },
                    ],
                },
            });
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const results = await runDoctor(cwd, { silent: true });
            const filesCheck = results.find((r) => r.name === 'component button files present');
            const integrityCheck = results.find((r) => r.name === 'component button integrity');
            const orphansCheck = results.find((r) => r.name === 'component button no orphans');

            expect(filesCheck?.status).toBe('pass');
            expect(integrityCheck?.status).toBe('pass');
            expect(orphansCheck?.status).toBe('pass');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('warns with RestoreIntegrity fixId when component file is modified (drift)', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await setupManifestProject(cwd, {
                button: {
                    files: [
                        { relPath: 'src/components/ui/button/Button.vue', content: '<template><button /></template>' },
                    ],
                },
            });
            // 用户手动修改组件文件
            await fs.writeFile(
                path.join(cwd, 'src/components/ui/button/Button.vue'),
                '<template><button class="modified" /></template>',
                'utf-8',
            );
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const results = await runDoctor(cwd, { silent: true });
            const integrityCheck = results.find((r) => r.name === 'component button integrity');

            expect(integrityCheck?.status).toBe('warn');
            expect(integrityCheck?.fixId).toBe(FixId.RestoreIntegrity);
            expect(integrityCheck?.message).toContain('drift');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('errors when manifest-recorded file is missing', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await setupManifestProject(cwd, {
                button: {
                    files: [
                        { relPath: 'src/components/ui/button/Button.vue', content: '<template><button /></template>' },
                        { relPath: 'src/components/ui/button/button-variants.ts', content: 'export const v = {}' },
                    ],
                },
            });
            // 删除 manifest 记录的文件
            await fs.remove(path.join(cwd, 'src/components/ui/button/button-variants.ts'));
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const results = await runDoctor(cwd, { silent: true });
            const filesCheck = results.find((r) => r.name === 'component button files present');

            expect(filesCheck?.status).toBe('error');
            expect(filesCheck?.fixId).toBe(FixId.RestoreIntegrity);
            expect(filesCheck?.message).toContain('Missing');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('warns with RemoveOrphans fixId when orphan file exists', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await setupManifestProject(cwd, {
                button: {
                    files: [
                        { relPath: 'src/components/ui/button/Button.vue', content: '<template><button /></template>' },
                    ],
                },
            });
            // 添加孤儿文件
            await fs.writeFile(
                path.join(cwd, 'src/components/ui/button/old-Button.vue'),
                '<template><old-button /></template>',
                'utf-8',
            );
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const results = await runDoctor(cwd, { silent: true });
            const orphansCheck = results.find((r) => r.name === 'component button no orphans');

            expect(orphansCheck?.status).toBe('warn');
            expect(orphansCheck?.fixId).toBe(FixId.RemoveOrphans);
            expect(orphansCheck?.message).toContain('orphan');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('warns when registryDependency is not installed (closure check)', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await setupManifestProject(cwd, {
                button: {
                    files: [
                        { relPath: 'src/components/ui/button/Button.vue', content: '<template><button /></template>' },
                    ],
                    registryDeps: ['primitive'],
                },
            });
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const results = await runDoctor(cwd, { silent: true });
            const depsCheck = results.find((r) => r.name === 'component button registry deps closed');

            expect(depsCheck?.status).toBe('warn');
            expect(depsCheck?.message).toContain('primitive');
            expect(depsCheck?.message).toContain('not installed');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('falls back to legacy scan when no manifest exists', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            // 不写 manifest，直接放组件文件
            await fs.ensureDir(path.join(cwd, 'src/components/ui/button'));
            await fs.writeFile(
                path.join(cwd, 'src/components/ui/button/Button.vue'),
                '<template><button /></template>',
                'utf-8',
            );
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const results = await runDoctor(cwd, { silent: true });
            // legacy scan 输出应包含 "legacy scan"
            const componentChecks = results.filter((r) => r.name.startsWith('component'));
            expect(componentChecks.length).toBeGreaterThan(0);
            expect(componentChecks.some((c) => c.message.includes('legacy scan'))).toBe(true);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('does not false-positive when files are unchanged (order stability)', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            // manifest.files 顺序与磁盘写入顺序天然一致（installedContentHash 按此序算）
            await setupManifestProject(cwd, {
                button: {
                    files: [
                        { relPath: 'src/components/ui/button/Button.vue', content: '<template><button>first</button></template>' },
                        { relPath: 'src/components/ui/button/button-variants.ts', content: 'export const a = 1' },
                    ],
                },
            });
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            // 再次运行 doctor，文件未改动
            const results = await runDoctor(cwd, { silent: true });
            const integrityCheck = results.find((r) => r.name === 'component button integrity');
            expect(integrityCheck?.status).toBe('pass');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('RemoveOrphans fix deletes orphan files', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            await setupManifestProject(cwd, {
                button: {
                    files: [
                        { relPath: 'src/components/ui/button/Button.vue', content: '<template><button /></template>' },
                    ],
                },
            });
            const orphanPath = path.join(cwd, 'src/components/ui/button/old-Button.vue');
            await fs.writeFile(orphanPath, '<template><old /></template>', 'utf-8');
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            await runDoctor(cwd, { fix: true, yes: true, fixOnly: FixId.RemoveOrphans });

            expect(await fs.pathExists(orphanPath)).toBe(false);
        } finally {
            await fs.remove(cwd);
        }
    });
});

// ---------------------------------------------------------------------------
// checkRegistryReachability (P1-5)
// ---------------------------------------------------------------------------
describe('checkRegistryReachability (P1-5)', () => {
    it('reports pass for default registry when fetch returns 200', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
                new Response('{}', { status: 200, statusText: 'OK' }),
            );

            const results = await runDoctor(cwd, { silent: true });
            const reachChecks = results.filter((r) => r.name.startsWith('registry source'));
            expect(reachChecks).toHaveLength(1);
            expect(reachChecks[0].status).toBe('pass');
            expect(reachChecks[0].message).toContain('Reachable');
            expect(fetchSpy).toHaveBeenCalledTimes(1);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('reports warn when fetch returns non-200 status', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            vi.spyOn(global, 'fetch').mockResolvedValue(
                new Response('Not Found', { status: 404, statusText: 'Not Found' }),
            );

            const results = await runDoctor(cwd, { silent: true });
            const reachCheck = results.find((r) => r.name.startsWith('registry source'));
            expect(reachCheck?.status).toBe('warn');
            expect(reachCheck?.message).toContain('Unreachable');
            expect(reachCheck?.message).toContain('404');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('reports warn when fetch throws (network error)', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            vi.spyOn(global, 'fetch').mockRejectedValue(new Error('connect ECONNREFUSED'));

            const results = await runDoctor(cwd, { silent: true });
            const reachCheck = results.find((r) => r.name.startsWith('registry source'));
            expect(reachCheck?.status).toBe('warn');
            expect(reachCheck?.message).toContain('Unreachable');
            expect(reachCheck?.message).toContain('ECONNREFUSED');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('probes all configured registries in order', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig({
                registries: [
                    'https://primary.example.com',
                    'https://mirror.example.com',
                ],
            }));
            const fetchSpy = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
                const u = typeof url === 'string' ? url : url.toString();
                if (new URL(u).hostname === 'primary.example.com') {
                    return new Response('err', { status: 500, statusText: 'Internal Server Error' });
                }
                return new Response('{}', { status: 200, statusText: 'OK' });
            });
            vi.spyOn(global, 'fetch').mockImplementation(fetchSpy as never);

            const results = await runDoctor(cwd, { silent: true });
            const reachChecks = results.filter((r) => r.name.startsWith('registry source'));
            expect(reachChecks).toHaveLength(2);
            expect(reachChecks[0].status).toBe('warn'); // primary 500
            expect(reachChecks[1].status).toBe('pass'); // mirror 200
            expect(fetchSpy).toHaveBeenCalledTimes(2);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('skips network probing in offline mode and reports pass with skipped message', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            mockedReadConfigSafe.mockResolvedValue(makeConfig({
                registries: ['https://primary.example.com'],
            }));
            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
                new Response('{}', { status: 200 }),
            );

            const results = await runDoctor(cwd, { silent: true, offline: true });
            const reachCheck = results.find((r) => r.name.startsWith('registry source'));
            expect(reachCheck?.status).toBe('pass');
            expect(reachCheck?.message).toContain('offline');
            expect(reachCheck?.message).toContain('skipped');
            expect(fetchSpy).not.toHaveBeenCalled();
        } finally {
            await fs.remove(cwd);
        }
    });

    it('checks directory existence for local path sources', async () => {
        const cwd = await createTempProject();
        try {
            await setupHealthyProject(cwd);
            const existingDir = path.join(cwd, 'local-registry');
            await fs.ensureDir(existingDir);
            mockedReadConfigSafe.mockResolvedValue(makeConfig({
                registries: [existingDir, path.join(cwd, 'missing-registry')],
            }));
            // 本地路径源不应触发 fetch
            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
                new Response('{}', { status: 200 }),
            );

            const results = await runDoctor(cwd, { silent: true });
            const reachChecks = results.filter((r) => r.name.startsWith('registry source'));
            expect(reachChecks).toHaveLength(2);
            expect(reachChecks[0].status).toBe('pass');
            expect(reachChecks[0].message).toContain('Local registry directory exists');
            expect(reachChecks[1].status).toBe('error');
            expect(reachChecks[1].message).toContain('does not exist');
            expect(fetchSpy).not.toHaveBeenCalled();
        } finally {
            await fs.remove(cwd);
        }
    });
});

describe('doctor --sbom (P1-6)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    async function writeManifestWithComponents(cwd: string): Promise<void> {
        const manifest: BrutxManifest = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    registrySource: 'https://example.test',
                    integrity: 'sha256-abc123',
                    installedAt: '2026-07-16T00:00:00.000Z',
                    files: ['src/components/ui/button/Button.vue'],
                    dependencies: ['reka-ui', '@lucide/vue'],
                    registryDependencies: [],
                    examples: [],
                },
                dialog: {
                    name: 'dialog',
                    registrySource: 'https://example.test',
                    integrity: 'sha256-def456',
                    installedAt: '2026-07-16T00:00:00.000Z',
                    files: ['src/components/ui/dialog/Dialog.vue'],
                    dependencies: ['reka-ui'],
                    registryDependencies: ['button'],
                    examples: [],
                    version: 'v1.2.0',
                },
            },
        };
        await fs.ensureDir(path.join(cwd, '.brutx'));
        await fs.writeJson(path.join(cwd, '.brutx', 'manifest.json'), manifest);
    }

    it('generates CycloneDX SBOM from installed manifest', async () => {
        const cwd = await createTempProject();
        try {
            await writeManifestWithComponents(cwd);

            const output = path.join(cwd, 'brutx-sbom.json');
            await doctor({ cwd, sbom: true, sbomOutput: output });

            const sbom = await fs.readJson(output);
            expect(sbom.bomFormat).toBe('CycloneDX');
            expect(sbom.specVersion).toBe('1.5');
            expect(sbom.metadata.component.name).toBe('user-project');

            const refs = sbom.components.map((c: { 'bom-ref': string }) => c['bom-ref']);
            // 字典序：brutx:button, brutx:dialog, npm:@lucide/vue, npm:reka-ui
            expect(refs).toEqual([
                'brutx:button',
                'brutx:dialog',
                'npm:@lucide/vue',
                'npm:reka-ui',
            ]);

            const dialog = sbom.components.find((c: { 'bom-ref': string }) => c['bom-ref'] === 'brutx:dialog');
            expect(dialog.version).toBe('v1.2.0');
            expect(dialog.dependencies).toContain('brutx:button');
            expect(dialog.hashes[0].content).toBe('def456');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('errors when no components are installed', async () => {
        const cwd = await createTempProject();
        try {
            // No manifest → should throw CONFIG_NOT_FOUND
            await expect(doctor({ cwd, sbom: true })).rejects.toThrow(/No installed components/);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('defaults output path to ./brutx-sbom.json', async () => {
        const cwd = await createTempProject();
        try {
            await writeManifestWithComponents(cwd);
            await doctor({ cwd, sbom: true, silent: true });

            const defaultPath = path.join(cwd, 'brutx-sbom.json');
            const exists = await fs.pathExists(defaultPath);
            expect(exists).toBe(true);
        } finally {
            await fs.remove(cwd);
        }
    });
});
