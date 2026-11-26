import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { planNuxtConfigInjection } from '../src/lib/frameworks/nuxt-config.js';
import { initializeProjectFiles, planProjectInitializationFiles, type ProjectInitializationOptions } from '../src/lib/services/init-service.js';

const CONFIG_FILE = 'nuxt.config.ts';
const MAIN_CSS = 'assets/css/main.css';

function createNuxtProject(source: string, files: Record<string, string>, css = MAIN_CSS) {
    const cwd = path.resolve('/workspace/nuxt-project');
    const configPath = path.join(cwd, CONFIG_FILE);
    const fs = new MemoryFileSystemAdapter({
        [configPath]: source,
        [path.join(cwd, 'package.json')]: JSON.stringify({ dependencies: { nuxt: '^4.0.0' } }),
        ...Object.fromEntries(Object.entries(files).map(([filename, content]) => [path.join(cwd, filename), content])),
    });
    const options: ProjectInitializationOptions = {
        cwd,
        fs,
        projectType: 'nuxt',
        settings: {
            tailwind: { config: '', css },
            aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
        },
    };
    return { configPath, fs, options };
}

describe('Nuxt initialization targets', () => {
    it('registers root targets separately from Nuxt 4 source aliases and preserves the original entries', async () => {
        const source = "export default defineNuxtConfig({ components: ['~/components'], css: ['assets/css/main.css'] })";
        const { configPath, fs, options } = createNuxtProject(source, {
            'app/app.vue': '<template />',
            'app/assets/css/main.css': '.app-style {}',
        });
        const result = await initializeProjectFiles(options);

        expect(result.nuxt.status).toBe('updated');
        expect(await fs.readFile(configPath)).toBe(
            "export default defineNuxtConfig({ components: ['~/components', '~~/components'], css: ['assets/css/main.css', '~~/assets/css/main.css'] })",
        );
        expect(await fs.readFile(path.join(options.cwd, 'app/assets/css/main.css'))).toBe('.app-style {}');
        expect(await fs.readFile(path.join(options.cwd, 'assets/css/main.css'))).toContain('brutx');
        const replay = await planProjectInitializationFiles({ ...options, existingConfig: result.config, preserveExisting: true });
        expect(replay.nuxt.result.status).toBe('already-configured');
        expect(replay.steps.every(step => !step.action)).toBe(true);
    });

    it('uses the stylesheet written through the project alias when Nuxt srcDir and TS paths disagree', async () => {
        const source = "export default defineNuxtConfig({ srcDir: 'frontend', components: ['~~/components/ui'], css: ['~/assets/css/main.css'] })";
        const { configPath, fs, options } = createNuxtProject(source, {
            'frontend/assets/css/main.css': '.app-style {}',
            'tsconfig.json': JSON.stringify({ compilerOptions: { paths: { '~/*': ['./other/*'] } } }),
        }, '~/assets/css/main.css');
        const result = await initializeProjectFiles(options);

        expect(result.nuxt).toMatchObject({
            status: 'updated',
            cssPath: 'other/assets/css/main.css',
            cssSpecifier: '~~/other/assets/css/main.css',
        });
        expect(await fs.readFile(configPath)).toBe(
            source.replace("['~/assets/css/main.css']", "['~/assets/css/main.css', '~~/other/assets/css/main.css']"),
        );
        expect(await fs.readFile(path.join(options.cwd, 'other/assets/css/main.css'))).toContain('brutx');
    });

    it('evaluates the layout after init creates the legacy assets directory', async () => {
        const source = "export default defineNuxtConfig({ components: ['~/components'], css: ['assets/css/main.css'] })";
        const { configPath, fs, options } = createNuxtProject(source, {
            'app/router.options.ts': 'export default {}',
        });
        const result = await initializeProjectFiles(options);

        expect(result.nuxt.status).toBe('already-configured');
        expect(await fs.readFile(configPath)).toBe(source);
        expect(await fs.readFile(path.join(options.cwd, 'assets/css/main.css'))).toContain('brutx');
    });

    it('keeps dynamic projects intact and exposes the physical stylesheet for manual setup', async () => {
        const source = "const customSrc = 'frontend'; export default defineNuxtConfig({ srcDir: customSrc, css: [] })";
        const { configPath, fs, options } = createNuxtProject(source, {}, 'assets/css/main.css');
        const result = await initializeProjectFiles(options);

        expect(result.nuxt).toMatchObject({ status: 'manual-required', configured: false });
        expect(result.nuxt.cssSpecifier).toBe(path.join(options.cwd, 'assets/css/main.css').replaceAll('\\', '/'));
        expect(await fs.readFile(configPath)).toBe(source);
    });

    it.each([
        { version:3, status:'unchanged' },
        { version:4, status:'injected' },
    ])('resolves custom assets aliases in component scanning using Nuxt $version semantics', async ({ version, status }) => {
        const source = "export default defineNuxtConfig({ srcDir: 'frontend', dir: { assets: 'theme/skin' }, components: ['skin/widgets'], css: ['skin/css/main.css'] })";
        const { fs, options } = createNuxtProject(source, {
            'node_modules/nuxt/package.json': JSON.stringify({ version: `${version}.0.0` }),
        });
        const result = await planNuxtConfigInjection(source, {
            directory: options.cwd,
            fs,
            plannedPaths: [],
            cssFile: path.join(options.cwd, 'frontend/theme/skin/css/main.css'),
            componentsDir: path.join(options.cwd, 'frontend/theme/skin/widgets/ui'),
            componentScanDir: path.join(options.cwd, 'frontend/theme/skin/widgets'),
        });
        expect(result.status).toBe(status);
        expect(result.content).toContain("css: ['skin/css/main.css']");
        if (status === 'injected') expect(result.content).toContain("'~~/frontend/theme/skin/widgets'");
    });
});
