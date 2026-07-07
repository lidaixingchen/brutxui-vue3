export {
    ensureUtilsFile,
    resolveComponents,
    resolveComponentFilePath,
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
