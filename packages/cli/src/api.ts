/**
 * Brutx-Vue CLI 公共 API 唯一入口（package.json 的 main/types/exports 指向本文件）。
 * 显式具名 re-export，明确界定公共 API 面：
 * 后续在 lib/services 中新增的导出不会自动成为公共 API，避免 semver 兼容性负担。
 */
export {
    ensureUtilsFile,
    resolveComponents,
    resolveComponentFilePath,
    writeComponentFiles,
    diffComponent,
    diffComponents,
    getInstalledComponents,
    initializeProjectFiles,
    injectNuxtConfig,
    countComponentFiles,
    prepareRemoveComponents,
    removeComponents,
} from './lib/services/index.js';
export type {
    ComponentFileWriteCallbacks,
    ComponentFileWriteFailure,
    ComponentFileWriteOptions,
    ComponentFileWriteResult,
    ComponentResolutionResult,
    EnsureUtilsFileResult,
    NuxtConfigResult,
    NuxtConfigStatus,
    ProjectInitializationCallbacks,
    ProjectInitializationOptions,
    ProjectInitializationResult,
    ProjectInitializationSettings,
    RemoveExecutionOptions,
    RemoveExecutionResult,
    RemovePreparation,
} from './lib/services/index.js';
