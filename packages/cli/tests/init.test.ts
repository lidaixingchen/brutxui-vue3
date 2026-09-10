import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { CliError } from '../src/lib/error.js';
import type { BrutalistConfig } from '../src/lib/types.js';

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
        mockInput.mockImplementation(async (opt: { default?: string }) => opt.default ?? '');
        mockConfirm.mockImplementation(async (opt: { default?: boolean }) => opt.default ?? true);
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
        const existingConfig: BrutalistConfig = {
            $schema: 'https://example.com/schema.json',
            $version: 1,
            style: 'brutalism',
            tailwind: {
                config: '',
                css: 'src/index.css',
                tokensFile: 'src/styles/brutx-tokens.css',
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
