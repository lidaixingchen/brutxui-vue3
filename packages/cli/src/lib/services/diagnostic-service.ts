import type {
    DiagnoseOptions,
    DiagnosticReport,
    DiagnosticRule,
    RepairOptions,
    RepairReport,
} from '../diagnostics/types.js';
import { DiagnosticEngine } from '../diagnostics/engine.js';

export async function diagnose(
    options: DiagnoseOptions = {},
    customRules?: DiagnosticRule[]
): Promise<DiagnosticReport> {
    const engine = new DiagnosticEngine(customRules);
    return await engine.diagnose(options);
}

export async function repair(
    options: RepairOptions = {},
    customRules?: DiagnosticRule[]
): Promise<RepairReport> {
    const engine = new DiagnosticEngine(customRules);
    return await engine.repair(options);
}

export { DiagnosticEngine };
