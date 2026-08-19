import { describe, expect, it } from 'vitest';
import type { MergedRegistryEntry } from 'brutx-shared-vue';
import { MemoryFileSystemAdapter } from '../../src/fs/memory-fs.js';
import { CacheManager } from '../../src/compiler/cache-manager.js';
import type { CompilerPaths } from '../../src/compiler/types.js';

describe('CacheManager', () => {
    const paths: CompilerPaths = {
        componentsDir: '/src/components',
        composablesDir: '/src/composables',
        localesDir: '/src/locales',
        libDir: '/src/lib',
        directivesDir: '/src/directives',
        manifestPath: '/registry-manifest.json',
        outputDir: '/registry',
    };

    const mockMeta: MergedRegistryEntry = {
        name: 'button',
        title: 'Button',
        titleZh: '按钮',
        description: 'Button component',
        category: 'action',
        kind: 'component',
        files: ['Button.vue'],
        composables: ['useLocale.ts'],
        directives: [],
        lib: ['utils.ts'],
        dependencies: [],
        examples: [],
    };

    it('computes deterministic source hash and detects source changes', async () => {
        const fs = new MemoryFileSystemAdapter({
            '/src/components/button/Button.vue': '<template><button /></template>',
            '/src/composables/useLocale.ts': 'export const useLocale = () => {};',
            '/src/lib/utils.ts': 'export const cn = () => {};',
        });

        const cacheManager = new CacheManager(fs, '/cache.json');
        const hash1 = await cacheManager.computeSourceHash(
            'button',
            { files: ['Button.vue'], composables: ['useLocale.ts'] },
            mockMeta,
            { theme: 'brutalist' },
            { '--radius': '0px' },
            paths
        );

        // 相同输入产生相同 hash
        const hash2 = await cacheManager.computeSourceHash(
            'button',
            { files: ['Button.vue'], composables: ['useLocale.ts'] },
            mockMeta,
            { theme: 'brutalist' },
            { '--radius': '0px' },
            paths
        );
        expect(hash1).toBe(hash2);

        // 源码修改后产生新 hash
        await fs.writeFile('/src/components/button/Button.vue', '<template><button class="new" /></template>');
        const hash3 = await cacheManager.computeSourceHash(
            'button',
            { files: ['Button.vue'], composables: ['useLocale.ts'] },
            mockMeta,
            { theme: 'brutalist' },
            { '--radius': '0px' },
            paths
        );
        expect(hash3).not.toBe(hash1);
    });

    it('loads and saves cache records correctly', async () => {
        const fs = new MemoryFileSystemAdapter();
        const cacheManager = new CacheManager(fs, '/.cache.json');

        expect(await cacheManager.loadCache()).toEqual({});

        await cacheManager.saveCache({ button: 'hash123', dialog: 'hash456' });
        expect(await cacheManager.loadCache()).toEqual({ button: 'hash123', dialog: 'hash456' });
    });
});
