import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RegistryIndex } from 'brutx-shared-vue';
import registryPackage from '../../package.json' with { type: 'json' };
import {
    buildRegistrySbom,
    computeSbomIntegrity,
    computeSbomSerialNumber,
} from '../../src/emitters/sbom-generator.js';

describe('SbomGenerator', () => {
    afterEach(() => vi.unstubAllEnvs());

    const mockIndex: RegistryIndex = {
        name: 'brutx-ui-vue',
        schemaVersion: 1,
        registryVersion: '0.1.0',
        homepage: 'https://github.com/lidaixingchen/brutxui-vue3',
        items: [
            {
                name: 'button',
                type: 'registry:ui',
                title: 'Button',
                description: 'Button component',
                dependencies: ['reka-ui'],
                registryDependencies: [],
                files: [{ path: 'components/ui/button/Button.vue', type: 'registry:ui' }],
                tailwind: {},
                cssVars: {},
                integrity: 'sha256-abc12345',
            },
        ],
    };

    it('generates valid CycloneDX 1.5 SBOM with deterministic serial number and integrity', () => {
        const manifestIntegrity = 'deadbeef1234567890';
        const sbom1 = buildRegistrySbom(mockIndex, manifestIntegrity, { timestamp: '2026-08-19T00:00:00Z' });
        const sbom2 = buildRegistrySbom(mockIndex, manifestIntegrity, { timestamp: '2026-08-19T00:00:00Z' });

        expect(sbom1.bomFormat).toBe('CycloneDX');
        expect(sbom1.specVersion).toBe('1.5');
        expect(sbom1.serialNumber).toBe('urn:uuid:17ca697f-937c-42a6-a3cd-6eb0350cd8af');
        expect(sbom1.serialNumber).toBe(sbom2.serialNumber);
        expect(computeSbomSerialNumber(sbom1)).toBe(sbom1.serialNumber);
        expect(sbom1.integrity).toBe(sbom2.integrity);
        expect(sbom1.manifestIntegrity).toBe(manifestIntegrity);

        // 组件与 npm 依赖
        const refs = sbom1.components.map(c => c['bom-ref']);
        expect(refs).toContain('brutx:button');
        expect(refs).toContain('npm:reka-ui');
    });

    it('binds the serial number to the manifest while keeping timestamps out of integrity', () => {
        const original = buildRegistrySbom(mockIndex, 'manifest-a', { timestamp: null });
        const differentManifest = buildRegistrySbom(mockIndex, 'manifest-b', { timestamp: null });
        const differentTime = buildRegistrySbom(mockIndex, 'manifest-a', { timestamp: '2001-02-03T04:05:06.000Z' });

        expect(differentManifest.serialNumber).not.toBe(original.serialNumber);
        expect(differentManifest.integrity).toBe(original.integrity);
        expect(differentTime.serialNumber).toBe(original.serialNumber);
        expect(differentTime.integrity).toBe(original.integrity);
    });

    it('resolves explicit, environment and disabled timestamps and supports tool overrides', () => {
        const manifestIntegrity = 'manifest';
        const environmentTime = '2001-02-03T04:05:06.000Z';
        const explicitTime = '2026-08-19T00:00:00.000Z';
        vi.stubEnv('BRUTX_REGISTRY_BUILD_TIMESTAMP', undefined);
        expect(buildRegistrySbom(mockIndex, manifestIntegrity).metadata.timestamp).toBeNull();

        vi.stubEnv('BRUTX_REGISTRY_BUILD_TIMESTAMP', environmentTime);
        const defaults = buildRegistrySbom(mockIndex, manifestIntegrity).metadata;
        expect(defaults.timestamp).toBe(environmentTime);
        expect(defaults.tools).toEqual([{
            vendor: 'BrutxUI',
            name: 'brutx-registry-compiler',
            version: registryPackage.version,
        }]);
        expect(buildRegistrySbom(mockIndex, manifestIntegrity, { timestamp: null }).metadata.timestamp).toBeNull();

        const custom = buildRegistrySbom(mockIndex, manifestIntegrity, {
            timestamp: explicitTime,
            toolVendor: 'Example',
            toolName: 'generator',
            toolVersion: '1.0.0',
        }).metadata;
        expect(custom.timestamp).toBe(explicitTime);
        expect(custom.tools).toEqual([{ vendor: 'Example', name: 'generator', version: '1.0.0' }]);
    });

    it('computes consistent serialNumber and integrity helpers', () => {
        const payload = {
            bomFormat: 'CycloneDX',
            specVersion: '1.5',
            components: [],
        };

        expect(computeSbomSerialNumber(payload)).toBe('urn:uuid:556a2835-e9fe-4f8d-9b89-9871f9e24aa5');

        const int1 = computeSbomIntegrity(payload);
        const int2 = computeSbomIntegrity(payload);
        expect(int1).toBe(int2);
        expect(int1.startsWith('sha256-')).toBe(true);
    });
});
