import { describe, expect, it } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { diagnose, repair } from '../src/lib/services/diagnostic-service.js';
import { BRUTX_CSS_END_MARKER, BRUTX_CSS_START_MARKER } from '../src/lib/constants.js';

describe('tailwind.tokens diagnostic rule & dual-mode self-healing', () => {
    const baseConfig = {
        $schema: 'https://example.com/schema.json',
        $version: 1,
        style: 'brutalism',
        tailwind: {
            config: '',
            css: '@/styles.css',
        },
        aliases: {
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables',
        },
    };

    it('单文件内联模式：主 CSS 包含 tokens 时通过巡检', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/app/src');
        await fs.writeJson('/app/package.json', { name: 'app' });
        await fs.writeJson('/app/components.json', baseConfig);
        await fs.writeFile(
            '/app/src/styles.css',
            `@import "tailwindcss";\n${BRUTX_CSS_START_MARKER}\n:root { --brutal-bg: #fff; }\n${BRUTX_CSS_END_MARKER}`
        );

        const report = await diagnose({
            cwd: '/app',
            fs,
            ruleIds: ['tailwind.tokens'],
        });

        expect(report.checks[0].status).toBe('pass');
    });

    it('单文件内联模式：多层嵌套 @import 包含 tokens 时通过巡检', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/app/src');
        await fs.writeJson('/app/package.json', { name: 'app' });
        await fs.writeJson('/app/components.json', baseConfig);
        await fs.writeFile('/app/src/styles.css', '@import "./theme.css";');
        await fs.writeFile('/app/src/theme.css', '@import "./tokens.css";');
        await fs.writeFile(
            '/app/src/tokens.css',
            `${BRUTX_CSS_START_MARKER}\n:root { --brutal-bg: #fff; }\n${BRUTX_CSS_END_MARKER}`
        );

        const report = await diagnose({
            cwd: '/app',
            fs,
            ruleIds: ['tailwind.tokens'],
        });

        expect(report.checks[0].status).toBe('pass');
    });

    it('依赖图存在 404 悬空引用时精准报错并指出缺失路径及行号', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/app/src');
        await fs.writeJson('/app/package.json', { name: 'app' });
        await fs.writeJson('/app/components.json', baseConfig);
        await fs.writeFile('/app/src/styles.css', '/* intro */\n\n@import "./non-existent.css";');

        const report = await diagnose({
            cwd: '/app',
            fs,
            ruleIds: ['tailwind.tokens'],
        });

        expect(report.checks[0].status).toBe('error');
        expect(report.checks[0].message).toContain('Missing CSS import target "./non-existent.css"');
        expect(report.checks[0].message).toContain('src/styles.css:3');
    });

    it('依赖图存在循环引用时精准报错', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/app/src');
        await fs.writeJson('/app/package.json', { name: 'app' });
        await fs.writeJson('/app/components.json', baseConfig);
        await fs.writeFile('/app/src/styles.css', '@import "./sub.css";');
        await fs.writeFile('/app/src/sub.css', '@import "./styles.css";');

        const report = await diagnose({
            cwd: '/app',
            fs,
            ruleIds: ['tailwind.tokens'],
        });

        expect(report.checks[0].status).toBe('error');
        expect(report.checks[0].message).toContain('Circular CSS import detected');
    });

    it('解耦模式：配置 tokensFile 且文件与主导入均完备时通过巡检', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/app/src/styles');
        await fs.writeJson('/app/package.json', { name: 'app' });
        await fs.writeJson('/app/components.json', {
            ...baseConfig,
            tailwind: {
                config: '',
                css: '@/styles/main.css',
                tokensFile: '@/styles/brutx-tokens.css',
            },
        });
        await fs.writeFile(
            '/app/src/styles/main.css',
            '@import "tailwindcss";\n@import "./brutx-tokens.css";\nbody { margin: 0; }'
        );
        await fs.writeFile(
            '/app/src/styles/brutx-tokens.css',
            `${BRUTX_CSS_START_MARKER}\n:root { --brutal-bg: #fff; }\n${BRUTX_CSS_END_MARKER}`
        );

        const report = await diagnose({
            cwd: '/app',
            fs,
            ruleIds: ['tailwind.tokens'],
        });

        expect(report.checks[0].status).toBe('pass');
    });

    it('解耦模式自愈：缺失 tokensFile 时 repair 自动创建并在主 CSS 注入单行 @import', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/app/src/styles');
        await fs.writeJson('/app/package.json', { name: 'app' });
        await fs.writeJson('/app/components.json', {
            ...baseConfig,
            tailwind: {
                config: '',
                css: '@/styles/main.css',
                tokensFile: '@/styles/brutx-tokens.css',
            },
        });
        await fs.writeFile('/app/src/styles/main.css', '@import "tailwindcss";\nbody { margin: 0; }');

        const initialReport = await diagnose({
            cwd: '/app',
            fs,
            ruleIds: ['tailwind.tokens'],
        });
        expect(initialReport.checks[0].status).toBe('error');

        const repairReport = await repair({
            cwd: '/app',
            fs,
            ruleIds: ['tailwind.tokens'],
        });

        expect(repairReport.applied).toHaveLength(1);
        expect(repairReport.freshReport.checks[0].status).toBe('pass');

        const tokensContent = await fs.readFile('/app/src/styles/brutx-tokens.css', 'utf-8');
        expect(tokensContent).toContain(BRUTX_CSS_START_MARKER);
        expect(tokensContent).toContain('--color-brutal-bg');
        expect(tokensContent).toContain(BRUTX_CSS_END_MARKER);

        const mainCss = await fs.readFile('/app/src/styles/main.css', 'utf-8');
        expect(mainCss).toContain('@import "./brutx-tokens.css";');
        expect(mainCss).not.toContain(BRUTX_CSS_START_MARKER);
    });

    it('双模式迁移自愈：从单文件内联模式切换至解耦模式时，repair 自动清理主 CSS 中的旧内联 Marker 块', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/app/src/styles');
        await fs.writeJson('/app/package.json', { name: 'app' });
        await fs.writeJson('/app/components.json', {
            ...baseConfig,
            tailwind: {
                config: '',
                css: '@/styles/main.css',
                tokensFile: '@/styles/brutx-tokens.css',
            },
        });
        // 主 CSS 残留旧版内联 Marker 块
        await fs.writeFile(
            '/app/src/styles/main.css',
            `@import "tailwindcss";\n${BRUTX_CSS_START_MARKER}\n:root { --old: 1; }\n${BRUTX_CSS_END_MARKER}\nbody { color: black; }`
        );

        const repairReport = await repair({
            cwd: '/app',
            fs,
            ruleIds: ['tailwind.tokens'],
        });

        expect(repairReport.applied).toHaveLength(1);
        expect(repairReport.freshReport.checks[0].status).toBe('pass');

        const mainCss = await fs.readFile('/app/src/styles/main.css', 'utf-8');
        expect(mainCss).not.toContain(BRUTX_CSS_START_MARKER);
        expect(mainCss).not.toContain('--old: 1');
        expect(mainCss).toContain('@import "./brutx-tokens.css";');
        expect(mainCss).toContain('body { color: black; }');

        // 二次执行 repair 幂等
        const secondRepair = await repair({
            cwd: '/app',
            fs,
            ruleIds: ['tailwind.tokens'],
        });
        expect(secondRepair.applied).toHaveLength(0);
        expect(secondRepair.freshReport.checks[0].status).toBe('pass');
    });
});
