import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { BrutalistConfig, CheckResult, DoctorOptions } from '../src/lib/types.js';
import { FixId } from '../src/lib/types.js';

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
        ':root { --brutal-bg: #fff; }',
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
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('components.json exists');
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
            expect(results).toHaveLength(1);
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
