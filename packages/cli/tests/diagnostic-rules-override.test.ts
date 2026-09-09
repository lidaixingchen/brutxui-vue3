import { describe, it, expect } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { diagnose } from '../src/lib/services/diagnostic-service.js';
import { ProjectContext } from '../src/lib/project-context.js';
import type { BrutalistConfig } from '../src/lib/types.js';

describe('Diagnostic Rules Override & Severity Tuning', () => {
    it('skips rule execution when rule is configured with "off"', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/project');

        const config: BrutalistConfig = {
            $schema: 'https://lidaixingchen.github.io/brutxui-vue3/schema.json',
            $version: 1,
            style: 'brutalism',
            tailwind: { config: '', css: 'src/main.css' },
            aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            rules: {
                'config.version': 'off',
            },
        };

        await fs.writeFile('/project/components.json', JSON.stringify(config, null, 2));

        const report = await diagnose({
            cwd: '/project',
            fs,
            categories: ['config'],
        });

        expect(report.getByRuleId('config.version')).toHaveLength(0);
        expect(report.getByRuleId('config.schema').length).toBeGreaterThanOrEqual(1);
    });

    it('overrides warning severity to error when rule is configured with "error"', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/project');

        // $version 缺失默认产生 warn，设置 rules: { "config.version": "error" } 后应提升为 error
        const config: Partial<BrutalistConfig> = {
            $schema: 'https://lidaixingchen.github.io/brutxui-vue3/schema.json',
            style: 'brutalism',
            tailwind: { config: '', css: 'src/main.css' },
            aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            rules: {
                'config.version': 'error',
            },
        };

        await fs.writeFile('/project/components.json', JSON.stringify(config, null, 2));

        const report = await diagnose({
            cwd: '/project',
            fs,
            ruleIds: ['config.version'],
        });

        expect(report.getByRuleId('config.version')).toHaveLength(1);
        const check = report.getByRuleId('config.version')[0];
        expect(check.status).toBe('error');
        expect(report.hasErrors).toBe(true);
        expect(report.summary.errors).toBe(1);
    });

    it('overrides error severity to warning when rule is configured with "warn"', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/project');

        // components.json 未找到默认在 config.exists 产生 error，通过 configOverride 或注入配置覆盖
        const config: BrutalistConfig = {
            $schema: 'https://lidaixingchen.github.io/brutxui-vue3/schema.json',
            $version: 1,
            style: 'brutalism',
            tailwind: { config: '', css: 'src/main.css' },
            aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            rules: {
                'tailwind.tokens': 'warn',
            },
        };

        await fs.writeFile('/project/components.json', JSON.stringify(config, null, 2));
        // 不创建 CSS 文件，导致 tailwind.tokens 产生 error，但由于 rules 配置为 warn，应降级为 warn
        const report = await diagnose({
            cwd: '/project',
            fs,
            ruleIds: ['tailwind.tokens'],
        });

        expect(report.getByRuleId('tailwind.tokens')).toHaveLength(1);
        const check = report.getByRuleId('tailwind.tokens')[0];
        expect(check.status).toBe('warn');
        expect(report.hasErrors).toBe(false);
        expect(report.hasWarnings).toBe(true);
    });

    it('preserves "pass" status when a passing rule is configured with "error" or "warn"', async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.ensureDir('/project');

        const config: BrutalistConfig = {
            $schema: 'https://lidaixingchen.github.io/brutxui-vue3/schema.json',
            $version: 1,
            style: 'brutalism',
            tailwind: { config: '', css: 'src/main.css' },
            aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
            rules: {
                'config.schema': 'error',
            },
        };

        await fs.writeFile('/project/components.json', JSON.stringify(config, null, 2));

        const report = await diagnose({
            cwd: '/project',
            fs,
            ruleIds: ['config.schema'],
        });

        expect(report.getByRuleId('config.schema')).toHaveLength(1);
        const check = report.getByRuleId('config.schema')[0];
        expect(check.status).toBe('pass');
        expect(report.hasErrors).toBe(false);
    });
});
