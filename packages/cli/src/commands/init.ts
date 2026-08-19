import ora from 'ora';
import { input, confirm } from '@inquirer/prompts';
import { DiskFileSystemAdapter } from 'brutx-shared-vue/fs';
const defaultDiskFs = new DiskFileSystemAdapter();
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
    findTailwindConfig,
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
    const tailwindConfigFile = await findTailwindConfig(cwd);

    const fallbackCss = projectType === 'nuxt'
        ? 'assets/css/main.css'
        : (projectType.includes('src') ? 'src/index.css' : 'index.css');

    return {
        tailwind: {
            config: tailwindConfigFile ?? '',
            css: cssFile ?? fallbackCss,
        },
        aliases,
        sharedBase: `${aliases.components}/brutx/shared`,
    };
}

async function promptForConfig(defaults: DetectedSettings): Promise<DetectedSettings> {
    // tailwind.config 已由 detectSettings 真实检测（查找 tailwind.config.* 文件）；
    // 未检测到（如 Tailwind v4 无独立配置文件）时直接透传，不提供交互式输入
    const tailwindConfig = defaults.tailwind.config;

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
        sharedBase: `${componentsAlias}/brutx/shared`,
    };
}

async function shouldProceed(cwd: string, options: InitOptions): Promise<boolean> {
    const configPath = path.join(cwd, 'components.json');

    if (!(await defaultDiskFs.pathExists(configPath))) {
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

    logger.setSilent(options.silent ?? false);

    logger.bold('\n🎨 Brutx-Vue - Neo-Brutalism Vue 3 Component Library\n');

    let workspaceRoot: string | null;
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

    // 与 initializeProjectFiles 一致：projectType 基于实际配置目标（configTarget）检测，
    // 避免 workspace 根目录与子包项目类型不一致时按错误的类型生成配置
    const projectType = await detectProjectType(configTarget);
    logger.info(`   Detected project: ${projectType}\n`);

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

        if (isInWorkspaceSubPackage && configTarget === cwd) {
            // 共享依赖装到 workspace root、组件依赖装到子包：针对各自安装目标分别检测包管理器，
            // 避免子包自带与根目录不同的 lockfile 时把错误的包管理器命令应用到 workspace root
            const sharedPackageManager = await detectPackageManager(sharedDepsTarget);

            logger.newLine();
            logger.bold(`Installing shared dependencies to workspace root with ${sharedPackageManager}...`);

            try {
                await installPackages(sharedPackageManager, [...SHARED_DEPENDENCIES], sharedDepsTarget);
                logger.success('✓ Shared dependencies installed to workspace root');
            } catch {
                logger.warn('⚠ Failed to install shared dependencies to workspace root.');
                logger.info(
                    `  Run manually: ${getInstallCommand(sharedPackageManager, [...SHARED_DEPENDENCIES])}`
                );
            }

            const componentPackageManager = await detectPackageManager(componentDepsTarget);

            logger.bold(`Installing component dependencies to current package with ${componentPackageManager}...`);

            try {
                await installPackages(componentPackageManager, [...COMPONENT_DEPENDENCIES], componentDepsTarget);
                logger.success('✓ Component dependencies installed to current package');
            } catch {
                logger.warn('⚠ Failed to install component dependencies.');
                logger.info(
                    `  Run manually: ${getInstallCommand(componentPackageManager, [...COMPONENT_DEPENDENCIES])}`
                );
            }
        } else {
            const packageManager = await detectPackageManager(configTarget);

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
            // snippets 写入失败不标记整个初始化失败：初始化主体（配置/组件/样式/依赖）已完成，
            // 仅告警提示手动重试，避免"初始化已成功却又报失败"的矛盾输出
            try {
                const snippetPath = await writeSnippetsFile(configTarget);
                logger.success(`✓ VS Code snippets generated at ${path.relative(configTarget, snippetPath)}`);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                logger.warn(`⚠ Failed to write VS Code snippets: ${message}`);
                logger.info('  Re-run "npx brutx-vue@latest init --force" to retry snippet generation.');
            }
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
