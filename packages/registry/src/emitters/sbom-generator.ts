import crypto from 'node:crypto';
import type { RegistryIndex } from 'brutx-shared-vue';
import type { RegistrySbom, SbomComponent } from '../compiler/types.js';

export const SBOM_SPEC_VERSION = '1.5';
export const SBOM_FORMAT = 'CycloneDX';

export interface SbomGeneratorOptions {
    timestamp?: string | null;
    toolVendor?: string;
    toolName?: string;
    toolVersion?: string;
}

/**
 * 规范化序列化 SBOM 核心字段，确保哈希与 serialNumber 具有一致的口径。
 */
export function canonicalizeSbomCore(
    sbom: Pick<RegistrySbom, 'bomFormat' | 'specVersion' | 'components'>
): string {
    return JSON.stringify({
        bomFormat: sbom.bomFormat,
        specVersion: sbom.specVersion,
        components: sbom.components,
    });
}

/**
 * 确定性计算 SBOM 完整性哈希。
 * 对 bomFormat/specVersion/components 求规范化 sha256。
 */
export function computeSbomIntegrity(
    sbom: Pick<RegistrySbom, 'bomFormat' | 'specVersion' | 'components'>
): string {
    const canonical = canonicalizeSbomCore(sbom);
    return `sha256-${crypto.createHash('sha256').update(canonical).digest('hex')}`;
}

/**
 * 确定性生成 SBOM serialNumber（UUID v4 格式的 urn）。
 */
export function computeSbomSerialNumber(
    sbom: Pick<RegistrySbom, 'bomFormat' | 'specVersion' | 'components'>
): string {
    const canonical = canonicalizeSbomCore(sbom);
    const hash = crypto.createHash('sha256').update(canonical).digest();
    const bytes = hash.subarray(0, 16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString('hex');
    return `urn:uuid:${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * 构建 CycloneDX 1.5 格式的 SBOM 数据对象（纯函数）。
 */
export function buildRegistrySbom(
    index: RegistryIndex,
    manifestIntegrity: string,
    options: SbomGeneratorOptions = {}
): RegistrySbom {
    const components: SbomComponent[] = [];
    const seenNpmDeps = new Set<string>();

    for (const item of index.items) {
        components.push({
            'bom-ref': `brutx:${item.name}`,
            type: 'application',
            name: item.name,
            version: index.registryVersion,
            description: item.description,
            hashes: [
                { alg: 'SHA-256', content: item.integrity.replace(/^sha256-/, '') },
            ],
            dependencies: [
                ...item.dependencies.map(dep => `npm:${dep}`),
                ...item.registryDependencies.map(dep => `brutx:${dep}`),
            ],
        });

        for (const dep of item.dependencies) {
            if (!seenNpmDeps.has(dep)) {
                seenNpmDeps.add(dep);
            }
        }
    }

    for (const dep of [...seenNpmDeps].sort()) {
        components.push({
            'bom-ref': `npm:${dep}`,
            type: 'library',
            name: dep,
        });
    }

    components.sort((a, b) => a['bom-ref'].localeCompare(b['bom-ref']));

    const sbomBase = {
        $schema: 'http://cyclonedx.org/schema/bom-1.5.schema.json',
        bomFormat: SBOM_FORMAT,
        specVersion: SBOM_SPEC_VERSION,
        version: 1,
        serialNumber: computeSbomSerialNumber({ bomFormat: SBOM_FORMAT, specVersion: SBOM_SPEC_VERSION, components }),
        metadata: {
            timestamp: options.timestamp ?? process.env.BRUTX_REGISTRY_BUILD_TIMESTAMP ?? null,
            tools: [
                {
                    vendor: options.toolVendor ?? 'brutx-vue',
                    name: options.toolName ?? 'registry-builder',
                    version: options.toolVersion ?? index.registryVersion,
                },
            ],
            component: {
                'bom-ref': `brutx:${index.name}`,
                type: 'application' as const,
                name: index.name,
                version: index.registryVersion,
            },
        },
        components,
    };

    const sbomIntegrity = computeSbomIntegrity(sbomBase);
    return { ...sbomBase, integrity: sbomIntegrity, manifestIntegrity };
}
