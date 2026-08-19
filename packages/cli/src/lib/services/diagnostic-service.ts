import type { DiagnoseOptions, DiagnosticReport, DiagnosticRule } from '../diagnostics/types.js';
import { DiagnosticEngine } from '../diagnostics/engine.js';

export async function diagnose(
    options: DiagnoseOptions = {},
    customRules?: DiagnosticRule[]
): Promise<DiagnosticReport> {
    const engine = new DiagnosticEngine(customRules);
    return await engine.diagnose(options);
}

export { DiagnosticEngine };
