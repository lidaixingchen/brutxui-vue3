import { describe, expect, it } from 'vitest';
import type { ComponentMetadataEntry, RegistryManifest } from 'brutx-shared-vue';
import type { ComponentExportProjection } from 'brutx-shared-vue/api-contract';
import { MemoryFileSystemAdapter } from '../../src/fs/memory-fs.js';
import { RegistryCompiler } from '../../src/compiler/registry-compiler.js';
import type { CompilerPaths } from '../../src/compiler/types.js';

describe('RegistryCompiler (Zero-IO Tests)', () => {
    const paths: CompilerPaths = {
        componentsDir: '/ui/src/components',
        composablesDir: '/ui/src/composables',
        localesDir: '/ui/src/locales',
        libDir: '/ui/src/lib',
        directivesDir: '/ui/src/directives',
        manifestPath: '/ui/registry-manifest.json',
        outputDir: '/registry',
    };

    const mockMetadata: Record<string, ComponentMetadataEntry> = {
        button: {
            title: 'Button',
            titleZh: '按钮',
            description: 'Button component',
            category: 'action',
            kind: 'component',
            dependencies: ['reka-ui'],
            examples: [],
        },
        dialog: {
            title: 'Dialog',
            titleZh: '对话框',
            description: 'Dialog component',
            category: 'overlay',
            kind: 'component',
            dependencies: ['reka-ui'],
            examples: [],
        },
    };

    const mockManifest: RegistryManifest = {
        button: {
            files: ['Button.vue'],
            composables: ['useLocale.ts'],
            directives: [],
            lib: ['utils.ts'],
        },
        dialog: {
            files: ['Dialog.vue'],
            composables: ['useLocale.ts'],
            directives: [],
            lib: ['utils.ts'],
        },
    };

    const mockPublicProjection: Readonly<Record<string, ComponentExportProjection>> = {
        button: {
            componentId: 'button',
            exports: [
                { source: './Button.vue', sourceName: 'default', publicName: 'Button', kind: 'value' },
            ],
        },
        dialog: {
            componentId: 'dialog',
            exports: [
                { source: './Dialog.vue', sourceName: 'default', publicName: 'Dialog', kind: 'value' },
            ],
        },
    };

    function createMockVfs(): MemoryFileSystemAdapter {
        return new MemoryFileSystemAdapter({
            '/ui/registry-manifest.json': JSON.stringify(mockManifest),
            '/ui/src/components/button/Button.vue': [
                '<template><button><slot /></button></template>',
                '<script setup lang="ts">',
                'import { useLocale } from \'../../composables/useLocale\';',
                '</script>',
            ].join('\n'),
            '/ui/src/components/dialog/Dialog.vue': [
                '<template><div><Button /></div></template>',
                '<script setup lang="ts">',
                'import Button from \'../button/Button.vue\';',
                'import { useLocale } from \'../../composables/useLocale\';',
                '</script>',
            ].join('\n'),
            '/ui/src/composables/useLocale.ts': 'export function useLocale() { return { t: (k: string) => k }; }',
            '/ui/src/locales/zh-CN.ts': 'export default { common: { ok: "确定" } };',
            '/ui/src/lib/utils.ts': 'export function cn(...inputs: any[]) { return inputs.join(" "); }',
        });
    }

    it('loads merged registry cleanly from VFS', async () => {
        const fs = createMockVfs();
        const compiler = new RegistryCompiler({
            fs,
            paths,
            metadata: mockMetadata,
            publicProjection: mockPublicProjection,
        });

        const merged = await compiler.loadMergedRegistry();
        expect(Object.keys(merged).sort()).toEqual(['button', 'dialog']);
        expect(merged.button?.files).toEqual(['Button.vue']);
        expect(merged.dialog?.dependencies).toEqual(['reka-ui']);
    });

    it('compiles individual items with deterministic integrity and dependencies', async () => {
        const fs = createMockVfs();
        const compiler = new RegistryCompiler({
            fs,
            paths,
            metadata: mockMetadata,
            publicProjection: mockPublicProjection,
        });

        const buttonResult = await compiler.compileItem('button');
        expect(buttonResult.name).toBe('button');
        expect(buttonResult.item.integrity.startsWith('sha256-')).toBe(true);
        expect(buttonResult.item.files.map(f => f.path)).toContain('components/ui/button/Button.vue');
        expect(buttonResult.item.files.map(f => f.path)).toContain('components/ui/button/index.ts');
        expect(buttonResult.item.files.map(f => f.path)).toContain('composables/useLocale.ts');

        const dialogResult = await compiler.compileItem('dialog');
        expect(dialogResult.item.registryDependencies).toContain('button');
    });

    it('builds a public index from the explicit projection', async () => {
        const fs = createMockVfs();
        const projection: ComponentExportProjection = {
            componentId: 'button',
            exports: [
                { source: './Button.vue', sourceName: 'default', publicName: 'Button', kind: 'value' },
            ],
        };
        const compiler = new RegistryCompiler({
            fs,
            paths,
            metadata: mockMetadata,
            publicProjection: projection,
        });

        const result = await compiler.compileItem('button');
        const index = result.item.files.find(file => file.path.endsWith('/index.ts'));
        expect(index?.content).toContain("export { default as Button } from '@/components/ui/button/Button.vue'");
        expect(index?.content).not.toContain('export *');
    });

    it('invalidates the source hash when the public projection changes', async () => {
        const projection: ComponentExportProjection = {
            componentId: 'button',
            exports: [
                { source: './Button.vue', sourceName: 'default', publicName: 'Button', kind: 'value' },
            ],
        };
        const changedProjection: ComponentExportProjection = {
            ...projection,
            exports: [
                ...projection.exports,
                { source: './Button.vue', sourceName: 'default', publicName: 'ButtonAlias', kind: 'value' },
            ],
        };
        const first = new RegistryCompiler({
            fs: createMockVfs(),
            paths,
            metadata: mockMetadata,
            publicProjection: projection,
        });
        const second = new RegistryCompiler({
            fs: createMockVfs(),
            paths,
            metadata: mockMetadata,
            publicProjection: changedProjection,
        });

        const firstResult = await first.compileItem('button');
        const secondResult = await second.compileItem('button');
        expect(secondResult.sourceHash).not.toBe(firstResult.sourceHash);
    });

    it('invalidates the source hash when the public contract digest changes', async () => {
        const projection: ComponentExportProjection = {
            componentId: 'button',
            exports: [
                { source: './Button.vue', sourceName: 'default', publicName: 'Button', kind: 'value' },
            ],
        };
        const first = new RegistryCompiler({
            fs: createMockVfs(),
            paths,
            metadata: mockMetadata,
            publicProjection: projection,
            publicProjectionDigest: 'contract-before',
        });
        const second = new RegistryCompiler({
            fs: createMockVfs(),
            paths,
            metadata: mockMetadata,
            publicProjection: projection,
            publicProjectionDigest: 'contract-after',
        });

        const firstResult = await first.compileItem('button');
        const secondResult = await second.compileItem('button');
        expect(secondResult.sourceHash).not.toBe(firstResult.sourceHash);
    });

    it('compiles locale-zh-cn bundle', async () => {
        const fs = createMockVfs();
        const compiler = new RegistryCompiler({
            fs,
            paths,
            metadata: mockMetadata,
            publicProjection: mockPublicProjection,
        });

        const localeResult = await compiler.compileLocaleZhCn();
        expect(localeResult.name).toBe('locale-zh-cn');
        expect(localeResult.item.files.map(f => f.path)).toContain('locales/zh-CN.ts');
    });

    it('compiles entire registry and produces valid index, manifest and sbom', async () => {
        const fs = createMockVfs();
        const compiler = new RegistryCompiler({
            fs,
            paths,
            metadata: mockMetadata,
            publicProjection: mockPublicProjection,
        });

        const result = await compiler.compileAll();

        expect(result.index.items.length).toBe(3); // button, dialog, locale-zh-cn
        expect(result.items.has('button')).toBe(true);
        expect(result.items.has('dialog')).toBe(true);
        expect(result.items.has('locale-zh-cn')).toBe(true);

        expect(result.manifest.itemCount).toBe(3);
        expect(result.manifest.integrity).toMatch(/^[a-f0-9]{64}$/);
        expect(result.manifest.items.button?.integrity).toBe(result.items.get('button')?.integrity);

        expect(result.sbom.bomFormat).toBe('CycloneDX');
        expect(result.sbom.serialNumber.startsWith('urn:uuid:')).toBe(true);
        expect(result.sbom.manifestIntegrity).toBe(result.manifest.integrity);
    });

    it('replays cache records and invalidates modified source', async () => {
        const fs = createMockVfs();
        const compiler = new RegistryCompiler({
            fs,
            paths,
            metadata: mockMetadata,
            publicProjection: mockPublicProjection,
        });

        const first = await compiler.compileAll({ forceRebuild: true });
        await fs.writeJson('/.registry-cache.json', first.cacheRecord);
        const replay = await compiler.compileAll();
        expect(replay.itemResults.every(item => item.cached)).toBe(true);

        await fs.writeFile('/ui/src/components/button/Button.vue', '<template><button class="changed" /></template>');
        const changed = await compiler.compileAll();
        expect(changed.itemResults.find(item => item.name === 'button')?.cached).toBe(false);
    });

    it('rejects a manifest that omits a new component source file', async () => {
        const fs = createMockVfs();
        await fs.writeFile('/ui/src/components/button/Added.vue', '<template><span /></template>');
        const compiler = new RegistryCompiler({
            fs,
            paths,
            metadata: mockMetadata,
            publicProjection: mockPublicProjection,
        });

        await expect(compiler.loadMergedRegistry()).rejects.toThrow('registry-manifest.json is stale');
    });
});
