import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { ProjectType } from '../src/lib/types.js';
import {
    initializeProjectFiles,
    injectNuxtConfig,
    type ProjectInitializationSettings,
} from '../src/lib/services/init-service.js';

const defaultSettings: ProjectInitializationSettings = {
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

async function createTmpProject(): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-init-service-'));
    await fs.ensureDir(path.join(tmpDir, 'src'));
    await fs.writeJson(path.join(tmpDir, 'package.json'), {
        dependencies: {
            vue: '^3.5.0',
            tailwindcss: '^4.0.0',
        },
    });
    await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), {
        compilerOptions: {
            baseUrl: '.',
            paths: { '@/*': ['./src/*'] },
        },
    });
    return tmpDir;
}

describe('init service', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await createTmpProject();
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.remove(tmpDir);
    });

    it('injects missing Nuxt components and css entries', () => {
        const result = injectNuxtConfig(
            'export default defineNuxtConfig({\n})\n',
            'assets/css/main.css',
            'components'
        );

        expect(result).toContain("components: ['~/components']");
        expect(result).toContain("css: ['assets/css/main.css']");
    });

    it('creates config, utility helper, components directory, and Tailwind v4 styles', async () => {
        const onUtilityHelper = vi.fn();
        const onComponentsDirectory = vi.fn();
        const onStyles = vi.fn();

        const result = await initializeProjectFiles({
            cwd: tmpDir,
            projectType: 'vite-vue-src',
            settings: defaultSettings,
            callbacks: {
                onUtilityHelper,
                onComponentsDirectory,
                onStyles,
            },
        });

        expect(result.config.tailwind.css).toBe('src/index.css');
        expect(result.utilsCreated).toBe(true);
        expect(result.stylesAdded).toBe(true);
        expect(result.nuxt.status).toBe('skipped');

        expect(await fs.pathExists(path.join(tmpDir, 'components.json'))).toBe(true);
        expect(await fs.pathExists(path.join(tmpDir, 'src', 'lib', 'utils.ts'))).toBe(true);
        expect(await fs.pathExists(path.join(tmpDir, 'src', 'components', 'ui'))).toBe(true);

        const css = await fs.readFile(path.join(tmpDir, 'src', 'index.css'), 'utf-8');
        expect(css).toContain('@import "tailwindcss"');
        expect(css).toContain('--color-brutal-bg');

        expect(onUtilityHelper).toHaveBeenCalledWith(expect.objectContaining({ created: true }));
        expect(onComponentsDirectory).toHaveBeenCalledWith(expect.objectContaining({
            path: path.join(tmpDir, 'src', 'components'),
        }));
        expect(onStyles).toHaveBeenCalledWith({ cssPath: 'src/index.css', added: true });
    });

    it('skips existing complete styles and existing utility helper', async () => {
        await fs.ensureDir(path.join(tmpDir, 'src', 'lib'));
        await fs.writeFile(path.join(tmpDir, 'src', 'lib', 'utils.ts'), 'export const cn = () => "";\n', 'utf-8');
        await fs.writeFile(
            path.join(tmpDir, 'src', 'index.css'),
            '--color-brutal-bg: #fff;\n.bg-brutal-primary {}\n.animate-in {}\n',
            'utf-8'
        );

        const result = await initializeProjectFiles({
            cwd: tmpDir,
            projectType: 'vite-vue-src',
            settings: defaultSettings,
        });

        expect(result.utilsCreated).toBe(false);
        expect(result.stylesAdded).toBe(false);
        expect(await fs.readFile(path.join(tmpDir, 'src', 'lib', 'utils.ts'), 'utf-8'))
            .toBe('export const cn = () => "";\n');
    });

    it('reports manual Nuxt configuration when defineNuxtConfig cannot be found', async () => {
        const onNuxtConfig = vi.fn();
        await fs.writeFile(path.join(tmpDir, 'nuxt.config.ts'), 'export default {}\n', 'utf-8');

        const result = await initializeProjectFiles({
            cwd: tmpDir,
            projectType: 'nuxt' satisfies ProjectType,
            settings: {
                ...defaultSettings,
                tailwind: {
                    config: '',
                    css: 'assets/css/main.css',
                },
            },
            callbacks: {
                onNuxtConfig,
            },
        });

        expect(result.nuxt).toMatchObject({
            configured: false,
            status: 'manual-required',
            cssPath: 'assets/css/main.css',
            componentsRelDir: 'src/components',
            configFile: 'nuxt.config.ts',
        });
        expect(onNuxtConfig).toHaveBeenCalledWith(result.nuxt);
        expect(await fs.readFile(path.join(tmpDir, 'nuxt.config.ts'), 'utf-8')).toBe('export default {}\n');
    });
});
