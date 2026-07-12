import ora from 'ora';
import { input, confirm } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';

import {
    type InitOptions,
    SHARED_DEPENDENCIES,
    COMPONENT_DEPENDENCIES,
    BASE_DEPENDENCIES,
    DOCS_URL,
    CliError,
    detectProjectType,
    detectPackageManager,
    detectWorkspaceRoot,
    findCssFile,
    getDefaultAliases,
    installPackages,
    getInstallCommand,
    logger,
    writeSnippetsFile,
    hasVscodeDir,
    initializeProjectFiles,
    type NuxtConfigResult,
    type ProjectInitializationSettings,
} from '../lib/index.js';

type DetectedSettings = ProjectInitializationSettings;

async function detectSettings(cwd: string): Promise<DetectedSettings> {
    const projectType = await detectProjectType(cwd);
    const cssFile = await findCssFile(cwd, projectType);
    const aliases = await getDefaultAliases(cwd);

    const fallbackCss = projectType === 'nuxt'
        ? 'assets/css/main.css'
        : (projectType.includes('src') ? 'src/index.css' : 'index.css');

    return {
        tailwind: {
            config: '',
            css: cssFile ?? fallbackCss,
        },
        aliases,
    };
}

async function promptForConfig(defaults: DetectedSettings): Promise<DetectedSettings> {
    const tailwindConfig = defaults.tailwind.config !== ''
        ? await input({
            message: 'Where is your tailwind.config located?',
            default: defaults.tailwind.config,
        })
        : defaults.tailwind.config;

    const globalCss = await input({
        message: 'Where is your global CSS file?',
        default: defaults.tailwind.css,
    });

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
        },
        aliases: {
            components: componentsAlias,
            utils: utilsAlias,
            composables: composablesAlias,
        },
    };
}

async function shouldProceed(cwd: string, options: InitOptions): Promise<boolean> {
    const configPath = path.join(cwd, 'components.json');

    if (!(await fs.pathExists(configPath))) {
        return true;
    }

    if (options.force) {
        return true;
    }

    if (options.yes) {
        logger.warn('Brutx-Vue is already initialized. Use --force to overwrite.');
        return false;
    }

    const overwrite = await confirm({
        message: 'Brutx-Vue is already initialized. Overwrite?',
        default: false,
    });

    if (!overwrite) {
        logger.warn('Aborted.');
        return false;
    }

    return true;
}

function printManualNuxtInstructions(cssPath: string, componentsRelDir: string): void {
    logger.newLine();
    logger.bold('Please manually add the following to your nuxt.config.ts inside defineNuxtConfig():');
    logger.info(`    components: ['~/${componentsRelDir}'],`);
    logger.info(`    css: ['${cssPath}'],`);
}

function reportNuxtConfigResult(result: NuxtConfigResult, spinner: ReturnType<typeof ora> | null): void {
    if (result.status === 'not-found') {
        spinner?.warn('No nuxt.config file found. Skipping Nuxt configuration.');
        return;
    }

    if (result.status === 'manual-required') {
        spinner?.warn('Could not auto-inject Nuxt configuration.');
        printManualNuxtInstructions(result.cssPath, result.componentsRelDir);
        return;
    }

    if (result.status === 'already-configured') {
        spinner?.info('Nuxt config already contains components and css configuration, skipped.');
        return;
    }

    if (result.status === 'updated') {
        spinner?.info('Updated ' + result.configFile + ' with components and css configuration');
        return;
    }

    if (result.status === 'write-failed') {
        spinner?.warn('Failed to update nuxt config. Restored original file.');
        printManualNuxtInstructions(result.cssPath, result.componentsRelDir);
    }
}

function getRollbackFailures(error: unknown): string[] {
    if (error && typeof error === 'object' && 'rollbackFailures' in error) {
        const rollbackFailures = (error as { rollbackFailures?: unknown }).rollbackFailures;
        if (Array.isArray(rollbackFailures) && rollbackFailures.every(item => typeof item === 'string')) {
            return rollbackFailures;
        }
    }
    return [];
}

function printNuxtHints(cssPath: string): void {
    logger.newLine();
    logger.bold('Nuxt project detected. The following has been configured:');
    logger.info('- Component directory registered in nuxt.config.ts');
    logger.info(`- CSS tokens added to ${cssPath}`);
    logger.newLine();
    logger.dim('Note: For auto-imports, consider using the @brutx-vue/nuxt module.');
}

