import {
    buildPublicEntryContent,
    type ComponentExportProjection,
} from './api-contract.js'

/**
 * Generate a component entry from the explicit public projection. The source
 * directory is deliberately not inspected here, so adding an implementation
 * file cannot widen the component's public API.
 */
export function buildComponentIndexContent(projection: ComponentExportProjection): string {
    return buildPublicEntryContent(projection.exports)
}
