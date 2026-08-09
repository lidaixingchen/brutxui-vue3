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
import {
    BRUTX_CSS_START_MARKER,
    BRUTX_CSS_END_MARKER,
} from '../src/lib/constants.js';

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

    it('injects styles when CSS lacks markers even if it contains legacy tokens', async () => {
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
        expect(result.stylesAdded).toBe(true);
        const css = await fs.readFile(path.join(tmpDir, 'src', 'index.css'), 'utf-8');
        expect(css).toContain(BRUTX_CSS_START_MARKER);
        expect(css).toContain(BRUTX_CSS_END_MARKER);
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

describe('injectNuxtConfig root-key detection', () => {
    it('detects top-level components/css keys only (not nested objects)', () => {
        const content = `export default defineNuxtConfig({
    vite: { css: { preprocessorOptions: {} } },
})
`;
        const result = injectNuxtConfig(content, 'assets/css/main.css', 'components');
        // 嵌套对象 vite: { css } 不应被算作根级 css，根级缺少 components/css 时应注入
        expect(result).toContain("components: ['~/components']");
        expect(result).toContain("css: ['assets/css/main.css']");
    });

    it('ignores key literals inside comments and strings', () => {
        const content = `export default defineNuxtConfig({
    // components: ['~/fake']
    const note = "css: []";
})
`;
        const result = injectNuxtConfig(content, 'assets/css/main.css', 'components');
        // 注释与字符串里的字面量不应命中根级键，应注入
        expect(result).toContain("components: ['~/components']");
        expect(result).toContain("css: ['assets/css/main.css']");
    });

    it('does not re-inject when top-level keys already exist', () => {
        const content = `export default defineNuxtConfig({
    components: ['~/components'],
    css: ['assets/css/main.css'],
})
`;
        const result = injectNuxtConfig(content, 'assets/css/main.css', 'components');
        expect(result).toBe(content);
    });

    it('recognizes top-level key with block comment before colon', () => {
        const content = `export default defineNuxtConfig({
    components /* 目录 */ : ['~/components'],
    css: ['assets/css/main.css'],
})
`;
        const result = injectNuxtConfig(content, 'assets/css/main.css', 'components');
        expect(result).toBe(content);
    });

    it('returns null when defineNuxtConfig is absent', () => {
        const result = injectNuxtConfig('export default {}', 'assets/css/main.css', 'components');
        expect(result).toBeNull();
    });

    it('skips braces inside strings when locating the root block', () => {
        // 字符串字面量/模板字符串里的括号不应干扰根块配对，缺失的根级 css 应注入
        const content = [
            'export default defineNuxtConfig({',
            "    head: { script: [{ innerHTML: 'if (x) { y }' }] },",
            '    runtimeConfig: { text: `a } b { c` },',
            '})',
            '',
        ].join('\n');
        const result = injectNuxtConfig(content, 'assets/css/main.css', 'components');
        expect(result).toContain("components: ['~/components']");
        expect(result).toContain("css: ['assets/css/main.css']");
    });

    it('does not treat generic type braces as the root block', () => {
        // defineNuxtConfig<{...}> 泛型参数里的 { 不是根块起点，注入应落在参数对象内
        const content = [
            'export default defineNuxtConfig<{ modules: string[] }>({',
            "    css: ['assets/css/main.css'],",
            '})',
            '',
        ].join('\n');
        const result = injectNuxtConfig(content, 'assets/css/main.css', 'components');
        expect(result).toContain("components: ['~/components']");
        expect(result).toContain("css: ['assets/css/main.css']");
        // 注入位置必须在泛型 }> 之后的参数对象内（首行括号后），而非泛型段内
        const firstLine = result?.split('\n')[0] ?? '';
        expect(firstLine.endsWith('<{ modules: string[] }>({')).toBe(true);
    });
});
