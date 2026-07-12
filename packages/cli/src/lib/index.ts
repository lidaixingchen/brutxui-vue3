export * from './types.js';

export * from './constants.js';

export { CliError } from './error.js';
export { getCliErrorAdvice } from './error-advice.js';

export {
    detectProjectType,
    detectPackageManager,
    detectWorkspaceRoot,
    readTsConfig,
    findTailwindConfig,
    findCssFile,
    getAliasFromTsConfig,
    resolveAliasPath,
    getDefaultAliases,
    resolveImportAlias,
    isSafePath,
    verifyWrittenPath,
} from './project.js';

export { installPackages, getInstallCommand } from './package-manager.js';

export { Logger, logger } from './logger.js';
export type { LoggerOptions } from './logger.js';

export { getItem, resolveDeps, readConfig, readConfigSafe, migrateConfig } from './registry.js';

export { clearCache } from './cache.js';
export { FileTransaction } from './file-transaction.js';
export {
    MANIFEST_RELATIVE_PATH,
    getManifestPath,
    readManifest,
    updateInstalledComponents,
    removeInstalledComponents,
} from './manifest.js';

export {
    getInstalledComponentInfos,
    getInstalledComponentNames,
} from './installed-components.js';

export {
    generateSnippets,
    generateSnippetsForComponents,
    writeSnippetsFile,
    mergeSnippetsFile,
    hasVscodeDir,
} from './vscode-snippets.js';

export * as services from './services/index.js';

export {
    ensureUtilsFile,
    resolveComponents,
    resolveComponentFilePath,
    writeComponentFiles,
} from './services/add-service.js';
export type {
    ComponentFileWriteCallbacks,
    ComponentFileWriteFailure,
    ComponentFileWriteOptions,
    ComponentFileWriteResult,
    ComponentResolutionResult,
    EnsureUtilsFileResult,
} from './services/add-service.js';

export {
    initializeProjectFiles,
    injectNuxtConfig,
} from './services/init-service.js';
export type {
    NuxtConfigResult,
    NuxtConfigStatus,
    ProjectInitializationCallbacks,
    ProjectInitializationOptions,
    ProjectInitializationResult,
    ProjectInitializationSettings,
} from './services/init-service.js';

export {
    diffComponent,
    diffComponents,
    getInstalledComponents,
} from './services/diff-service.js';

export {
    countComponentFiles,
    prepareRemoveComponents,
    removeComponents,
} from './services/remove-service.js';
export type {
    RemoveExecutionOptions,
    RemoveExecutionResult,
    RemovePreparation,
} from './services/remove-service.js';
