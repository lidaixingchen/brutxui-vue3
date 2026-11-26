import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { CliError } from '../src/lib/error.js';
import type { BrutalistConfig } from '../src/lib/types.js';
import { SHARED_DEPENDENCIES, COMPONENT_DEPENDENCIES, BRUTX_CSS_START_MARKER, BRUTX_CSS_END_MARKER } from '../src/lib/constants.js';
import { installPackages } from '../src/lib/package-manager.js';
import { resetGlobalDryRun, setGlobalDryRun } from '../src/lib/global-dry-run.js';
import { logger } from '../src/lib/logger.js';
import { runProcess } from '../src/lib/run-process.js';

const mockInput = vi.fn();
const mockConfirm = vi.fn();

vi.mock('@inquirer/prompts', () => ({
    input: (args: unknown) => mockInput(args),
    confirm: (args: unknown) => mockConfirm(args),
}));

vi.mock('../src/lib/package-manager.js', () => ({
    installPackages: vi.fn(),
    getInstallCommand: vi.fn(() => 'npm install'),
}));

vi.mock('../src/lib/run-process.js', () => ({
    runProcess: vi.fn(),
}));

async function setupProject(files: Record<string, string | object> = {}): Promise<string> {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-init-test-'));
    await fs.ensureDir(path.join(cwd, 'src'));
    await fs.writeJson(path.join(cwd, 'package.json'), {
        dependencies: { vue: '^3.5.0', tailwindcss: '^4.0.0' },
    });
    for (const [relPath, content] of Object.entries(files)) {
        const fullPath = path.join(cwd, relPath);
        await fs.ensureDir(path.dirname(fullPath));
        if (typeof content === 'string') {
            await fs.writeFile(fullPath, content, 'utf-8');
        } else {
            await fs.writeJson(fullPath, content, { spaces: 2 });
        }
    }
    return cwd;
}

