import { input, confirm } from '@inquirer/prompts';
import path from 'node:path';
import { DiskFileSystemAdapter } from '../lib/fs/index.js';
import { FileTransaction } from '../lib/file-transaction.js';
import { mergeDryRun, printDryRunAction } from '../lib/global-dry-run.js';
import { applyDependencyStep, describeDependencyStep, planInitialization } from '../lib/services/init-plan.js';
import {
    applyProjectInitializationFiles,
    type ProjectInitializationResult,
} from '../lib/services/init-service.js';
import { CONFIG_FILE_NAME, readConfigFile } from '../lib/config.js';

import {
    type InitOptions,
    type ProjectType,
    type BrutalistConfig,
    type AliasConfig,
    DOCS_URL,
    CliError,
    detectProjectType,
    detectWorkspaceRoot,
    findCssFile,
    findTailwindConfig,
    getDefaultAliases,
    getDefaultTokensFilePath,
    logger,
    type NuxtConfigResult,
    type ProjectInitializationSettings,
} from '../lib/index.js';

const defaultDiskFs = new DiskFileSystemAdapter();

type DetectedSettings = ProjectInitializationSettings;

interface LoadSettingsResult {
    settings: ProjectInitializationSettings;
    isExistingProject: boolean;
    existingHasTokensFile: boolean;
    existingConfig?: Partial<BrutalistConfig>;
}

async function detectSettings(cwd: string, projectType?: ProjectType): Promise<DetectedSettings> {
    const type = projectType ?? await detectProjectType(cwd);
    const cssFile = await findCssFile(cwd, type);
    const aliases = await getDefaultAliases(cwd);
    const tailwindConfigFile = await findTailwindConfig(cwd);

    const fallbackCss = type === 'nuxt'
        ? 'assets/css/main.css'
        : (type.includes('src') ? 'src/index.css' : 'index.css');

    const css = cssFile ?? fallbackCss;

    return {
        tailwind: {
            config: tailwindConfigFile ?? '',
            css,
            tokensFile: getDefaultTokensFilePath(css),
        },
        aliases,
        sharedBase: `${aliases.components}/brutx/shared`,
    };
}

async function loadOrDetectSettings(configTarget: string, projectType: ProjectType): Promise<LoadSettingsResult> {
    const configPath = path.join(configTarget, CONFIG_FILE_NAME);
    const configExists = await defaultDiskFs.pathExists(configPath);

    let existingConfig: Partial<BrutalistConfig> | null = null;
    let existingHasTokensFile = false;

    if (configExists) {
        try {
            existingConfig = await readConfigFile(configTarget, defaultDiskFs) as Partial<BrutalistConfig>;
        } catch (error) {
            throw new CliError(
                `Failed to parse existing components.json in "${configTarget}": ${error instanceof Error ? error.message : String(error)}`,
                {
                    code: 'CONFIG_INVALID',
                    exitCode: 1,
                    cause: error,
                }
            );
        }

        if (!existingConfig || typeof existingConfig !== 'object' || Array.isArray(existingConfig)) {
            throw new CliError(
                `Invalid components.json in "${configTarget}": configuration root must be an object.`,
                {
                    code: 'CONFIG_INVALID',
                    exitCode: 1,
                }
            );
        }

        if (existingConfig.tailwind !== undefined) {
            if (typeof existingConfig.tailwind !== 'object' || existingConfig.tailwind === null || Array.isArray(existingConfig.tailwind)) {
                throw new CliError(
                    `Invalid components.json in "${configTarget}": "tailwind" must be an object.`,
                    {
                        code: 'CONFIG_INVALID',
                        exitCode: 1,
                    }
                );
            }
            if (existingConfig.tailwind.css !== undefined) {
                if (typeof existingConfig.tailwind.css !== 'string' || !existingConfig.tailwind.css.trim()) {
                    throw new CliError(
                        `Invalid components.json in "${configTarget}": "tailwind.css" must be a non-empty string.`,
                        {
                            code: 'CONFIG_INVALID',
                            exitCode: 1,
                        }
                    );
                }
            }
            if (existingConfig.tailwind.tokensFile !== undefined && typeof existingConfig.tailwind.tokensFile !== 'string') {
                throw new CliError(
                    `Invalid components.json in "${configTarget}": "tailwind.tokensFile" must be a string if defined.`,
                    {
                        code: 'CONFIG_INVALID',
                        exitCode: 1,
                    }
                );
            }
        }

        if (existingConfig.aliases !== undefined) {
            if (typeof existingConfig.aliases !== 'object' || existingConfig.aliases === null || Array.isArray(existingConfig.aliases)) {
                throw new CliError(
                    `Invalid components.json in "${configTarget}": "aliases" must be an object.`,
                    {
                        code: 'CONFIG_INVALID',
                        exitCode: 1,
                    }
                );
            }
        }

        existingHasTokensFile = Boolean(existingConfig.tailwind?.tokensFile?.trim());
    }

    const detected = await detectSettings(configTarget, projectType);

    if (!existingConfig) {
        return {
            settings: detected,
            isExistingProject: false,
            existingHasTokensFile: false,
        };
    }

    const css = existingConfig.tailwind?.css?.trim() || detected.tailwind.css;
    const config = existingConfig.tailwind?.config ?? detected.tailwind.config;
    const aliases: AliasConfig = {
        components: existingConfig.aliases?.components || detected.aliases.components,
        utils: existingConfig.aliases?.utils || detected.aliases.utils,
        composables: existingConfig.aliases?.composables || detected.aliases.composables,
    };
    const sharedBase = existingConfig.sharedBase;

    let tokensFile: string | undefined;
    if (existingHasTokensFile) {
        tokensFile = existingConfig.tailwind!.tokensFile!.trim();
    } else {
        tokensFile = undefined;
    }

    return {
        settings: {
            tailwind: {
                config,
                css,
                ...(tokensFile ? { tokensFile } : {}),
            },
            aliases,
            sharedBase,
        },
        isExistingProject: true,
        existingHasTokensFile,
        existingConfig,
    };
}

