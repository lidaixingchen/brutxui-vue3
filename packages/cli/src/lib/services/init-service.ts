import { DiskFileSystemAdapter, type FileSystemAdapter } from 'brutx-shared-vue/fs';
const defaultDiskFs = new DiskFileSystemAdapter();
import path from 'path';
import type { AliasConfig, BrutalistConfig, ProjectType, TailwindConfig } from '../types.js';
import {
    CONFIG_FILES,
    CURRENT_CONFIG_VERSION,
    SCHEMA_URL,
    UTILS_TEMPLATE,
} from '../constants.js';
import { FileTransaction } from '../file-transaction.js';
import { CliError } from '../error.js';
import { ProjectContext } from '../project-context.js';
import { applyCssTokenPlan, planCssTokenInjection } from '../css/index.js';
import { injectNuxtConfig } from '../frameworks/nuxt-config.js';

export { injectNuxtConfig } from '../frameworks/nuxt-config.js';

export interface ProjectInitializationSettings {
    tailwind: TailwindConfig;
    aliases: AliasConfig;
    sharedBase?: string;
}

export type NuxtConfigStatus =
    | 'not-found'
    | 'manual-required'
    | 'already-configured'
    | 'updated'
    | 'write-failed'
    | 'skipped';

export interface NuxtConfigResult {
    configured: boolean;
    status: NuxtConfigStatus;
    cssPath: string;
    componentsRelDir: string;
    configFile?: string;
    errorMessage?: string;
}

export interface ProjectInitializationResult {
    config: BrutalistConfig;
    utilsPath: string;
    utilsCreated: boolean;
    componentsDir: string;
    stylesAdded: boolean;
    nuxt: NuxtConfigResult;
}

export interface ProjectInitializationCallbacks {
    onUtilityHelper?: (info: { alias: string; path: string; created: boolean }) => void;
    onComponentsDirectory?: (info: { path: string }) => void;
    onStyles?: (info: { cssPath: string; added: boolean }) => void;
    onNuxtConfig?: (result: NuxtConfigResult) => void;
}

export interface ProjectInitializationOptions {
    cwd: string;
    projectType: ProjectType;
    settings: ProjectInitializationSettings;
    callbacks?: ProjectInitializationCallbacks;
    context?: ProjectContext;
    fs?: FileSystemAdapter;
    transaction?: FileTransaction;
}

async function createConfigFile(
    cwd: string,
    settings: ProjectInitializationSettings,
    isSplitMode: boolean,
    transaction: FileTransaction
): Promise<BrutalistConfig> {
    const tailwind: TailwindConfig = {
        config: settings.tailwind.config,
        css: settings.tailwind.css,
    };
    const trimmedTokens = settings.tailwind.tokensFile?.trim();
    if (isSplitMode && trimmedTokens) {
        tailwind.tokensFile = trimmedTokens;
    }

    const config: BrutalistConfig = {
        $schema: SCHEMA_URL,
        $version: CURRENT_CONFIG_VERSION,
        style: 'brutalism',
        tailwind,
        aliases: settings.aliases,
        ...(settings.sharedBase ? { sharedBase: settings.sharedBase } : {}),
    };

    await transaction.writeJson(path.join(cwd, 'components.json'), config, { spaces: 2 });
    return config;
}

async function findNuxtConfig(cwd: string, fsAdapter?: FileSystemAdapter): Promise<string | null> {
    for (const file of CONFIG_FILES.nuxt) {
        const fullPath = path.join(cwd, file);
        const exists = await (fsAdapter ?? defaultDiskFs).pathExists(fullPath);
        if (exists) {
            return fullPath;
        }
    }
    return null;
}

