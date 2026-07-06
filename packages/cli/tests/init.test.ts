import { describe, it, expect, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { CliError } from '../src/lib/error.js';

vi.mock('../src/lib/package-manager.js', () => ({
    installPackages: vi.fn(),
    getInstallCommand: vi.fn(() => 'npm install'),
}));

describe('init', () => {
    it('should append complete brutalist styles when an older partial style block exists', async () => {
        const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-init-'));

        try {
            await fs.ensureDir(path.join(cwd, 'src'));
            await fs.writeJson(path.join(cwd, 'package.json'), {
                dependencies: { vue: '^3.5.0', tailwindcss: '^4.0.0' },
            });
            await fs.writeFile(path.join(cwd, 'src', 'index.css'), '.shadow-brutal { box-shadow: 4px 4px 0 #000; }');

            const { init } = await import('../src/commands/init.js');
            await init({ cwd, yes: true, force: true, silent: true });

            const content = await fs.readFile(path.join(cwd, 'src', 'index.css'), 'utf-8');
            expect(content).toContain('.shadow-brutal { box-shadow: 4px 4px 0 #000; }');
            expect(content).toContain('--color-brutal-bg');
            expect(content).toContain('.bg-brutal-primary');
            expect(content).toContain('.animate-in');
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should use src/style.css when initializing a Vite Vue project with the default Vite CSS entry', async () => {
        const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-init-'));

        try {
            await fs.ensureDir(path.join(cwd, 'src'));
            await fs.writeJson(path.join(cwd, 'package.json'), {
                dependencies: { vue: '^3.5.0', tailwindcss: '^4.0.0' },
            });
            await fs.writeFile(path.join(cwd, 'src', 'style.css'), 'body { margin: 0; }');

            const { init } = await import('../src/commands/init.js');
            await init({ cwd, yes: true, force: true, silent: true });

            const config = await fs.readJson(path.join(cwd, 'components.json'));
            expect(config.tailwind.css).toBe('src/style.css');

            const content = await fs.readFile(path.join(cwd, 'src', 'style.css'), 'utf-8');
            expect(content).toContain('body { margin: 0; }');
            expect(content).toContain('--color-brutal-bg');
            expect(await fs.pathExists(path.join(cwd, 'src', 'index.css'))).toBe(false);
        } finally {
            await fs.remove(cwd);
        }
    });

    it('should roll back config when utility file creation fails', async () => {
        const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-init-'));

        try {
            await fs.ensureDir(path.join(cwd, 'src'));
            await fs.writeJson(path.join(cwd, 'package.json'), {
                dependencies: { vue: '^3.5.0', tailwindcss: '^4.0.0' },
            });
            await fs.writeFile(path.join(cwd, 'src', 'index.css'), '@import "tailwindcss";\n');
            await fs.writeFile(path.join(cwd, 'src', 'lib'), 'not-a-directory', 'utf-8');

            const { init } = await import('../src/commands/init.js');

            await expect(init({ cwd, yes: true, force: true, silent: true })).rejects.toMatchObject({
                code: 'WRITE_FAILED',
            } satisfies Partial<CliError>);

            expect(await fs.pathExists(path.join(cwd, 'components.json'))).toBe(false);
            expect(await fs.readFile(path.join(cwd, 'src', 'lib'), 'utf-8')).toBe('not-a-directory');
        } finally {
            await fs.remove(cwd);
        }
    });
});
