import type { DiagnosticRule } from '../types.js';
import { envRules } from './env-rules.js';
import { configRules } from './config-rules.js';

export * from './env-rules.js';
export * from './config-rules.js';

export const BUILTIN_RULES: DiagnosticRule[] = [
    ...envRules,
    ...configRules,
];
