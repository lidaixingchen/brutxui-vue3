import type { Ora } from 'ora';
import ora from 'ora';
import { checkbox } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';

import {
    type AddOptions,
    type BrutalistConfig,
    type RegistryItem,
    AVAILABLE_COMPONENTS,
    UTILS_TEMPLATE,
    REGISTRY_PATH_PREFIXES,
    CliError,
    detectPackageManager,
    resolveAliasPath,
    resolveImportAlias,
    installPackages,
    getInstallCommand,
    getItem,
    resolveDeps,
    readConfig,
    isSafePath,
    logger,
    mergeSnippetsFile,
    hasVscodeDir,
} from '../lib/index.js';

async function ensureInitialized(cwd: string): Promise<BrutalistConfig> {
    try {
        return await readConfig(cwd);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('not found')) {
            throw new CliError('Brutx-Vue is not initialized. Run: npx brutx-vue@latest init');
        } else {
            throw new CliError(`Invalid components.json. ${message}. Run: npx brutx-vue@latest init --force to regenerate.`);
        }
    }
}

async function validateComponents(components: string[]): Promise<void> {
    const MAX_COMPONENT_NAME_LENGTH = 100;

    for (const component of components) {
        if (component.length > MAX_COMPONENT_NAME_LENGTH) {
            throw new CliError(`Component name too long: "${component.slice(0, 50)}..." (max ${MAX_COMPONENT_NAME_LENGTH} characters)`);
        }
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

async function resolveComponentFilePath(registryPath: string, config: BrutalistConfig, cwd: string): Promise<string> {
    let resolved: string;

    if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.components)) {
        const relative = registryPath.replace(REGISTRY_PATH_PREFIXES.components, '');
        const aliasPath = await resolveAliasPath(config.aliases.components, cwd);
        resolved = path.join(aliasPath, relative);
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.composables)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.composables.length);
        const aliasPath = await resolveAliasPath(config.aliases.composables, cwd);
        resolved = path.join(aliasPath, relative);
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.locales)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.locales.length);
        const composablesPath = await resolveAliasPath(config.aliases.composables, cwd);
        resolved = path.join(path.dirname(composablesPath), 'locales', relative);
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.libUtils)) {
        resolved = await resolveAliasPath(config.aliases.utils, cwd) + '.ts';
    } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.lib)) {
        const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.lib.length);
        const aliasPath = await resolveAliasPath(config.aliases.utils, cwd);
        resolved = path.join(path.dirname(aliasPath), relative);
    } else {
        resolved = path.join(cwd, registryPath);
    }

    if (!(await isSafePath(resolved, cwd))) {
        throw new CliError(`Security Error: Resolved path "${resolved}" is outside the project directory.`, 2);
    }

    return resolved;
}

async function ensureUtilsFile(utilsPath: string): Promise<boolean> {
    if (await fs.pathExists(utilsPath)) {
        return false;
    }

    await fs.ensureDir(path.dirname(utilsPath));
    await fs.writeFile(utilsPath, UTILS_TEMPLATE);
    return true;
}

