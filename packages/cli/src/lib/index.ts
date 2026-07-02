export * from './types.js';

export * from './constants.js';

export { CliError } from './error.js';

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
    detectTailwindVersion,
} from './project.js';

export { installPackages, getInstallCommand } from './package-manager.js';

export { Logger, logger } from './logger.js';
export type { LoggerOptions } from './logger.js';

export { getItem, resolveDeps, readConfig, readConfigSafe, migrateConfig } from './registry.js';

export { clearCache } from './cache.js';

export {
    generateSnippets,
    generateSnippetsForComponents,
    writeSnippetsFile,
    mergeSnippetsFile,
    hasVscodeDir,
} from './vscode-snippets.js';
