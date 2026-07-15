import ora from 'ora';
import { checkbox } from '@inquirer/prompts';
import path from 'path';

import {
    type AddOptions,
    type BrutalistConfig,
    type RegistryItem,
    AVAILABLE_COMPONENTS,
    DEFAULT_REGISTRY_URL,
    CliError,
    detectPackageManager,
    installPackages,
    getInstallCommand,
    getItem,
    readConfig,
    isSafePath,
    logger,
    mergeSnippetsFile,
    hasVscodeDir,
    updateInstalledComponents,
    computeInstalledContentHash,
    ensureUtilsFile,
    resolveComponents,
    writeComponentFiles,
    type ComponentFileWriteFailure,
} from '../lib/index.js';

async function ensureInitialized(cwd: string): Promise<BrutalistConfig> {
    try {
        return await readConfig(cwd);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('not found')) {
            throw new CliError('Brutx-Vue is not initialized. Run: npx brutx-vue@latest init', {
                code: 'CONFIG_NOT_FOUND',
                cause: error,
            });
        } else {
            throw new CliError(`Invalid components.json. ${message}. Run: npx brutx-vue@latest init --force to regenerate.`, {
                code: 'CONFIG_INVALID',
                cause: error,
            });
        }
    }
}

async function validateComponents(components: string[], registryOverride?: string): Promise<void> {
    const MAX_COMPONENT_NAME_LENGTH = 100;

    for (const component of components) {
        if (component.length > MAX_COMPONENT_NAME_LENGTH) {
            throw new CliError(`Component name too long: "${component.slice(0, 50)}..." (max ${MAX_COMPONENT_NAME_LENGTH} characters)`);
        }
    }

    if (registryOverride) {
        return;
    }

    const cleanComponents = components.map(c => c.split('@')[0]);
    const invalid = cleanComponents.filter((c) => !AVAILABLE_COMPONENTS.includes(c));

    if (invalid.length > 0) {
        throw new CliError(`Unknown components: ${invalid.join(', ')}. Available: ${AVAILABLE_COMPONENTS.join(', ')}`);
    }
}

async function selectComponents(inputComponents: string[], options: AddOptions): Promise<string[]> {
    if (options.all) {
        return [...AVAILABLE_COMPONENTS];
    }

    if (inputComponents.length > 0) {
        return inputComponents;
    }

    if (options.yes) {
        throw new CliError('No components specified. Use: npx brutx-vue@latest add [component] or --all');
    }

    const selected = await checkbox({
        message: 'Which components would you like to add?',
        choices: AVAILABLE_COMPONENTS.map((name) => ({ name, value: name })),
        pageSize: 15,
    });

    return selected;
}

async function installComponentDeps(deps: string[], cwd: string, dryRun: boolean): Promise<void> {
    if (deps.length === 0) return;

    const packageManager = await detectPackageManager(cwd);
    logger.newLine();

    if (dryRun) {
        logger.bold(`[Dry Run] Would install dependencies using ${packageManager}:`);
        logger.info(`  ${deps.join(', ')}`);
        return;
    }

    logger.bold(`Installing dependencies with ${packageManager}...`);

    try {
        await installPackages(packageManager, deps, cwd);
        logger.success('✓ Dependencies installed');
    } catch {
        logger.warn('⚠ Failed to install dependencies automatically.');
        logger.info(`  Run manually: ${getInstallCommand(packageManager, deps)}`);
    }
}

function toPascalCase(str: string): string {
    return str
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
}

function printUsageExample(component: string, componentsAlias: string): void {
    const componentName = toPascalCase(component);
    logger.info(`  import ${componentName} from "${componentsAlias}/ui/${component}/${componentName}.vue"`);
}

function getStatusHint(item: RegistryItem): string {
    if (!item.status || item.status === 'stable') return '';
    return item.replacement ? ` [${item.status}, use ${item.replacement} for new work]` : ` [${item.status}]`;
}

function getComponentFileWriteFailure(error: unknown): ComponentFileWriteFailure | null {
    if (!error || typeof error !== 'object') {
        return null;
    }

    const failure = error as Partial<ComponentFileWriteFailure>;
    if (typeof failure.rollbackFailures === 'number' && typeof failure.rollbackCount === 'number') {
        return {
            rollbackFailures: failure.rollbackFailures,
            rollbackCount: failure.rollbackCount,
        };
    }

    return null;
}

