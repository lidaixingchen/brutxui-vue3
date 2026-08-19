import { describe, expect, it } from 'vitest';
import type { CompiledRegistryResult } from '../../src/compiler/types.js';
import { MemoryFileSystemAdapter } from '../../src/fs/memory-fs.js';
import { DiskEmitter } from '../../src/emitters/disk-emitter.js';

describe('DiskEmitter', () => {
    const mockResult: CompiledRegistryResult = {
        index: {
            $schema: 'https://ui.shadcn.com/schema/registry-index.json',
            name: 'brutx-ui-vue',
            schemaVersion: 1,
            registryVersion: '0.1.0',
            homepage: 'https://github.com/lidaixingchen/brutxui-vue3',
            items: [],
        },
        manifest: {
            $schema: 'https://lidaixingchen.github.io/brutxui-vue3/registry-manifest.schema.json',
            name: 'brutx-ui-vue',
            schemaVersion: 1,
            registryVersion: '0.1.0',
            buildTimestamp: null,
            gitCommit: null,
            integrity: 'abc123',
            itemCount: 1,
            items: {},
        },
        sbom: {
            $schema: 'http://cyclonedx.org/schema/bom-1.5.schema.json',
            bomFormat: 'CycloneDX',
            specVersion: '1.5',
            version: 1,
            serialNumber: 'urn:uuid:123',
            metadata: {
                timestamp: null,
                tools: [],
                component: { 'bom-ref': 'brutx', type: 'application', name: 'brutx', version: '0.1.0' },
            },
            components: [],
            integrity: 'sha256-123',
            manifestIntegrity: 'abc123',
        },
        items: new Map([
            [
                'button',
                {
                    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
                    name: 'button',
                    type: 'registry:ui',
                    title: 'Button',
                    description: 'Button component',
                    dependencies: [],
                    registryDependencies: [],
                    files: [],
                    tailwind: {},
                    cssVars: {},
                    integrity: 'sha256-xyz',
                },
            ],
        ]),
        itemResults: [],
        cacheRecord: { button: 'hash1' },
        totalDurationMs: 10,
    };

    it('emits all registry files and cleans stale json files', async () => {
        const fs = new MemoryFileSystemAdapter({
            '/dist/registry/stale-old.json': '{"stale": true}',
        });

        const emitter = new DiskEmitter(fs);
        const { writtenCount, cleanedCount } = await emitter.emit(mockResult, '/dist/registry');

        expect(writtenCount).toBe(4); // button.json, index.json, manifest.json, sbom.json
        expect(cleanedCount).toBe(1); // stale-old.json cleaned

        expect(await fs.pathExists('/dist/registry/button.json')).toBe(true);
        expect(await fs.pathExists('/dist/registry/index.json')).toBe(true);
        expect(await fs.pathExists('/dist/registry/registry-manifest.json')).toBe(true);
        expect(await fs.pathExists('/dist/registry/registry-sbom.json')).toBe(true);
        expect(await fs.pathExists('/dist/registry/stale-old.json')).toBe(false);
    });
});