async function promptForConfig(
    defaults: DetectedSettings,
    context?: { isExistingProject: boolean; existingHasTokensFile: boolean }
): Promise<DetectedSettings> {
    // tailwind.config 已由 detectSettings 真实检测（查找 tailwind.config.* 文件）；
    // 未检测到（如 Tailwind v4 无独立配置文件）时直接透传，不提供交互式输入
    const tailwindConfig = defaults.tailwind.config;

    const globalCss = await input({
        message: 'Where is your global CSS file?',
        default: defaults.tailwind.css,
    });

    const defaultSplit = context?.isExistingProject
        ? context.existingHasTokensFile
        : true;

    const splitTokens = await confirm({
        message: 'Split design tokens into a separate CSS file? (recommended for theme maintenance and version upgrades)',
        default: defaultSplit,
    });

    let tokensFile: string | undefined;
    if (splitTokens) {
        if (context?.isExistingProject && context.existingHasTokensFile && defaults.tailwind.tokensFile) {
            tokensFile = (globalCss === defaults.tailwind.css)
                ? defaults.tailwind.tokensFile
                : getDefaultTokensFilePath(globalCss);
        } else {
            tokensFile = getDefaultTokensFilePath(globalCss);
        }
    } else {
        tokensFile = undefined;
    }

    const componentsAlias = await input({
        message: 'Configure the import alias for components:',
        default: defaults.aliases.components,
    });

    const utilsAlias = await input({
        message: 'Configure the import alias for utils:',
        default: defaults.aliases.utils,
    });

    const composablesAlias = await input({
        message: 'Configure the import alias for composables:',
        default: defaults.aliases.composables,
    });

    return {
        tailwind: {
            config: tailwindConfig,
            css: globalCss,
            ...(tokensFile ? { tokensFile } : {}),
        },
        aliases: {
            components: componentsAlias,
            utils: utilsAlias,
            composables: composablesAlias,
        },
        sharedBase: componentsAlias === defaults.aliases.components
            ? defaults.sharedBase
            : `${componentsAlias}/brutx/shared`,
    };
}

function reportNuxtConfigResult(result: NuxtConfigResult, dryRun: boolean): void {
    const { status, configFile } = result;
    if (status === 'skipped') return;

    const configTarget = configFile ?? 'nuxt.config.ts';
    switch (status) {
        case 'not-found':
        case 'manual-required':
            logger.warn(status === 'not-found'
                ? 'No Nuxt configuration file found.'
                : `Nuxt configuration in ${configTarget} needs manual changes.`);
            logger.info(`Ensure defineNuxtConfig() in ${configTarget} includes these entries:`);
            logger.info(`    components: [${JSON.stringify(result.componentsSpecifier ?? `~~/${result.componentsRelDir}`)}],`);
            logger.info(`    css: [${JSON.stringify(result.cssSpecifier ?? `~~/${result.cssPath}`)}],`);
            break;
        case 'already-configured':
            if (!dryRun) logger.info(`Nuxt configuration already includes the requested entries in ${configTarget}.`);
            break;
        case 'updated':
            if (!dryRun) logger.info(`Updated ${configTarget} for the project CSS and components.`);
            break;
    }
}