export async function add(components: string[], options: AddOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();
    const targetCwd = options.path ? path.resolve(cwd, options.path) : cwd;

    const useCache = options.cache !== false;

    if (options.path && !(await isSafePath(targetCwd, cwd))) {
        throw new CliError(`Security Error: Path traversal detected. Access denied to path "${targetCwd}".`, {
            code: 'PATH_UNSAFE',
            exitCode: 2,
        });
    }

    logger.setSilent(options.silent ?? false);

    const config = await ensureInitialized(cwd);

    await validateComponents(components, options.registry);

    const selectedComponents = await selectComponents(components, options);

    if (selectedComponents.length === 0) {
        logger.warn('No components selected.');
        return;
    }

    const spinner = options.silent ? null : ora('Resolving components and checking dependencies...').start();

    try {
        const { items: registryItems, dependencies: allDeps } = await resolveComponents(selectedComponents, options.registry, useCache);

        if (spinner) {
            spinner.stop();
        }

        logger.bold('\n📦 Brutx-Vue CLI - Installation Plan:');
        logger.info(`   Registry source: ${options.registry || 'Default Brutx-Vue hosted registry'}`);
        logger.newLine();

        const planParts = registryItems.map(
            (item) => `${item.name} (${item.files.length} file${item.files.length !== 1 ? 's' : ''})`
        );
        logger.bold(
            `Installing ${registryItems.length} component${registryItems.length !== 1 ? 's' : ''}: ${planParts.join(', ')}`
        );
        logger.newLine();

        logger.bold('🧩 Components to install/update:');
        for (const item of registryItems) {
            const depsStr = item.registryDependencies && item.registryDependencies.length > 0
                ? ` (depends on: ${item.registryDependencies.join(', ')})`
                : '';
            const statusHint = getStatusHint(item);
            if (item.status && item.status !== 'stable') {
                logger.warn(`   - ${item.name}${depsStr}${statusHint}`);
            } else {
                logger.info(`   - ${item.name}${depsStr}`);
            }
        }
        logger.newLine();

        if (allDeps.length > 0) {
            logger.bold('📚 Required npm packages:');
            logger.info(`   ${allDeps.join(', ')}`);
            logger.newLine();
        }

        if (spinner) {
            spinner.start(`[1/${registryItems.length}] Adding ${registryItems[0].name}...`);
        }

        if (!options.dryRun) {
            const utils = await ensureUtilsFile(targetCwd, config);
            if (utils.created) {
                spinner?.info(`Created utility file at ${utils.path}`);
            }
        }

        const { added, skipped, filesWritten, filesByComponent } = await writeComponentFiles(
            registryItems,
            config,
            targetCwd,
            {
                overwrite: options.overwrite,
                dryRun: options.dryRun,
                callbacks: {
                    onProgress: result => {
                        if (spinner) {
                            spinner.text = `[${result.index + 1}/${result.total}] Adding ${result.item.name}...`;
                        }
                    },
                    onSkipFile: result => {
                        spinner?.info(`Skipping file "${result.filePath}" for "${result.item.name}" (already exists). Use --overwrite to overwrite.`);
                    },
                    onDryRunFile: result => {
                        spinner?.info(`[Dry Run] Would create file: ${result.targetPath}`);
                    },
                },
            }
        );

        const summary = skipped.length > 0
            ? `Added ${added.length} component(s), skipped ${skipped.length}`
            : `Added ${added.length} component(s)`;

        if (options.dryRun) {
            spinner?.succeed(`[Dry Run] Simulated: ${summary}`);
        } else {
            spinner?.succeed(summary);
        }

        if (added.length > 0 && filesWritten.length > 0) {
            logger.newLine();
            logger.bold('💾 Files written to disk:');
            for (const filePath of filesWritten) {
                const relativePath = path.relative(targetCwd, filePath);
                logger.success(`   ✓ ${relativePath}`);
            }
        }

        await installComponentDeps(allDeps, targetCwd, options.dryRun ?? false);

        if (!options.dryRun && added.length > 0) {
            const manifestEntries = await Promise.all(
                registryItems
                    .filter(item => added.includes(item.name))
                    .map(async item => {
                        const files = filesByComponent[item.name] ?? [];
                        const installedContentHash = files.length > 0
                            ? await computeInstalledContentHash(files)
                            : undefined;
                        return {
                            item,
                            registrySource: options.registry ?? DEFAULT_REGISTRY_URL,
                            files,
                            installedContentHash,
                        };
                    })
            );
            await updateInstalledComponents(targetCwd, manifestEntries);

            const shouldUpdateSnippets = options.vscode === true
                || (options.vscode !== false && await hasVscodeDir(targetCwd));

            if (shouldUpdateSnippets) {
                const snippetPath = await mergeSnippetsFile(targetCwd, added);
                logger.success(`✓ VS Code snippets updated at ${path.relative(targetCwd, snippetPath)}`);
            }
        }

        if (added.length > 0) {
            logger.newLine();
            logger.bold('Usage:');
            printUsageExample(added[0], config.aliases.components);
        }

    } catch (error: unknown) {
        spinner?.fail('Failed to add components');
        const writeFailure = getComponentFileWriteFailure(error);
        if (writeFailure) {
            if (writeFailure.rollbackFailures > 0) {
                logger.error(`Rollback partially failed for ${writeFailure.rollbackFailures} file(s). Run "brutx-vue doctor --fix" to repair.`);
            }
            logger.error(`Installation failed. Rolled back ${writeFailure.rollbackCount} file(s) to previous state.`);
        }
        if (error instanceof CliError) {
            throw error;
        }
        const message = error instanceof Error ? error.message : String(error);
        throw new CliError(message);
    }
}