describe('init', { timeout: 25000 }, () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(installPackages).mockReset();
        mockInput.mockImplementation(async (opt: { default?: string }) => opt.default ?? '');
        mockConfirm.mockImplementation(async (opt: { default?: boolean }) => opt.default ?? true);
    });

    it.each(['global flag', 'environment variable'] as const)('plans without writing or installing via the %s', async (source) => {
        const css = '@import "tailwindcss";\n:root { --custom: red; }\n';
        const cwd = await setupProject({
            'src/index.css': css,
            'nuxt.config.ts': 'export default defineNuxtConfig({})\n',
            'pnpm-lock.yaml': '',
        });
        if (source === 'global flag') setGlobalDryRun(true);
        else vi.stubEnv('BRUTX_DRY_RUN', '1');

        try {
            const { init } = await import('../src/commands/init.js');
            const before = await fs.readdir(cwd, { recursive: true });

            await init({ cwd, yes: true, vscode: true, silent: true });

            expect(await fs.readdir(cwd, { recursive: true })).toEqual(before);
            expect(await fs.readFile(path.join(cwd, 'src/index.css'), 'utf8')).toBe(css);
            expect(await fs.readFile(path.join(cwd, 'nuxt.config.ts'), 'utf8')).toBe('export default defineNuxtConfig({})\n');
            expect(installPackages).not.toHaveBeenCalled();
        } finally {
            resetGlobalDryRun();
            vi.unstubAllEnvs();
            await fs.remove(cwd);
        }
    });

    it('shows the physical stylesheet target when Nuxt configuration needs a manual edit', async () => {
        const nuxtConfig = "export default defineNuxtConfig({ srcDir: 'frontend/', components: false })\n";
        const cwd = await setupProject({
            'package.json': { dependencies: { nuxt: '^4.0.0', vue: '^3.5.0' } },
            'nuxt.config.ts': nuxtConfig,
            'components.json': {
                tailwind: { config: '', css: '~/assets/css/main.css' },
                aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            },
            'tsconfig.json': { compilerOptions: { paths: { '~/*': ['./other/*'] } } },
            'other/assets/css/main.css': '.project-style {}',
        });
        const info = vi.spyOn(logger, 'info').mockImplementation(() => {});
        try {
            const { init } = await import('../src/commands/init.js');
            await init({ cwd, yes: true, dryRun: true, silent: true });

            expect(info).toHaveBeenCalledWith('    css: ["~~/other/assets/css/main.css"],');
            expect(await fs.readFile(path.join(cwd, 'nuxt.config.ts'), 'utf8')).toBe(nuxtConfig);
        } finally {
            info.mockRestore();
            await fs.remove(cwd);
        }
    });

    it('retries only the missing dependencies and keeps existing project files', async () => {
        const cwd = await setupProject({
            'src/index.css': '@import "tailwindcss";\n',
            'pnpm-lock.yaml': '',
        });
        const customStyles = `${BRUTX_CSS_START_MARKER}\n:root { --user-color: red; }\n${BRUTX_CSS_END_MARKER}`;
        try {
            const { init } = await import('../src/commands/init.js');
            vi.mocked(installPackages).mockRejectedValueOnce(new Error('pnpm exited with code 42'));

            await expect(init({ cwd, yes: true, vscode: true, silent: true })).rejects.toMatchObject({
                exitCode: 1,
                message: expect.stringContaining('code 42'),
            });
            expect(installPackages).toHaveBeenNthCalledWith(1, 'pnpm', [...SHARED_DEPENDENCIES, ...COMPONENT_DEPENDENCIES], cwd);

            const configPath = path.join(cwd, 'components.json');
            const config = await fs.readJson(configPath);
            config.aliases.components = '@/custom-components';
            const configText = JSON.stringify(config);
            const stylesPath = path.join(cwd, config.tailwind.tokensFile);
            const snippetsPath = path.join(cwd, '.vscode/brutx.code-snippets');
            const customSnippets = '{"Custom": {"prefix": "custom"}}';
            await fs.writeFile(configPath, configText);
            await fs.writeFile(stylesPath, customStyles);
            await fs.writeFile(snippetsPath, customSnippets);

            const dependencies = [...SHARED_DEPENDENCIES, ...COMPONENT_DEPENDENCIES];
            const alreadyInstalled = dependencies.shift()!;
            const packageJson = path.join(cwd, 'package.json');
            await fs.writeJson(packageJson, { dependencies: { vue: '^3.5.0', [alreadyInstalled]: 'custom-version' } });
            vi.mocked(installPackages).mockImplementationOnce(async (_pm, missing) => {
                const manifest = await fs.readJson(packageJson);
                for (const dependency of [alreadyInstalled, ...missing]) {
                    manifest.dependencies[dependency] ??= 'installed-version';
                    await fs.outputJson(path.join(cwd, 'node_modules', dependency, 'package.json'), { name: dependency });
                }
                await fs.writeJson(packageJson, manifest);
            });

            await init({ cwd, yes: true, vscode: true, silent: true });

            expect(installPackages).toHaveBeenNthCalledWith(2, 'pnpm', dependencies, cwd);
            expect(await fs.readFile(configPath, 'utf8')).toBe(configText);
            expect(await fs.readFile(stylesPath, 'utf8')).toBe(customStyles);
            expect(await fs.readFile(snippetsPath, 'utf8')).toBe(customSnippets);
            expect(await fs.pathExists(path.join(cwd, 'src/custom-components/ui'))).toBe(true);

            await init({ cwd, yes: true, vscode: true, silent: true });

            expect(installPackages).toHaveBeenCalledTimes(2);
            expect(await fs.readFile(configPath, 'utf8')).toBe(configText);
        } finally {
            await fs.remove(cwd);
        }
    });

    it.each([
        { declaration: '2.0.0', hoistedVersion: '1.0.0', repair: true },
        { declaration: '^2.0.0', hoistedVersion: '2.1.0', repair: false },
        { declaration: '^2.0.0', hoistedVersion: '2.1.0-beta.1', repair: true },
        { declaration: 'workspace:^2.0.0', hoistedVersion: '1.0.0', repair: true },
        { declaration: 'file:../../vendor/reka-ui', hoistedVersion: '1.0.0', repair: false },
    ])('plans compatible hoists and repairs mismatched ranges for $declaration and $hoistedVersion', async ({ declaration, hoistedVersion, repair }) => {
        const workspace = await setupProject({
            'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
            'package.json': {
                dependencies: Object.fromEntries(SHARED_DEPENDENCIES.map(name => [name, '^1.0.0'])),
            },
            'apps/example/package.json': { dependencies: { '@lucide/vue': '~1.6.0', 'reka-ui': declaration } },
        });
        const cwd = path.join(workspace, 'apps/example');
        const info = vi.spyOn(logger, 'info');
        try {
            for (const [name, version] of [
                ...SHARED_DEPENDENCIES.map(name => [name, '1.0.0']),
                ['@lucide/vue', '1.6.2'],
                ['reka-ui', hoistedVersion],
            ]) {
                await fs.outputJson(path.join(workspace, 'node_modules', name, 'package.json'), { name, version });
            }
            const { init } = await import('../src/commands/init.js');
            await init({ cwd, yes: true, dryRun: true, silent: true });
            const expected = repair ? '[Dry Run] Would install dependencies:' : '[Dry Run] Would keep dependencies:';
            expect(info).toHaveBeenCalledWith(expect.stringContaining(`${expected} ${cwd}`));
            expect(runProcess).not.toHaveBeenCalled();

            await init({ cwd, yes: true, silent: true });
            expect(installPackages).not.toHaveBeenCalled();
            if (repair) {
                expect(runProcess).toHaveBeenCalledExactlyOnceWith('pnpm', ['install'], expect.objectContaining({ cwd }));
            } else {
                expect(runProcess).not.toHaveBeenCalled();
            }
        } finally {
            info.mockRestore();
            await fs.remove(workspace);
        }
    });

    it('skips external VS Code snippets in automatic mode and rejects an explicit write', async () => {
        const initialCss = '@import "tailwindcss";\n';
        const cwd = await setupProject({ 'src/index.css': initialCss });
        const external = await setupProject({ 'brutx.code-snippets': '{"shared":{}}' });
        const info = vi.spyOn(logger, 'info');
        const warn = vi.spyOn(logger, 'warn');
        try {
            await fs.symlink(external, path.join(cwd, '.vscode'), 'junction');
            const { init } = await import('../src/commands/init.js');

            await init({ cwd, yes: true, dryRun: true, silent: true });
            expect(info).toHaveBeenCalledWith(expect.stringContaining('[Dry Run] Would skip: VS Code snippets'));
            expect(installPackages).not.toHaveBeenCalled();

            for (const dryRun of [true, false]) {
                await expect(init({ cwd, yes: true, vscode: true, dryRun, silent: true })).rejects.toMatchObject({
                    code: 'PATH_UNSAFE',
                });
                expect(await fs.pathExists(path.join(cwd, 'components.json'))).toBe(false);
                expect(await fs.readFile(path.join(cwd, 'src/index.css'), 'utf8')).toBe(initialCss);
            }

            await init({ cwd, yes: true, silent: true });
            expect(await fs.pathExists(path.join(cwd, 'components.json'))).toBe(true);
            expect(installPackages).toHaveBeenCalledTimes(1);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('Skipped VS Code snippets.'));
            expect(await fs.readFile(path.join(external, 'brutx.code-snippets'), 'utf8')).toBe('{"shared":{}}');
        } finally {
            info.mockRestore();
            warn.mockRestore();
            await fs.remove(cwd);
            await fs.remove(external);
        }
    });

    it('should use split tokens mode by default with --yes on new projects', async () => {
        const cwd = await setupProject({
            'src/index.css': '.shadow-brutal { box-shadow: 4px 4px 0 #000; }',
        });

        try {
            const { init } = await import('../src/commands/init.js');
            await init({ cwd, yes: true, force: true, silent: true });

            const config: BrutalistConfig = await fs.readJson(path.join(cwd, 'components.json'));
            expect(config.tailwind.css).toBe('src/index.css');
            expect(config.tailwind.tokensFile).toBe('src/brutx-tokens.css');

            const mainCss = await fs.readFile(path.join(cwd, 'src', 'index.css'), 'utf-8');
            expect(mainCss).toContain('.shadow-brutal { box-shadow: 4px 4px 0 #000; }');
            expect(mainCss).toContain('@import "./brutx-tokens.css";');
            expect(mainCss).not.toContain('@/');

            const tokensPath = path.join(cwd, 'src', 'brutx-tokens.css');
            expect(await fs.pathExists(tokensPath)).toBe(true);
            const tokensContent = await fs.readFile(tokensPath, 'utf-8');
            expect(tokensContent).toContain('--color-brutal-bg');
            expect(tokensContent).toContain('.bg-brutal-primary');
            expect(tokensContent).toContain('.animate-in');
        } finally {
            await fs.remove(cwd);
        }
    }, 15000);

    it('should use src/style.css and split tokens when initializing a Vite Vue project with src/style.css', async () => {
        const cwd = await setupProject({
            'src/style.css': 'body { margin: 0; }',
        });

        try {
            const { init } = await import('../src/commands/init.js');
            await init({ cwd, yes: true, force: true, silent: true });

            const config: BrutalistConfig = await fs.readJson(path.join(cwd, 'components.json'));
            expect(config.tailwind.css).toBe('src/style.css');
            expect(config.tailwind.tokensFile).toBe('src/brutx-tokens.css');

            const content = await fs.readFile(path.join(cwd, 'src', 'style.css'), 'utf-8');
            expect(content).toContain('body { margin: 0; }');
            expect(content).toContain('@import "./brutx-tokens.css";');
            expect(await fs.pathExists(path.join(cwd, 'src', 'index.css'))).toBe(false);

            const tokensContent = await fs.readFile(path.join(cwd, 'src', 'brutx-tokens.css'), 'utf-8');
            expect(tokensContent).toContain('--color-brutal-bg');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should use split tokens mode by default with --defaults on new projects', async () => {
        const cwd = await setupProject({
            'src/index.css': '@import "tailwindcss";\n',
        });

        try {
            const { init } = await import('../src/commands/init.js');
            await init({ cwd, defaults: true, silent: true });

            const config: BrutalistConfig = await fs.readJson(path.join(cwd, 'components.json'));
            expect(config.tailwind.tokensFile).toBe('src/brutx-tokens.css');

            const mainCss = await fs.readFile(path.join(cwd, 'src', 'index.css'), 'utf-8');
            expect(mainCss).toContain('@import "./brutx-tokens.css";');
            expect(await fs.pathExists(path.join(cwd, 'src', 'brutx-tokens.css'))).toBe(true);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should prompt to split design tokens in interactive mode and split when confirmed', async () => {
        const cwd = await setupProject({
            'src/index.css': '@import "tailwindcss";\n',
        });

        try {
            const { init } = await import('../src/commands/init.js');
            await init({ cwd, silent: true });

            expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Split design tokens into a separate CSS file'),
                default: true,
            }));

            const config: BrutalistConfig = await fs.readJson(path.join(cwd, 'components.json'));
            expect(config.tailwind.tokensFile).toBe('src/brutx-tokens.css');

            const mainCss = await fs.readFile(path.join(cwd, 'src', 'index.css'), 'utf-8');
            expect(mainCss).toContain('@import "./brutx-tokens.css";');
            expect(mainCss).not.toContain('@/');
            expect(await fs.pathExists(path.join(cwd, 'src', 'brutx-tokens.css'))).toBe(true);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should inline tokens and omit tailwind.tokensFile when user declines splitting in interactive mode', async () => {
        const cwd = await setupProject({
            'src/index.css': '@import "tailwindcss";\n',
        });

        mockConfirm.mockImplementation(async (opt: { message: string; default?: boolean }) => {
            if (opt.message.includes('Split design tokens')) {
                return false;
            }
            return opt.default ?? true;
        });

        try {
            const { init } = await import('../src/commands/init.js');
            await init({ cwd, silent: true });

            const config: BrutalistConfig = await fs.readJson(path.join(cwd, 'components.json'));
            expect(config.tailwind.tokensFile).toBeUndefined();

            const mainCss = await fs.readFile(path.join(cwd, 'src', 'index.css'), 'utf-8');
            expect(mainCss).toContain('--color-brutal-bg');
            expect(mainCss).not.toContain('@import "./brutx-tokens.css";');
            expect(await fs.pathExists(path.join(cwd, 'src', 'brutx-tokens.css'))).toBe(false);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should retain inline mode when re-initializing an existing inline project', async () => {
        const existingConfig: BrutalistConfig = {
            $schema: 'https://example.com/schema.json',
            $version: 1,
            style: 'brutalism',
            tailwind: {
                config: '',
                css: 'src/index.css',
            },
            aliases: {
                components: '@/components',
                utils: '@/lib/utils',
                composables: '@/composables',
            },
        };

        const cwd = await setupProject({
            'components.json': existingConfig,
            'src/index.css': '@import "tailwindcss";\n',
        });

        try {
            const { init } = await import('../src/commands/init.js');
            await init({ cwd, yes: true, force: true, silent: true });

            const config: BrutalistConfig = await fs.readJson(path.join(cwd, 'components.json'));
            expect(config.tailwind.tokensFile).toBeUndefined();

            const mainCss = await fs.readFile(path.join(cwd, 'src', 'index.css'), 'utf-8');
            expect(mainCss).toContain('--color-brutal-bg');
            expect(await fs.pathExists(path.join(cwd, 'src', 'brutx-tokens.css'))).toBe(false);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should retain decoupled mode when re-initializing an existing split project', async () => {
        const existingConfig = {
            $schema: 'https://example.com/schema.json',
            $version: 1,
            style: 'brutalism',
            tailwind: {
                config: '',
                css: 'src/index.css',
                tokensFile: 'src/styles/brutx-tokens.css',
                custom: true,
            },
            aliases: {
                components: '@/components',
                utils: '@/lib/utils',
                composables: '@/composables',
                locales: '@/locales',
            },
            extension: { enabled: true },
        };

        const cwd = await setupProject({
            'components.json': existingConfig,
            'src/index.css': '@import "tailwindcss";\n',
        });

        try {
            const { init } = await import('../src/commands/init.js');
            await init({ cwd, yes: true, force: true, silent: true });

            const config = await fs.readJson(path.join(cwd, 'components.json'));
            expect(config.extension).toEqual(existingConfig.extension);
            expect(config.tailwind.custom).toBe(true);
            expect(config.aliases.locales).toBe(existingConfig.aliases.locales);
            expect(config.tailwind.tokensFile).toBe('src/styles/brutx-tokens.css');

            const mainCss = await fs.readFile(path.join(cwd, 'src', 'index.css'), 'utf-8');
            expect(mainCss).toContain('@import "./styles/brutx-tokens.css";');
            expect(mainCss).not.toContain('@/');

            const tokensPath = path.join(cwd, 'src', 'styles', 'brutx-tokens.css');
            expect(await fs.pathExists(tokensPath)).toBe(true);
            const tokensContent = await fs.readFile(tokensPath, 'utf-8');
            expect(tokensContent).toContain('--color-brutal-bg');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should safely fall back to inline mode and omit tokensFile when tokensFile equals css path', async () => {
        const existingConfig: BrutalistConfig = {
            $schema: 'https://example.com/schema.json',
            $version: 1,
            style: 'brutalism',
            tailwind: {
                config: '',
                css: 'src/index.css',
                tokensFile: 'src/index.css',
            },
            aliases: {
                components: '@/components',
                utils: '@/lib/utils',
                composables: '@/composables',
            },
        };

        const cwd = await setupProject({
            'components.json': existingConfig,
            'src/index.css': '@import "tailwindcss";\n',
        });

        try {
            const { init } = await import('../src/commands/init.js');
            await init({ cwd, yes: true, force: true, silent: true });

            const config: BrutalistConfig = await fs.readJson(path.join(cwd, 'components.json'));
            expect(config.tailwind.tokensFile).toBeUndefined();

            const mainCss = await fs.readFile(path.join(cwd, 'src', 'index.css'), 'utf-8');
            expect(mainCss).toContain('--color-brutal-bg');
            expect(mainCss).not.toContain('@import "./index.css";');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should reject invalid existing components.json with CONFIG_INVALID error before writing', async () => {
        const cwd = await setupProject({
            'components.json': '{ invalid json }',
            'src/index.css': '@import "tailwindcss";\n',
        });

        try {
            const { init } = await import('../src/commands/init.js');
            await expect(init({ cwd, force: true, silent: true })).rejects.toMatchObject({
                code: 'CONFIG_INVALID',
            } satisfies Partial<CliError>);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should roll back config when utility file creation fails', async () => {
        const cwd = await setupProject({
            'src/index.css': '@import "tailwindcss";\n',
            'src/components/brutx/shared': 'not-a-directory',
        });

        try {
            const { init } = await import('../src/commands/init.js');

            await expect(init({ cwd, yes: true, force: true, silent: true })).rejects.toMatchObject({
                code: 'WRITE_FAILED',
            } satisfies Partial<CliError>);

            expect(await fs.pathExists(path.join(cwd, 'components.json'))).toBe(false);
            expect(await fs.readFile(path.join(cwd, 'src', 'components', 'brutx', 'shared'), 'utf-8')).toBe('not-a-directory');
        } finally {
            await fs.remove(cwd);
        }
    });
});
