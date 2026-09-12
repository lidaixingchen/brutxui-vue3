import { describe, it, expect } from 'vitest';
import { computeRegistryManifestIntegrity } from 'brutx-shared-vue';
import type { ComponentExportProjection } from 'brutx-shared-vue/api-contract';
import { RegistryCompiler } from '../../src/compiler/registry-compiler.js';
import { MemoryFileSystemAdapter } from '../../src/fs/memory-fs.js';
import type { CompilerPaths } from '../../src/compiler/types.js';

describe('Registry Snapshot & Digest Verification', () => {
    const paths: CompilerPaths = {
        componentsDir: '/virtual/ui/src/components',
        composablesDir: '/virtual/ui/src/composables',
        localesDir: '/virtual/ui/src/locales',
        libDir: '/virtual/ui/src/lib',
        directivesDir: '/virtual/ui/src/directives',
        manifestPath: '/virtual/ui/registry-manifest.json',
        outputDir: '/virtual/registry',
    };

    const mockMetadata = {
        button: {
            title: 'Button',
            titleZh: '按钮',
            description: 'Button component',
            category: 'action' as const,
            kind: 'component' as const,
            dependencies: [],
            examples: [],
        },
    };

    const publicProjection: ComponentExportProjection = {
        componentId: 'button',
        exports: [
            { source: './Button.vue', sourceName: 'default', publicName: 'Button', kind: 'value' },
        ],
    };

    function createVfs(): MemoryFileSystemAdapter {
        return new MemoryFileSystemAdapter({
            '/virtual/ui/package.json': JSON.stringify({
                name: 'brutx-ui-vue',
                version: '0.11.2',
            }),
            [paths.manifestPath]: JSON.stringify({
                button: {
                    files: ['Button.vue'],
                    composables: [],
                    directives: [],
                    lib: [],
                },
            }),
            '/virtual/ui/src/components/button/Button.vue': '<template><button><slot /></button></template>',
            '/virtual/ui/src/locales/zh-CN.ts': 'export default { ok: "确定" };',
        });
    }

    it('injects version from package.json, releaseTag, gitCommit, and produces matching digest', async () => {
        const fs = createVfs();
        const compiler = new RegistryCompiler({
            fs,
            paths,
            metadata: mockMetadata,
            publicProjection,
            releaseTag: 'v0.11.2',
            gitCommit: '3a9b1c7d8e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
        });

        const result = await compiler.compileAll();
        const manifest = result.manifest;

        expect(manifest.name).toBe('brutx-ui-vue');
        expect(manifest.schemaVersion).toBe(1);
        expect(manifest.registryVersion).toBe('0.11.2');
        expect(manifest.releaseTag).toBe('v0.11.2');
        expect(manifest.gitCommit).toBe('3a9b1c7d8e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b');
        expect(manifest.integrity).toMatch(/^[a-f0-9]{64}$/);
        expect(manifest.digest).toBe(manifest.integrity);

        // 验证摘要自洽：用相同输入重算摘要应完全一致
        const recomputed = computeRegistryManifestIntegrity({
            name: manifest.name,
            schemaVersion: manifest.schemaVersion,
            registryVersion: manifest.registryVersion,
            releaseTag: manifest.releaseTag,
            gitCommit: manifest.gitCommit,
            items: manifest.items,
        });
        expect(recomputed).toBe(manifest.digest);
    });

    it('invalidates digest when releaseTag or gitCommit is tampered', async () => {
        const fs = createVfs();
        const compiler = new RegistryCompiler({
            fs,
            paths,
            metadata: mockMetadata,
            publicProjection,
            releaseTag: 'v0.11.2',
            gitCommit: '3a9b1c7d8e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
        });

        const result = await compiler.compileAll();
        const manifest = result.manifest;

        // 1. 篡改 releaseTag
        const tamperedTagHash = computeRegistryManifestIntegrity({
            name: manifest.name,
            schemaVersion: manifest.schemaVersion,
            registryVersion: manifest.registryVersion,
            releaseTag: 'v0.11.3',
            gitCommit: manifest.gitCommit,
            items: manifest.items,
        });
        expect(tamperedTagHash).not.toBe(manifest.digest);

        // 2. 篡改 gitCommit
        const tamperedCommitHash = computeRegistryManifestIntegrity({
            name: manifest.name,
            schemaVersion: manifest.schemaVersion,
            registryVersion: manifest.registryVersion,
            releaseTag: manifest.releaseTag,
            gitCommit: '9999999999999999999999999999999999999999',
            items: manifest.items,
        });
        expect(tamperedCommitHash).not.toBe(manifest.digest);
    });

    it('resolves env variables BRUTX_RELEASE_TAG and GIT_COMMIT when options omitted', async () => {
        const fs = createVfs();
        const prevTag = process.env.BRUTX_RELEASE_TAG;
        const prevCommit = process.env.GIT_COMMIT;

        process.env.BRUTX_RELEASE_TAG = 'v1.0.0-rc.1';
        process.env.GIT_COMMIT = 'deadbeef12345678';

        try {
            const compiler = new RegistryCompiler({
                fs,
                paths,
                metadata: mockMetadata,
                publicProjection,
            });

            const result = await compiler.compileAll();
            expect(result.manifest.releaseTag).toBe('v1.0.0-rc.1');
            expect(result.manifest.gitCommit).toBe('deadbeef12345678');
        } finally {
            if (prevTag !== undefined) {
                process.env.BRUTX_RELEASE_TAG = prevTag;
            } else {
                delete process.env.BRUTX_RELEASE_TAG;
            }
            if (prevCommit !== undefined) {
                process.env.GIT_COMMIT = prevCommit;
            } else {
                delete process.env.GIT_COMMIT;
            }
        }
    });
});
