import { describe, expect, it } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../../src/lib/project-context.js';
import { integrityNoConflictMarkersRule } from '../../src/lib/diagnostics/rules/integrity-rules.js';
import type { BrutalistConfig } from '../../src/lib/types.js';

describe('integrityNoConflictMarkersRule', () => {
    const projectCwd = process.platform === 'win32' ? 'C:/workspace/test-app' : '/workspace/test-app';

    const sampleConfig: BrutalistConfig = {
        style: 'brutalism',
        tailwind: {
            config: 'tailwind.config.js',
            css: 'src/assets/main.css',
            baseColor: 'slate',
            cssVariables: true,
        },
        aliases: {
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables',
        },
    };

    it('passes when no conflict markers exist in installed component files', async () => {
        const buttonPath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        const manifestContent = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '0.10.0',
                    registrySource: 'official',
                    integrity: 'sha256-mock',
                    installedAt: '2026-08-20T00:00:00.000Z',
                    files: ['src/components/ui/button/Button.vue'],
                    dependencies: [],
                    registryDependencies: [],
                },
            },
        };

        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, '.brutx/manifest.json')]: JSON.stringify(manifestContent),
            [buttonPath]: '<template><button>Clean Code</button></template>',
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });
        const diagContext = {
            cwd: projectCwd,
            config: ctx.config,
            env: ctx.env,
            manifest: manifestContent as any,
            offline: false,
            fs,
        };

        const results = await integrityNoConflictMarkersRule.check(diagContext);
        expect(results.length).toBe(1);
        expect(results[0].status).toBe('pass');
    });

    it('fails with exact file and line numbers when conflict markers are present', async () => {
        const buttonPath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        const conflictedContent = [
            '<template>',
            '<<<<<<< LOCAL',
            '  <button class="my-btn">Local</button>',
            '=======',
            '  <button class="upstream-btn">Remote</button>',
            '>>>>>>> REMOTE',
            '</template>',
        ].join('\n');

        const manifestContent = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '0.10.0',
                    registrySource: 'official',
                    integrity: 'sha256-mock',
                    installedAt: '2026-08-20T00:00:00.000Z',
                    files: ['src/components/ui/button/Button.vue'],
                    dependencies: [],
                    registryDependencies: [],
                },
            },
        };

        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, '.brutx/manifest.json')]: JSON.stringify(manifestContent),
            [buttonPath]: conflictedContent,
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });
        const diagContext = {
            cwd: projectCwd,
            config: ctx.config,
            env: ctx.env,
            manifest: manifestContent as any,
            offline: false,
            fs,
        };

        const results = await integrityNoConflictMarkersRule.check(diagContext);
        expect(results.length).toBe(1);
        expect(results[0].status).toBe('error');
        expect(results[0].fixId).toBeUndefined();
        expect(results[0].message).toContain('lines: 2, 4, 6');
    });
});
