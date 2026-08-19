import type { DiagnosticRule } from '../types.js';
import { envRules } from './env-rules.js';

export * from './env-rules.js';

export const BUILTIN_RULES: DiagnosticRule[] = [
    ...envRules,
];