async function writeRegistryFiles(
    items: RegistryItem[],
    config: BrutalistConfig,
    cwd: string,
    options: AddOptions,
    spinner: Ora | null
): Promise<{ added: string[]; skipped: string[]; filesWritten: string[]; rollbackCount: number }> {
    const added: string[] = [];
    const skippedSet = new Set<string>();
    const filesWritten: string[] = [];
    const snapshot = new Map<string, string | null>();

    try {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (spinner) {
                spinner.text = `[${i + 1}/${items.length}] Adding ${item.name}...`;
            }

            let itemAdded = false;

            for (const file of item.files) {
                const targetPath = await resolveComponentFilePath(file.path, config, cwd);

                if (await fs.pathExists(targetPath)) {
                    if (!options.overwrite) {
                        spinner?.info(`Skipping file "${file.path}" for "${item.name}" (already exists). Use --overwrite to overwrite.`);
                        skippedSet.add(item.name);
                        continue;
                    }
                }

                if (options.dryRun) {
                    spinner?.info(`[Dry Run] Would create file: ${targetPath}`);
                    itemAdded = true;
                    filesWritten.push(targetPath);
                    continue;
                }

                if (!snapshot.has(targetPath)) {
                    if (await fs.pathExists(targetPath)) {
                        snapshot.set(targetPath, await fs.readFile(targetPath, 'utf-8'));
                    } else {
                        snapshot.set(targetPath, null);
                    }
                }

                await fs.ensureDir(path.dirname(targetPath));
                const resolvedContent = resolveImportAlias(file.content, config);
                await fs.writeFile(targetPath, resolvedContent, 'utf-8');
                itemAdded = true;
                filesWritten.push(targetPath);
            }

            if (itemAdded) {
                added.push(item.name);
            }
        }
    } catch (writeError) {
        let rollbackFailures = 0;

        for (const [filePath, originalContent] of snapshot) {
            try {
                if (originalContent !== null) {
                    await fs.writeFile(filePath, originalContent, 'utf-8');
                } else if (await fs.pathExists(filePath)) {
                    await fs.promises.rm(filePath, { force: true });
                }
            } catch {
                rollbackFailures++;
            }
        }

        if (rollbackFailures > 0) {
            logger.error(`Rollback partially failed for ${rollbackFailures} file(s). Run "brutx-vue doctor --fix" to repair.`);
        }

        logger.error(`Installation failed. Rolled back ${snapshot.size} file(s) to previous state.`);
        throw writeError;
    }

    return { added, skipped: Array.from(skippedSet), filesWritten, rollbackCount: 0 };
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

export async function add(components: string[], options: AddOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();
    const targetCwd = options.path ? path.resolve(cwd, options.path) : cwd;

    if ((options as Record<string, unknown>).cache === false) {
        process.env.BRUTX_NO_CACHE = '1';
    }

    if (options.path && !(await isSafePath(targetCwd, cwd))) {
        throw new CliError(`Security Error: Path traversal detected. Access denied to path "${targetCwd}".`, 2);
    }

    logger.setSilent(options.silent ?? false);

    const config = await ensureInitialized(cwd);

    await validateComponents(components);

    const selectedComponents = await selectComponents(components, options);

    if (selectedComponents.length === 0) {
        logger.warn('No components selected.');
        return;
    }

    const utilsPath = await resolveAliasPath(config.aliases.utils, targetCwd) + '.ts';

    const spinner = options.silent ? null : ora('Resolving components and checking dependencies...').start();

    try {
        const registryItems = await resolveDeps(selectedComponents, options.registry);

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
            logger.info(`   - ${item.name}${depsStr}`);
        }
        logger.newLine();

        const allDeps = new Set<string>();
        for (const item of registryItems) {
            if (item.dependencies) {
                item.dependencies.forEach((dep) => allDeps.add(dep));
            }
        }

        if (allDeps.size > 0) {
            logger.bold('📚 Required npm packages:');
            logger.info(`   ${Array.from(allDeps).join(', ')}`);
            logger.newLine();
        }

        if (spinner) {
            spinner.start(`[1/${registryItems.length}] Adding ${registryItems[0].name}...`);
        }

        if (!options.dryRun) {
            const utilsCreated = await ensureUtilsFile(utilsPath);
            if (utilsCreated) {
                spinner?.info(`Created utility file at ${utilsPath}`);
            }
        }

        const { added, skipped, filesWritten } = await writeRegistryFiles(
            registryItems,
            config,
            targetCwd,
            options,
            spinner
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

        await installComponentDeps(Array.from(allDeps), targetCwd, options.dryRun ?? false);

        if (!options.dryRun && added.length > 0) {
            const shouldUpdateSnippets = options.vscode === true
                || (options.vscode !== false && await hasVscodeDir(cwd));

            if (shouldUpdateSnippets) {
                const snippetPath = await mergeSnippetsFile(cwd, added);
                logger.success(`✓ VS Code snippets updated at ${path.relative(cwd, snippetPath)}`);
            }
        }

        if (added.length > 0) {
            logger.newLine();
            logger.bold('Usage:');
            printUsageExample(added[0], config.aliases.components);
        }

    } catch (error: unknown) {
        spinner?.fail('Failed to add components');
        const message = error instanceof Error ? error.message : String(error);
        throw new CliError(message);
    }
}
