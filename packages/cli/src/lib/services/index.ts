export {
    ComponentMutationEngine,
} from './component-mutation-engine.js';
export type {
    PlanFileAction,
    MutationPlanFile,
    ComponentMutationPlan,
    ComponentPlanOptions,
    MutationCallbacks,
    ComponentExecuteOptions,
    DependencyInstallResult,
    ComponentMutationResult,
} from './component-mutation-engine.js';

export {
    ensureUtilsFile,
    resolveComponents,
    writeComponentFiles,
} from './add-service.js';
export type {
    ComponentFileWriteCallbacks,
    ComponentFileWriteFailure,
    ComponentFileWriteOptions,
    ComponentFileWriteResult,
    ComponentResolutionResult,
    EnsureUtilsFileResult,
} from './add-service.js';

export {
    diffComponent,
    diffComponents,
    getInstalledComponents,
} from './diff-service.js';

export {
    initializeProjectFiles,
    injectNuxtConfig,
} from './init-service.js';
export type {
    NuxtConfigResult,
    NuxtConfigStatus,
    ProjectInitializationCallbacks,
    ProjectInitializationOptions,
    ProjectInitializationResult,
    ProjectInitializationSettings,
} from './init-service.js';

export {
    countComponentFiles,
    prepareRemoveComponents,
    removeComponents,
} from './remove-service.js';
export type {
    RemoveExecutionOptions,
    RemoveExecutionResult,
    RemovePreparation,
} from './remove-service.js';

export {
    diagnose,
    previewRepair,
    repair,
    DiagnosticEngine,
    defineDiagnosticRule,
    defineDiagnosticRules,
    CustomRuleLoader,
} from './diagnostic-service.js';
export type {
    CheckResult,
    CheckStatus,
    DiagnosticCategory,
    DiagnosticContext,
    DiagnosticReport,
    DiagnosticRule,
    DiagnosticSummary,
    DiagnoseOptions,
    RepairOptions,
    RepairReport,
    RepairItemReport,
    RuleFixStatus,
    FileLocation,
    RepairAction,
    RepairPlan,
    PlanFixResult,
    FileDiffPreview,
    RepairPreviewReport,
} from '../diagnostics/types.js';
export type { RuleSeverity } from '../types.js';

export {
    generateProjectSbom,
} from './sbom-service.js';
export type {
    ProjectSbomComponent,
    ProjectSbomOptions,
    ProjectSbomResult,
} from './sbom-service.js';