async function configureNuxtConfig(
    cwd: string,
    cssPath: string,
    componentsDir: string,
    transaction: FileTransaction,
    fsAdapter?: FileSystemAdapter
): Promise<NuxtConfigResult> {
    const configPath = await findNuxtConfig(cwd, fsAdapter);
    const componentsRelDir = path.relative(cwd, componentsDir).replace(/\\/g, '/');

    if (!configPath) {
        return {
            configured: false,
            status: 'not-found',
            cssPath,
            componentsRelDir,
        };
    }

    const configFile = path.basename(configPath);
    const original = await (fsAdapter ?? defaultDiskFs).readFile(configPath, 'utf-8');
    const result = injectNuxtConfig(original, { cssPath, componentsRelDir });

    if (result.status === 'manual-required') {
        return {
            configured: false,
            status: 'manual-required',
            cssPath,
            componentsRelDir,
            configFile,
        };
    }

    if (!result.changed) {
        return {
            configured: true,
            status: 'already-configured',
            cssPath,
            componentsRelDir,
            configFile,
        };
    }

    try {
        await transaction.writeFile(configPath, result.content);
        return {
            configured: true,
            status: 'updated',
            cssPath,
            componentsRelDir,
            configFile,
        };
    } catch (error) {
        return {
            configured: false,
            status: 'write-failed',
            cssPath,
            componentsRelDir,
            configFile,
            errorMessage: error instanceof Error ? error.message : 'unknown error',
        };
    }
}

export async function initializeProjectFiles(options: ProjectInitializationOptions): Promise<ProjectInitializationResult> {
    const { cwd, projectType, settings, callbacks } = options;
    let context = options.context;
    if (!context) {
        const fallbackConfig: BrutalistConfig = {
            $schema: SCHEMA_URL,
            $version: CURRENT_CONFIG_VERSION,
            style: 'brutalism',
            tailwind: settings.tailwind,
            aliases: settings.aliases,
            ...(settings.sharedBase ? { sharedBase: settings.sharedBase } : {}),
        };

        try {
            context = await ProjectContext.loadUninitialized(cwd, { fs: options.fs });
        } catch (error) {
            if (error instanceof CliError && error.code === 'CONFIG_INVALID') {
                try {
                    context = await ProjectContext.loadUninitialized(cwd, {
                        fs: options.fs,
                        configOverride: fallbackConfig,
                    });
                } catch (fallbackError) {
                    throw new CliError(`Failed to initialize project context: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`, {
                        cause: fallbackError,
                    });
                }
            } else {
                throw error;
            }
        }
    }
    const transaction = options.transaction ?? context.createTransaction();

    try {
        const plan = await planCssTokenInjection({
            cwd,
            tailwind: settings.tailwind,
            fs: context.fs,
            resolveAlias: (s) => context.resolveAliasPath(s),
        });

        const isSplitMode = plan.tokensPath !== null;
        const config = await createConfigFile(cwd, settings, isSplitMode, transaction);
        context.bindConfig(config);

        const utilsPath = await context.resolveUtilsFilePath();
        await transaction.ensureDir(path.dirname(utilsPath));
        const utilsCreated = !(await context.fs.pathExists(utilsPath));
        if (utilsCreated) {
            await transaction.writeFile(utilsPath, UTILS_TEMPLATE);
        }
        callbacks?.onUtilityHelper?.({
            alias: settings.sharedBase ? `${settings.sharedBase}/utils` : settings.aliases.utils,
            path: utilsPath,
            created: utilsCreated,
        });

        const componentsDir = await context.resolveComponentsDir();
        await transaction.ensureDir(path.join(componentsDir, 'ui'));
        callbacks?.onComponentsDirectory?.({ path: componentsDir });

        await applyCssTokenPlan(plan, transaction);
        callbacks?.onStyles?.({
            cssPath: settings.tailwind.css,
            added: true,
            ...(plan.tokensPath ? { tokensPath: plan.tokensPath } : {}),
        });

        const nuxt = projectType === 'nuxt'
            ? await configureNuxtConfig(cwd, settings.tailwind.css, componentsDir, transaction, context.fs)
            : {
                configured: false,
                status: 'skipped' as const,
                cssPath: settings.tailwind.css,
                componentsRelDir: path.relative(cwd, componentsDir).replace(/\\/g, '/'),
            };
        callbacks?.onNuxtConfig?.(nuxt);

        if (nuxt.status === 'write-failed') {
            const detail = nuxt.errorMessage ? `: ${nuxt.errorMessage}` : '';
            throw new Error(`Failed to write Nuxt config at ${nuxt.configFile}${detail}`);
        }

        await transaction.commit();

        return {
            config,
            utilsPath,
            utilsCreated,
            componentsDir,
            stylesAdded: true,
            nuxt,
        };
    } catch (error) {
        const rollbackFailures = await transaction.rollback();
        return Promise.reject(Object.assign(error instanceof Error ? error : new Error(String(error)), {
            rollbackFailures,
        }));
    }
}