function printDryRunPlan(plan: Awaited<ReturnType<typeof planInitialization>>): void {
    for (const { label, path: target, action, skipReason } of plan.files.steps) {
        if (skipReason) {
            printDryRunAction('skip', `${label} (${target}). ${skipReason}`);
        } else {
            const operation = !action ? 'keep' : action.type === 'ensure-dir' ? 'create directory' : 'write';
            printDryRunAction(operation, `${label} (${target})`);
        }
    }
    reportNuxtConfigResult(plan.files.nuxt.result, true);

    for (const step of plan.dependencies) {
        const operation = step.action === 'keep' ? 'keep dependencies' : 'install dependencies';
        printDryRunAction(operation, `${step.cwd} (${describeDependencyStep(step)})`);
    }
}

export async function init(options: InitOptions & { dryRun?: boolean }): Promise<void> {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const dryRun = mergeDryRun(options.dryRun);
    const nonInteractive = options.yes || options.defaults;
    logger.setSilent(options.silent ?? false);
    logger.bold('\n🎨 Brutx-Vue - Neo-Brutalism Vue 3 Component Library\n');

    const workspaceRoot = options.workspaceRoot
        ? path.resolve(options.workspaceRoot)
        : await detectWorkspaceRoot(cwd);
    let configTarget = cwd;
    if (workspaceRoot && workspaceRoot !== cwd) {
        logger.info(`   Workspace root: ${workspaceRoot}`);
        logger.info(`   Current package: ${cwd}\n`);
        if (!nonInteractive && await confirm({
            message: `You are in a workspace sub-package. Install to workspace root (${workspaceRoot}) instead?`,
            default: false,
        })) {
            configTarget = workspaceRoot;
        }
    }

    const transaction = dryRun ? undefined : new FileTransaction(defaultDiskFs, configTarget);
    let plan: Awaited<ReturnType<typeof planInitialization>>;
    let initialization: ProjectInitializationResult;

    try {
        await transaction?.lockProjectWrites();
        const projectType = await detectProjectType(configTarget);
        logger.info(`   Detected project: ${projectType}\n`);

        const { settings: defaults, isExistingProject, existingHasTokensFile, existingConfig } =
            await loadOrDetectSettings(configTarget, projectType);
        const preserveExisting = isExistingProject && !options.force;
        const settings = nonInteractive || preserveExisting
            ? defaults
            : await promptForConfig(defaults, { isExistingProject, existingHasTokensFile });
        plan = await planInitialization({
            cwd: configTarget,
            projectType,
            settings,
            existingConfig,
            fs: defaultDiskFs,
            preserveExisting,
            vscode: options.vscode ?? 'auto',
        }, workspaceRoot, defaultDiskFs);

        if (!transaction) {
            printDryRunPlan(plan);
            return;
        }

        initialization = await applyProjectInitializationFiles(plan.files, transaction);
        await transaction.commit();
    } catch (error) {
        const rollbackFailures = await transaction?.rollback() ?? [];
        if (rollbackFailures.length > 0) {
            logger.error(`Rollback failed for: ${rollbackFailures.join(', ')}`);
        }
        if (error instanceof CliError) throw error;
        const message = error instanceof Error ? error.message : String(error);
        throw new CliError(message, { code: 'WRITE_FAILED', cause: error });
    }

    const fileChanges = plan.files.steps.filter(step => step.action !== undefined);
    for (const { label, skipReason } of plan.files.steps) {
        if (skipReason) logger.warn(`Skipped ${label}. ${skipReason}`);
    }
    for (const step of fileChanges) {
        if (step === plan.files.nuxt.step) continue;
        logger.info(`${step.label} applied at ${path.relative(configTarget, step.path)}`);
    }
    const nuxt = initialization.nuxt;
    reportNuxtConfigResult(nuxt, false);

    const failures: string[] = [];
    for (const step of plan.dependencies) {
        if (step.action === 'keep') continue;
        const command = describeDependencyStep(step);
        logger.info(`Installing dependencies in ${step.cwd} (${command})`);
        try {
            await applyDependencyStep(step);
            logger.success(`Dependencies installed in ${step.cwd}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            failures.push(`${step.cwd} (${message})`);
            logger.warn(`In ${step.cwd}, run ${command} or retry init.`);
        }
    }
    if (failures.length > 0) {
        throw new CliError(`Dependency installation failed in ${failures.join(', ')}. Re-run init with the same options to finish setup.`);
    }

    if (nuxt.status === 'manual-required' || nuxt.status === 'not-found') {
        logger.info('Project files and dependencies are ready. Complete the Nuxt configuration above.');
    } else if (fileChanges.length > 0 || plan.dependencies.some(step => step.action !== 'keep')) {
        logger.success('Brutx-Vue initialized successfully!');
    } else {
        logger.info('Brutx-Vue is already initialized.');
        return;
    }

    logger.newLine();
    logger.bold('Next steps:');
    logger.highlight('  1. Add components:');
    logger.info('     npx brutx-vue@latest add button');
    logger.info('     npx brutx-vue@latest add --all');
    logger.newLine();
    logger.dim(`Documentation: ${DOCS_URL}`);
}
