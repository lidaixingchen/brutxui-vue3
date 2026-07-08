import fs from 'fs-extra';
import path from 'path';
import type { AliasConfig, BrutalistConfig, ProjectType, TailwindConfig } from '../types.js';
import {
    CONFIG_FILES,
    CURRENT_CONFIG_VERSION,
    getBrutalistCssStyles,
    SCHEMA_URL,
    UTILS_TEMPLATE,
} from '../constants.js';
import { FileTransaction } from '../file-transaction.js';
import { detectTailwindVersion, isSafePath, resolveAliasPath } from '../project.js';

export interface ProjectInitializationSettings {
    tailwind: TailwindConfig;
    aliases: AliasConfig;
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
    onUtilityHelper?: (result: { alias: string; path: string; created: boolean }) => void;
    onComponentsDirectory?: (result: { path: string }) => void;
    onStyles?: (result: { cssPath: string; added: boolean }) => void;
    onNuxtConfig?: (result: NuxtConfigResult) => void;
}

export interface ProjectInitializationOptions {
    cwd: string;
    projectType: ProjectType;
    settings: ProjectInitializationSettings;
    callbacks?: ProjectInitializationCallbacks;
}

async function createConfigFile(
    cwd: string,
    settings: ProjectInitializationSettings,
    transaction: FileTransaction
): Promise<BrutalistConfig> {
    const config: BrutalistConfig = {
        $schema: SCHEMA_URL,
        $version: CURRENT_CONFIG_VERSION,
        style: 'brutalism',
        tailwind: settings.tailwind,
        aliases: settings.aliases,
    };

    await transaction.writeJson(path.join(cwd, 'components.json'), config, { spaces: 2 });
    return config;
}

async function addBrutalistStyles(cwd: string, cssPath: string, transaction: FileTransaction): Promise<boolean> {
    const fullPath = path.join(cwd, cssPath);

    if (!(await isSafePath(fullPath, cwd))) {
        throw new Error(`Security Error: CSS path traversal detected. Access denied to path "${fullPath}".`);
    }

    await transaction.ensureDir(path.dirname(fullPath));

    const tailwindVersion = await detectTailwindVersion(cwd);

    let content = '';
    if (await fs.pathExists(fullPath)) {
        content = await fs.readFile(fullPath, 'utf-8');
        const hasCompleteBrutalistStyles = content.includes('--color-brutal-bg')
            && content.includes('.bg-brutal-primary')
            && content.includes('.animate-in');
        if (hasCompleteBrutalistStyles) {
            return false;
        }
        content += await getBrutalistCssStyles();
    } else if (tailwindVersion === 'v4') {
        content = `@import "tailwindcss";\n${await getBrutalistCssStyles()}`;
    } else {
        content = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n${await getBrutalistCssStyles()}`;
    }

    await transaction.writeFile(fullPath, content);
    return true;
}

async function findNuxtConfig(cwd: string): Promise<string | null> {
    for (const file of CONFIG_FILES.nuxt) {
        const fullPath = path.join(cwd, file);
        if (await fs.pathExists(fullPath)) {
            return fullPath;
        }
    }
    return null;
}

export function injectNuxtConfig(content: string, cssPath: string, componentsRelDir: string): string | null {
    const defineMatch = content.match(/defineNuxtConfig\s*\(/);
    if (!defineMatch || defineMatch.index === undefined) {
        return null;
    }

    const afterDefine = defineMatch.index + defineMatch[0].length;
    const braceIndex = content.indexOf('{', afterDefine);
    if (braceIndex === -1) {
        return null;
    }

    const hasComponents = /\bcomponents\s*:/.test(content);
    const hasCss = /\bcss\s*:/.test(content);

    if (hasComponents && hasCss) {
        return content;
    }

    const insertions: string[] = [];

    if (!hasComponents) {
        insertions.push(`\n    components: ['~/${componentsRelDir}'],`);
    }

    if (!hasCss) {
        insertions.push(`\n    css: ['${cssPath}'],`);
    }

    const before = content.slice(0, braceIndex + 1);
    const after = content.slice(braceIndex + 1);

    return before + insertions.join('') + after;
}

async function configureNuxtConfig(
    cwd: string,
    cssPath: string,
    componentsDir: string,
    transaction: FileTransaction
): Promise<NuxtConfigResult> {
    const configPath = await findNuxtConfig(cwd);
    const componentsRelDir = path.relative(cwd, componentsDir).replace(/\\/g, '/');

    if (!configPath) {
        return {
            configured: false,
            status: 'not-found',
            cssPath,
            componentsRelDir,
        };
    }

    const original = await fs.readFile(configPath, 'utf-8');
    const result = injectNuxtConfig(original, cssPath, componentsRelDir);
    const configFile = path.basename(configPath);

    if (result === null) {
        return {
            configured: false,
            status: 'manual-required',
            cssPath,
            componentsRelDir,
            configFile,
        };
    }

    if (result === original) {
        return {
            configured: true,
            status: 'already-configured',
            cssPath,
            componentsRelDir,
            configFile,
        };
    }

    try {
        await transaction.writeFile(configPath, result);
        return {
            configured: true,
            status: 'updated',
            cssPath,
            componentsRelDir,
            configFile,
        };
    } catch {
        return {
            configured: false,
            status: 'write-failed',
            cssPath,
            componentsRelDir,
            configFile,
        };
    }
}

export async function initializeProjectFiles(options: ProjectInitializationOptions): Promise<ProjectInitializationResult> {
    const { cwd, projectType, settings, callbacks } = options;
    const transaction = new FileTransaction();

    try {
        const config = await createConfigFile(cwd, settings, transaction);

        const utilsPath = await resolveAliasPath(settings.aliases.utils, cwd) + '.ts';
        await transaction.ensureDir(path.dirname(utilsPath));
        const utilsCreated = !(await fs.pathExists(utilsPath));
        if (utilsCreated) {
            await transaction.writeFile(utilsPath, UTILS_TEMPLATE);
        }
        callbacks?.onUtilityHelper?.({ alias: settings.aliases.utils, path: utilsPath, created: utilsCreated });

        const componentsDir = await resolveAliasPath(settings.aliases.components, cwd);
        await transaction.ensureDir(path.join(componentsDir, 'ui'));
        callbacks?.onComponentsDirectory?.({ path: componentsDir });

        const stylesAdded = await addBrutalistStyles(cwd, settings.tailwind.css, transaction);
        callbacks?.onStyles?.({ cssPath: settings.tailwind.css, added: stylesAdded });

        const nuxt = projectType === 'nuxt'
            ? await configureNuxtConfig(cwd, settings.tailwind.css, componentsDir, transaction)
            : {
                configured: false,
                status: 'skipped' as const,
                cssPath: settings.tailwind.css,
                componentsRelDir: path.relative(cwd, componentsDir).replace(/\\/g, '/'),
            };
        callbacks?.onNuxtConfig?.(nuxt);

        await transaction.commit();

        return {
            config,
            utilsPath,
            utilsCreated,
            componentsDir,
            stylesAdded,
            nuxt,
        };
    } catch (error) {
        const rollbackFailures = await transaction.rollback();
        return Promise.reject(Object.assign(error instanceof Error ? error : new Error(String(error)), {
            rollbackFailures,
        }));
    }
}
