import ora, { type Ora } from 'ora';
import { input, confirm } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';

import {
    type InitOptions,
    type BrutalistConfig,
    type TailwindConfig,
    type AliasConfig,
    SHARED_DEPENDENCIES,
    COMPONENT_DEPENDENCIES,
    BASE_DEPENDENCIES,
    getBrutalistCssStyles,
    SCHEMA_URL,
    DOCS_URL,
    DEFAULT_TAILWIND_CONFIG,
    UTILS_TEMPLATE,
    CONFIG_FILES,
    CliError,
    detectProjectType,
    detectPackageManager,
    detectWorkspaceRoot,
    findTailwindConfig,
    findCssFile,
    getDefaultAliases,
    resolveAliasPath,
    detectTailwindVersion,
    installPackages,
    getInstallCommand,
    isSafePath,
    logger,
    writeSnippetsFile,
    hasVscodeDir,
} from '../lib/index.js';

const CURRENT_CONFIG_VERSION = 1;

interface DetectedSettings {
    tailwind: TailwindConfig;
    aliases: AliasConfig;
}

async function detectSettings(cwd: string): Promise<DetectedSettings> {
    const projectType = await detectProjectType(cwd);
    const tailwindVersion = await detectTailwindVersion(cwd);

    const tailwindConfig = await findTailwindConfig(cwd);
    const cssFile = await findCssFile(cwd, projectType);
    const aliases = await getDefaultAliases(cwd);

    const fallbackCss = projectType === 'nuxt'
        ? 'assets/css/main.css'
        : (projectType.includes('src') ? 'src/index.css' : 'index.css');

    return {
        tailwind: {
            config: tailwindVersion === 'v4' ? '' : (tailwindConfig ?? DEFAULT_TAILWIND_CONFIG),
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

async function createConfigFile(cwd: string, settings: DetectedSettings): Promise<void> {
    const config: BrutalistConfig = {
        $schema: SCHEMA_URL,
        $version: CURRENT_CONFIG_VERSION,
        style: 'brutalism',
        tailwind: settings.tailwind,
        aliases: settings.aliases,
    };

    const configPath = path.join(cwd, 'components.json');
    await fs.writeJson(configPath, config, { spaces: 2 });
}

async function addBrutalistStyles(cwd: string, cssPath: string): Promise<boolean> {
    const fullPath = path.join(cwd, cssPath);

    if (!(await isSafePath(fullPath, cwd))) {
        throw new Error(`Security Error: CSS path traversal detected. Access denied to path "${fullPath}".`);
    }

    await fs.ensureDir(path.dirname(fullPath));

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
    } else {
        if (tailwindVersion === 'v4') {
            content = `@import "tailwindcss";\n${await getBrutalistCssStyles()}`;
        } else {
            content = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n${await getBrutalistCssStyles()}`;
        }
    }

    await fs.writeFile(fullPath, content);
    return true;
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

async function findNuxtConfig(cwd: string): Promise<string | null> {
    for (const file of CONFIG_FILES.nuxt) {
        const fullPath = path.join(cwd, file);
        if (await fs.pathExists(fullPath)) {
            return fullPath;
        }
    }
    return null;
}

function injectNuxtConfig(content: string, cssPath: string, componentsRelDir: string): string | null {
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

function printManualNuxtInstructions(cssPath: string, componentsRelDir: string): void {
    logger.newLine();
    logger.bold('Please manually add the following to your nuxt.config.ts inside defineNuxtConfig():');
    logger.info(`    components: ['~/${componentsRelDir}'],`);
    logger.info(`    css: ['${cssPath}'],`);
}

async function configureNuxtConfig(
    cwd: string,
    cssPath: string,
    componentsDir: string,
    spinner: Ora | null,
): Promise<boolean> {
    const configPath = await findNuxtConfig(cwd);
    if (!configPath) {
        spinner?.warn('No nuxt.config file found. Skipping Nuxt configuration.');
        return false;
    }

    const componentsRelDir = path.relative(cwd, componentsDir).replace(/\\/g, '/');
    const original = await fs.readFile(configPath, 'utf-8');
    const result = injectNuxtConfig(original, cssPath, componentsRelDir);

    if (result === null) {
        spinner?.warn('Could not auto-inject Nuxt configuration.');
        printManualNuxtInstructions(cssPath, componentsRelDir);
        return false;
    }

    if (result === original) {
        spinner?.info('Nuxt config already contains components and css configuration, skipped.');
        return true;
    }

    try {
        await fs.writeFile(configPath, result);
        spinner?.info('Updated ' + path.basename(configPath) + ' with components and css configuration');
        return true;
    } catch {
        await fs.writeFile(configPath, original).catch(() => {});
        spinner?.warn('Failed to update nuxt config. Restored original file.');
        printManualNuxtInstructions(cssPath, componentsRelDir);
        return false;
    }
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
        await createConfigFile(configTarget, settings);

        const utilsPath = await resolveAliasPath(settings.aliases.utils, configTarget) + '.ts';
        await fs.ensureDir(path.dirname(utilsPath));
        if (!(await fs.pathExists(utilsPath))) {
            await fs.writeFile(utilsPath, UTILS_TEMPLATE);
            spinner?.info('Created utility helper at ' + settings.aliases.utils);
        } else {
            spinner?.info('Utility helper already exists, skipping.');
        }

        const componentsDir = await resolveAliasPath(settings.aliases.components, configTarget);
        await fs.ensureDir(path.join(componentsDir, 'ui'));
        spinner?.info('Created components/ui directory');

        const stylesAdded = await addBrutalistStyles(configTarget, settings.tailwind.css);
        if (stylesAdded) {
            spinner?.info('Added brutalist styles to ' + settings.tailwind.css);
        } else {
            spinner?.info('Brutalist design tokens already present in ' + settings.tailwind.css + ', skipped duplicate injection.');
        }

        let nuxtConfigured = false;
        if (projectType === 'nuxt') {
            nuxtConfigured = await configureNuxtConfig(
                configTarget,
                settings.tailwind.css,
                componentsDir,
                spinner,
            );
        }

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
            const config: BrutalistConfig = {
                $schema: SCHEMA_URL,
                $version: CURRENT_CONFIG_VERSION,
                style: 'brutalism',
                tailwind: settings.tailwind,
                aliases: settings.aliases,
            };
            const snippetPath = await writeSnippetsFile(configTarget, config);
            logger.success(`✓ VS Code snippets generated at ${path.relative(configTarget, snippetPath)}`);
        }

        logger.newLine();
        logger.bold('Next steps:');
        logger.highlight('  1. Add components:');
        logger.info('     npx brutx-vue@latest add button');
        logger.info('     npx brutx-vue@latest add --all');
        logger.newLine();
        logger.dim(`Documentation: ${DOCS_URL}`);

        if (projectType === 'nuxt' && nuxtConfigured) {
            printNuxtHints(settings.tailwind.css);
        }
    } catch (error: unknown) {
        spinner?.fail('Failed to initialize Brutx-Vue');
        const message = error instanceof Error ? error.message : String(error);
        throw new CliError(message);
    }
}
