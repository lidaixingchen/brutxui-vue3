import crypto from 'node:crypto';
import type { RegistryIndex } from 'brutx-shared-vue';
import registryPackage from '../../package.json' with { type: 'json' };
import type { RegistrySbom, SbomComponent } from '../compiler/types.js';

export const SBOM_SPEC_VERSION = '1.5';
export const SBOM_FORMAT = 'CycloneDX';

export interface SbomGeneratorOptions {
    timestamp?: string | null;
    toolVendor?: string;
    toolName?: string;
    toolVersion?: string;
}

type SbomCore = Pick<RegistrySbom, 'bomFormat' | 'specVersion' | 'components'>;

export function resolveRegistryBuildTimestamp(timestamp?: string | null): string | null {
    return timestamp === undefined ? (process.env.BRUTX_REGISTRY_BUILD_TIMESTAMP ?? null) : timestamp;
}

/**
 * 规范化序列化 SBOM 核心字段，确保哈希与 serialNumber 具有一致的口径。
 */
export function canonicalizeSbomCore(
    sbom: SbomCore
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
    sbom: SbomCore
): string {
    const canonical = canonicalizeSbomCore(sbom);
    return `sha256-${crypto.createHash('sha256').update(canonical).digest('hex')}`;
}

function computeManifestBoundSerialNumber(manifestIntegrity: string, sbomIntegrity: string): string {
    const hex = crypto.createHash('sha256').update(`${manifestIntegrity}:${sbomIntegrity}`).digest('hex');
    return `urn:uuid:${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** 有清单摘要时计算完整 SBOM 的序列号，核心字段调用沿用其独立标识。 */
export function computeSbomSerialNumber(
    sbom: SbomCore & Partial<Pick<RegistrySbom, 'manifestIntegrity'>>
): string {
    if (sbom.manifestIntegrity !== undefined) {
        return computeManifestBoundSerialNumber(sbom.manifestIntegrity, computeSbomIntegrity(sbom));
    }

    const canonical = canonicalizeSbomCore(sbom);
    const hash = crypto.createHash('sha256').update(canonical).digest();
    const bytes = hash.subarray(0, 16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString('hex');
    return `urn:uuid:${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * 构建 CycloneDX 1.5 格式的 SBOM 数据对象。
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
            seenNpmDeps.add(dep);
        }
    }

    for (const dep of seenNpmDeps) {
        components.push({
            'bom-ref': `npm:${dep}`,
            type: 'library',
            name: dep,
        });
    }

    components.sort((a, b) => a['bom-ref'].localeCompare(b['bom-ref']));

    const core = { bomFormat: SBOM_FORMAT, specVersion: SBOM_SPEC_VERSION, components };
    const integrity = computeSbomIntegrity(core);
    const sbomBase = {
        $schema: 'http://cyclonedx.org/schema/bom-1.5.schema.json',
        bomFormat: core.bomFormat,
        specVersion: core.specVersion,
        version: 1,
        serialNumber: computeManifestBoundSerialNumber(manifestIntegrity, integrity),
        metadata: {
            timestamp: resolveRegistryBuildTimestamp(options.timestamp),
            tools: [
                {
                    vendor: options.toolVendor ?? 'BrutxUI',
                    name: options.toolName ?? 'brutx-registry-compiler',
                    version: options.toolVersion ?? registryPackage.version,
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

    return { ...sbomBase, integrity, manifestIntegrity };
}
