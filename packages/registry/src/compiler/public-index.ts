import { buildComponentIndexContent as sharedBuildComponentIndexContent } from 'brutx-shared-vue/scan';
import type {
    ComponentExportProjection,
    PublicExport,
} from 'brutx-shared-vue/api-contract';
import type {
    ComponentIndexBuilder,
    PublicComponentProjection,
} from './types.js';

function isProjection(value: PublicComponentProjection | undefined): value is ComponentExportProjection {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const candidate = value as Partial<ComponentExportProjection>;
    return typeof candidate.componentId === 'string' && Array.isArray(candidate.exports);
}

function isPublicExport(value: unknown): value is PublicExport {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<PublicExport>;
    return (
        typeof candidate.source === 'string'
        && typeof candidate.sourceName === 'string'
        && typeof candidate.publicName === 'string'
        && (candidate.kind === 'value' || candidate.kind === 'type')
    );
}

export function buildRegistryComponentIndex(
    projection: PublicComponentProjection,
    builder?: ComponentIndexBuilder,
): string {
    if (!isProjection(projection) || !projection.exports.every(isPublicExport)) {
        throw new Error('A valid public component projection is required to build a Registry component index');
    }
    return builder
        ? builder(projection)
        : sharedBuildComponentIndexContent(projection);
}
