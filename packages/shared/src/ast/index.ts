import { DEFAULT_SFC_FILENAME, SfcAstEngine } from './sfc-ast-engine.js';
import type { ClassifiedModuleSpecifier } from './types.js';

export * from './types.js';
export * from './source-parser.js';
export * from './module-references.js';
export * from './import-transformer.js';
export * from './sfc-ast-engine.js';

export function extractModuleSpecifiers(code: string, filename = DEFAULT_SFC_FILENAME): string[] {
    return SfcAstEngine.extractModuleSpecifiers(code, filename).map(item => item.specifier);
}

export function extractClassifiedModuleSpecifiers(code: string, filename = DEFAULT_SFC_FILENAME): ClassifiedModuleSpecifier[] {
    return SfcAstEngine.extractModuleSpecifiers(code, filename);
}
