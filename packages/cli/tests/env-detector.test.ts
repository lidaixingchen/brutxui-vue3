import path from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import {
    detectProjectType,
    detectPackageManager,
    detectWorkspaceRoot,
    readTsConfig,
    clearProjectTypeCache,
} from '../src/lib/env-detector.js';

describe('env-detector', () => {
    let fs: MemoryFileSystemAdapter;
    const cwd = '/test-project';

    beforeEach(() => {
        fs = new MemoryFileSystemAdapter();
        clearProjectTypeCache();
    });

    describe('detectProjectType', () => {
        it('detects nuxt project when nuxt.config.ts exists', async () => {
            await fs.ensureDir(cwd);
            await fs.writeFile(`${cwd}/nuxt.config.ts`, 'export default {}');
            const type = await detectProjectType(cwd, fs);
            expect(type).toBe('nuxt');
        });

        it('detects vite-vue-src when vue dependency is in package.json and src exists', async () => {
            await fs.ensureDir(`${cwd}/src`);
            await fs.writeJson(`${cwd}/package.json`, {
                dependencies: { vue: '^3.5.0' },
            });
            const type = await detectProjectType(cwd, fs);
            expect(type).toBe('vite-vue-src');
        });

        it('detects vite-vue when vue dependency is in package.json without src', async () => {
            await fs.ensureDir(cwd);
            await fs.writeJson(`${cwd}/package.json`, {
                dependencies: { vue: '^3.5.0' },
            });
            const type = await detectProjectType(cwd, fs);
            expect(type).toBe('vite-vue');
        });

        it('returns unknown when neither nuxt nor vue is present', async () => {
            await fs.ensureDir(cwd);
            await fs.writeJson(`${cwd}/package.json`, {
                dependencies: { react: '^18.0.0' },
            });
            const type = await detectProjectType(cwd, fs);
            expect(type).toBe('unknown');
        });
    });

    describe('detectPackageManager', () => {
        it('detects pnpm when pnpm-lock.yaml is present', async () => {
            await fs.ensureDir(cwd);
            await fs.writeFile(`${cwd}/pnpm-lock.yaml`, '');
            const pm = await detectPackageManager(cwd, fs);
            expect(pm).toBe('pnpm');
        });

        it('detects bun when bun.lockb is present', async () => {
            await fs.ensureDir(cwd);
            await fs.writeFile(`${cwd}/bun.lockb`, '');
            const pm = await detectPackageManager(cwd, fs);
            expect(pm).toBe('bun');
        });

        it('detects yarn when yarn.lock is present', async () => {
            await fs.ensureDir(cwd);
            await fs.writeFile(`${cwd}/yarn.lock`, '');
            const pm = await detectPackageManager(cwd, fs);
            expect(pm).toBe('yarn');
        });

        it('defaults to npm when no lockfile exists', async () => {
            await fs.ensureDir(cwd);
            const pm = await detectPackageManager(cwd, fs);
            expect(pm).toBe('npm');
        });
    });

    describe('detectWorkspaceRoot', () => {
        it('detects pnpm-workspace.yaml in parent directory', async () => {
            const root = '/workspace-root';
            const sub = `${root}/packages/app`;
            await fs.ensureDir(sub);
            await fs.writeFile(`${root}/pnpm-workspace.yaml`, "packages:\n  - 'packages/*'");

            const detected = await detectWorkspaceRoot(sub, fs);
            expect(detected).toBe(path.resolve(root));
        });

        it('returns null when no workspace indicators exist', async () => {
            await fs.ensureDir(cwd);
            const detected = await detectWorkspaceRoot(cwd, fs);
            expect(detected).toBeNull();
        });
    });

    describe('readTsConfig', () => {
        it('reads and merges extends chain', async () => {
            await fs.ensureDir(cwd);
            await fs.writeJson(`${cwd}/tsconfig.base.json`, {
                compilerOptions: {
                    baseUrl: '.',
                    target: 'ESNext',
                },
            });
            await fs.writeJson(`${cwd}/tsconfig.json`, {
                extends: './tsconfig.base.json',
                compilerOptions: {
                    paths: {
                        '@/*': ['./src/*'],
                    },
                },
            });

            const tsConfig = await readTsConfig(cwd, fs);
            expect(tsConfig).not.toBeNull();
            expect(tsConfig?.compilerOptions?.target).toBe('ESNext');
            expect(tsConfig?.compilerOptions?.baseUrl).toBe('.');
            expect(tsConfig?.compilerOptions?.paths?.['@/*']).toEqual(['./src/*']);
        });
    });
});
