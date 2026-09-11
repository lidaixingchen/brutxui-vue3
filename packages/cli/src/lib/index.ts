export * from './types.js';

export * from './constants.js';

export { CliError } from './error.js';
export { getCliErrorAdvice } from './error-advice.js';

export * from './fs/index.js';
export { ProjectContext } from './project-context.js';
export type { ProjectEnvironmentInfo, ProjectContextOptions } from './project-context.js';

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

export {
    validateBrutalistConfig,
    migrateConfig,
    readConfigSafe,
    readConfig,
} from './config.js';

export {
    REGISTRY_ERROR_CODES,
    type HttpFetcher,
    type RegistryClientOptions,
    type ResolvedComponentPlan,
    type FetchItemOptions,
    type ListComponentsOptions,
    type RegistryErrorCode,
} from './registry-types.js';

export {
    RegistryClient,
    isComponentNotFoundError,
    isRegistrySecurityError,
} from './registry-client.js';

export {
    CacheStorage,
    createDefaultCacheStorage,
    clearCache,
    isOfflineMode,
    getCacheStats,
    type CacheReadResult,
    type CacheWriteInput,
    type CacheStats,
} from './storage/cache-storage.js';
export {
    resolveRegistrySources,
    isOfflineRequested,
    buildAuthHeaders,
    fetchWithSources,
    withOfflineScope,
} from './registry-source.js';
export {
    loadTrustedPublicKeys,
    setTrustedPublicKeys,
    resetTrustedPublicKeys,
    verifyManifestSignature,
    verifyManifestIntegrityAndSignature,
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
    isRequireSignature,
    applyRequireSignatureConfig,
} from './signature.js';

export {
    getInstalledComponentInfos,
    getInstalledComponentNames,
} from './installed-components.js';

export {
    ComponentScanner,
    type ComponentScanOptions,
    scanComponentFiles,
    extractDependencies,
    mapWithConcurrency,
} from './component-scanner.js';

export {
    generateSnippets,
    generateSnippetsForComponents,
    writeSnippetsFile,
    mergeSnippetsFile,
    mergeSnippetsContent,
    hasVscodeDir,
} from './vscode-snippets.js';

export * as services from './services/index.js';

export {
    ComponentMutationEngine,
} from './services/component-mutation-engine.js';
export type {
    PlanFileAction,
    MutationPlanFile,
    ComponentMutationPlan,
    ComponentPlanOptions,
    MutationCallbacks,
    ComponentExecuteOptions,
    DependencyInstallResult,
    ComponentMutationResult,
} from './services/component-mutation-engine.js';

export {
    ensureUtilsFile,
    resolveComponents,
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

export {
    diagnose,
    previewRepair,
    repair,
    DiagnosticEngine,
} from './services/diagnostic-service.js';

export {
    generateProjectSbom,
} from './services/sbom-service.js';
export type {
    ProjectSbomComponent,
    ProjectSbomOptions,
    ProjectSbomResult,
} from './services/sbom-service.js';

export * from './workspace/index.js';

