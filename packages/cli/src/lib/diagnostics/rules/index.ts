import type { DiagnosticRule } from '../types.js';
import { envRules } from './env-rules.js';
import { configRules } from './config-rules.js';
import { tailwindRules } from './tailwind-rules.js';
import { structureRules } from './structure-rules.js';
import { integrityRules } from './integrity-rules.js';

export * from './env-rules.js';
export * from './config-rules.js';
export * from './tailwind-rules.js';
export * from './structure-rules.js';
export * from './integrity-rules.js';

export const BUILTIN_RULES: DiagnosticRule[] = [
    ...envRules,
    ...configRules,
    ...tailwindRules,
    ...structureRules,
    ...integrityRules,
];
