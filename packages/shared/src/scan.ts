export {
    extractModuleSpecifiers,
    extractClassifiedModuleSpecifiers,
    extractScriptBlocks,
} from './extract-module-specifiers.js';
export type { ClassifiedModuleSpecifier } from './extract-module-specifiers.js';
export type { ComponentFileManifest } from './registry-manifest.types.js';
export {
    DEFAULT_LIB_EXCLUDE,
    DEFAULT_MANIFEST_OVERRIDES,
    applyManifestOverrides,
} from './scan-manifest.js';
export type { ScanOptions } from './scan-component-files.js';
export { scanComponentFiles } from './scan-component-files.js';
export { buildComponentIndexContent } from './component-index.js';

