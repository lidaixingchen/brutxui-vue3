import { describe, expect, it } from 'vitest';
import type { RegistryIndex } from 'brutx-shared-vue';
import {
    buildRegistrySbom,
    computeSbomIntegrity,
    computeSbomSerialNumber,
} from '../../src/emitters/sbom-generator.js';

describe('SbomGenerator', () => {
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
        expect(sbom1.serialNumber.startsWith('urn:uuid:')).toBe(true);
        expect(sbom1.serialNumber).toBe(sbom2.serialNumber);
        expect(sbom1.integrity).toBe(sbom2.integrity);
        expect(sbom1.manifestIntegrity).toBe(manifestIntegrity);

        // 组件与 npm 依赖
        const refs = sbom1.components.map(c => c['bom-ref']);
        expect(refs).toContain('brutx:button');
        expect(refs).toContain('npm:reka-ui');
    });

    it('computes consistent serialNumber and integrity helpers', () => {
        const payload = {
            bomFormat: 'CycloneDX',
            specVersion: '1.5',
            components: [],
        };

        const serial1 = computeSbomSerialNumber(payload);
        const serial2 = computeSbomSerialNumber(payload);
        expect(serial1).toBe(serial2);

        const int1 = computeSbomIntegrity(payload);
        const int2 = computeSbomIntegrity(payload);
        expect(int1).toBe(int2);
        expect(int1.startsWith('sha256-')).toBe(true);
    });
});