export async function init(options: InitOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();
    const projectType = await detectProjectType(cwd);

    logger.setSilent(options.silent ?? false);

    logger.bold('\n🎨 Brutx-Vue - Neo-Brutalism Vue 3 Component Library\n');
    logger.info(`   Detected project: ${projectType}\n`);

    let workspaceRoot: string | null = null;
    let configTarget = cwd;
    let sharedDepsTarget = cwd;
    let componentDepsTarget = cwd;

    if (options.workspaceRoot) {
        workspaceRoot = path.resolve(options.workspaceRoot);
    } else {
        workspaceRoot = await detectWorkspaceRoot(cwd);
    }

    const isInWorkspaceSubPackage = workspaceRoot !== null
        && path.resolve(cwd) !== path.resolve(workspaceRoot);

    if (isInWorkspaceSubPackage) {
        logger.info(`   Workspace root: ${workspaceRoot}`);
        logger.info(`   Current package: ${cwd}\n`);

        let installToRoot = false;

        if (!options.yes && !options.defaults) {
            installToRoot = await confirm({
                message: `You are in a workspace sub-package. Install to workspace root (${workspaceRoot}) instead?`,
                default: false,
            });
        }

        if (installToRoot) {
            configTarget = workspaceRoot!;
            sharedDepsTarget = workspaceRoot!;
            componentDepsTarget = workspaceRoot!;
        } else {
            configTarget = cwd;
            sharedDepsTarget = workspaceRoot!;
            componentDepsTarget = cwd;
        }
    }

    if (!(await shouldProceed(configTarget, options))) {
        return;
    }

    let settings = await detectSettings(configTarget);

    if (!options.yes && !options.defaults) {
        settings = await promptForConfig(settings);
    }

    const spinner = options.silent ? null : ora('Initializing Brutx-Vue...').start();

    try {
        const initialization = await initializeProjectFiles({
            cwd: configTarget,
            projectType,
            settings,
            callbacks: {
                onUtilityHelper: result => {
                    if (result.created) {
                        spinner?.info('Created utility helper at ' + result.alias);
                    } else {
                        spinner?.info('Utility helper already exists, skipping.');
                    }
                },
                onComponentsDirectory: () => {
                    spinner?.info('Created components/ui directory');
                },
                onStyles: result => {
                    if (result.added) {
                        spinner?.info('Added brutalist styles to ' + result.cssPath);
                    } else {
                        spinner?.info('Brutalist design tokens already present in ' + result.cssPath + ', skipped duplicate injection.');
                    }
                },
                onNuxtConfig: result => {
                    reportNuxtConfigResult(result, spinner);
                },
            },
        });

        spinner?.succeed('Brutx-Vue initialized successfully!');

        const packageManager = await detectPackageManager(cwd);

        if (isInWorkspaceSubPackage && configTarget === cwd) {
            logger.newLine();
            logger.bold(`Installing shared dependencies to workspace root with ${packageManager}...`);

            try {
                await installPackages(packageManager, [...SHARED_DEPENDENCIES], sharedDepsTarget);
                logger.success('✓ Shared dependencies installed to workspace root');
            } catch {
                logger.warn('⚠ Failed to install shared dependencies to workspace root.');
                logger.info(
                    `  Run manually: ${getInstallCommand(packageManager, [...SHARED_DEPENDENCIES])}`
                );
            }

            logger.bold(`Installing component dependencies to current package with ${packageManager}...`);

            try {
                await installPackages(packageManager, [...COMPONENT_DEPENDENCIES], componentDepsTarget);
                logger.success('✓ Component dependencies installed to current package');
            } catch {
                logger.warn('⚠ Failed to install component dependencies.');
                logger.info(
                    `  Run manually: ${getInstallCommand(packageManager, [...COMPONENT_DEPENDENCIES])}`
                );
            }
        } else {
            logger.newLine();
            logger.bold(`Installing dependencies with ${packageManager}...`);

            try {
                await installPackages(packageManager, [...BASE_DEPENDENCIES], configTarget);
                logger.success('✓ Dependencies installed');
            } catch {
                logger.warn('⚠ Failed to install dependencies automatically.');
                logger.info(
                    `  Run manually: ${getInstallCommand(packageManager, [...BASE_DEPENDENCIES])}`
                );
            }
        }

        const shouldGenerateSnippets = options.vscode === true
            || (options.vscode !== false && await hasVscodeDir(configTarget));

        if (shouldGenerateSnippets) {
            const snippetPath = await writeSnippetsFile(configTarget, initialization.config);
            logger.success(`✓ VS Code snippets generated at ${path.relative(configTarget, snippetPath)}`);
        }

        logger.newLine();
        logger.bold('Next steps:');
        logger.highlight('  1. Add components:');
        logger.info('     npx brutx-vue@latest add button');
        logger.info('     npx brutx-vue@latest add --all');
        logger.newLine();
        logger.dim(`Documentation: ${DOCS_URL}`);

        if (projectType === 'nuxt' && initialization.nuxt.configured) {
            printNuxtHints(settings.tailwind.css);
        }
    } catch (error: unknown) {
        spinner?.fail('Failed to initialize Brutx-Vue');
        const rollbackFailures = getRollbackFailures(error);
        if (rollbackFailures.length > 0) {
            logger.error(`Rollback failed for: ${rollbackFailures.join(', ')}`);
        }
        const message = error instanceof Error ? error.message : String(error);
        if (error instanceof CliError) {
            throw error;
        }
        throw new CliError(message, { code: 'WRITE_FAILED', cause: error });
    }
}
