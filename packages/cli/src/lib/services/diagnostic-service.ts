import type {
    DiagnoseOptions,
    DiagnosticReport,
    DiagnosticRule,
    RepairOptions,
    RepairPreviewReport,
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

export async function previewRepair(
    options: RepairOptions = {},
    customRules?: DiagnosticRule[]
): Promise<RepairPreviewReport> {
    const engine = new DiagnosticEngine(customRules);
    return await engine.previewRepair(options);
}

export async function repair(
    options: RepairOptions = {},
    customRules?: DiagnosticRule[]
): Promise<RepairReport> {
    const engine = new DiagnosticEngine(customRules);
    return await engine.repair(options);
}

export { DiagnosticEngine };
export {
    defineDiagnosticRule,
    defineDiagnosticRules,
    CustomRuleLoader,
} from '../diagnostics/custom-rule-loader.js';
