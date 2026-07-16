export {
    extractModuleSpecifiers,
    extractClassifiedModuleSpecifiers,
    extractScriptBlocks,
} from './extract-module-specifiers.js';
export type { ClassifiedModuleSpecifier } from './extract-module-specifiers.js';
export type { ComponentFileManifest } from './registry-manifest.types.js';
export type { ScanOptions } from './scan-component-files.js';
export { scanComponentFiles } from './scan-component-files.js';
export { buildComponentIndexContent } from './component-index.js';
