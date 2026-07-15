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
export {
    VERBOSE_LEVEL_NONE,
    VERBOSE_LEVEL_STEP,
    VERBOSE_LEVEL_DETAIL,
    VERBOSE_LEVEL_TRACE,
} from './logger.js';

export { getItem, resolveDeps, readConfig, readConfigSafe, migrateConfig } from './registry.js';

export {
    clearCache,
    getCachedEntry,
    setCachedEntry,
    touchCachedEntry,
    dedupeInflight,
    isOfflineMode,
    type CacheReadResult,
    type CacheWriteInput,
} from './cache.js';
export {
    resolveRegistrySources,
    isOfflineRequested,
    buildAuthHeaders,
    fetchWithSources,
    withOfflineScope,
} from './registry-source.js';
export type { RegistrySourceStatus } from './types.js';
export {
    loadTrustedPublicKeys,
    verifyManifestSignature,
    generateEd25519KeyPair,
    signManifestIntegrity,
} from './signature.js';
export type { TrustedPublicKey } from './signature.js';
export { FileTransaction } from './file-transaction.js';
export {
    MANIFEST_RELATIVE_PATH,
    getManifestPath,
    readManifest,
    updateInstalledComponents,
    removeInstalledComponents,
    computeInstalledContentHash,
} from './manifest.js';

export {
    AUDIT_LOG_RELATIVE_PATH,
    getAuditLogPath,
    appendAuditLog,
    readAuditLog,
    getRecentFailures,
    getRecentByCommand,
    createAuditEntry,
    withAuditLog,
    auditLogExists,
    countAuditEntries,
} from './audit.js';
export type {
    AuditCommand,
    AuditEntry,
    AuditReadFilter,
} from './audit.js';

export {
    isDryRunEnvActive,
    isGlobalDryRun,
    setGlobalDryRun,
    mergeDryRun,
    resetGlobalDryRun,
    printDryRunAction,
} from './global-dry-run.js';

export {
    isRequireSignatureEnvActive,
    isRequireSignature,
    setRequireSignature,
    resetRequireSignature,
} from './signature-mode.js';

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
