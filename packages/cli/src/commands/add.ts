/**
 * Add Command
 * Add components to user's project
 */

import type { Ora } from 'ora';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';

import {
    // Types
    type AddOptions,
    type BrutalistConfig,
    type RegistryItem,
    // Constants
    AVAILABLE_COMPONENTS,
    UTILS_TEMPLATE,
    // Functions
    detectPackageManager,
    resolveAliasPath,
    resolveImportAlias,
    installPackages,
    getInstallCommand,
    getItem,
    resolveDeps,
    isSafePath,
    logger,
} from '../lib/index.js';

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if project is initialized
 */
async function ensureInitialized(cwd: string): Promise<BrutalistConfig> {
    const configPath = path.join(cwd, 'components.json');

    if (!(await fs.pathExists(configPath))) {
        logger.error('Error: Brutx is not initialized.');
        logger.warn('Run: npx brutx@latest init');
        process.exit(1);
    }

    return fs.readJson(configPath);
}

/**
 * Validate component names against the list of available components
 */
async function validateComponents(components: string[]): Promise<void> {
    const invalid = components.filter((c) => !AVAILABLE_COMPONENTS.includes(c));

    if (invalid.length > 0) {
        logger.error(`Unknown components: ${invalid.join(', ')}`);
        logger.warn(`Available: ${AVAILABLE_COMPONENTS.join(', ')}`);
        process.exit(1);
    }
}

// ============================================================================
// Component Selection
// ============================================================================

/**
 * Get components to add (from args, --all flag, or interactive picker)
 */
async function selectComponents(inputComponents: string[], options: AddOptions): Promise<string[]> {
    // --all flag
    if (options.all) {
        return [...AVAILABLE_COMPONENTS];
    }

    // Components provided as arguments
    if (inputComponents.length > 0) {
        return inputComponents;
    }

    // Non-interactive mode without components
    if (options.yes) {
        logger.error('Error: No components specified.');
        logger.warn('Use: npx brutx@latest add [component] or --all');
        process.exit(1);
    }

    // Interactive picker
    const { selected } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selected',
            message: 'Which components would you like to add?',
            choices: AVAILABLE_COMPONENTS.map((name) => ({ name, value: name })),
            pageSize: 15,
        },
    ]);

    return selected;
}

// ============================================================================
// File Path Resolution
// ============================================================================

function resolveComponentFilePath(registryPath: string, config: BrutalistConfig, cwd: string): string {
    // registryPath: components/ui/button.tsx
    if (registryPath.startsWith('components/')) {
        const relative = registryPath.replace('components/', '');
        const aliasPath = resolveAliasPath(config.aliases.components, cwd);
        return path.join(aliasPath, relative);
    }
    
    if (registryPath.startsWith('lib/utils')) {
        return resolveAliasPath(config.aliases.utils, cwd) + '.ts';
    }
    
    if (registryPath.startsWith('lib/')) {
        const relative = registryPath.replace('lib/', '');
        const aliasPath = resolveAliasPath(config.aliases.utils, cwd);
        return path.join(path.dirname(aliasPath), relative);
    }
    
    return path.join(cwd, registryPath);
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Ensure utils.ts exists
 */
async function ensureUtilsFile(utilsPath: string): Promise<boolean> {
    if (await fs.pathExists(utilsPath)) {
        return false;
    }

    await fs.ensureDir(path.dirname(utilsPath));
    await fs.writeFile(utilsPath, UTILS_TEMPLATE);
    return true;
}

/**
 * Write component files resolved from registry
 */
async function writeRegistryFiles(
    items: RegistryItem[],
    config: BrutalistConfig,
    cwd: string,
    options: AddOptions,
    spinner: Ora | null
): Promise<{ added: string[]; skipped: string[] }> {
    const added: string[] = [];
    const skipped: string[] = [];

    for (const item of items) {
        let itemAdded = false;
        
        for (const file of item.files) {
            const targetPath = resolveComponentFilePath(file.path, config, cwd);
            
            // Security check: path traversal prevention
            if (!isSafePath(targetPath, cwd)) {
                throw new Error(`Security Error: Path traversal detected. Access denied to path "${targetPath}".`);
            }
            
            // Overwrite check
            if (await fs.pathExists(targetPath)) {
                if (!options.overwrite) {
                    spinner?.info(`Skipping file "${file.path}" for "${item.name}" (already exists). Use --overwrite to overwrite.`);
                    skipped.push(item.name);
                    continue;
                }
            }

            if (options.dryRun) {
                spinner?.info(`[Dry Run] Would create file: ${targetPath}`);
                itemAdded = true;
                continue;
            }

            // Real write
            await fs.ensureDir(path.dirname(targetPath));
            const resolvedContent = resolveImportAlias(file.content, config);
            await fs.writeFile(targetPath, resolvedContent, 'utf-8');
            itemAdded = true;
        }

        if (itemAdded && !skipped.includes(item.name)) {
            added.push(item.name);
        }
    }

    return { added, skipped };
}

// ============================================================================
// Dependencies
// ============================================================================

/**
 * Install component dependencies
 */
function installComponentDeps(deps: string[], cwd: string, dryRun: boolean): void {
    if (deps.length === 0) return;

    const packageManager = detectPackageManager(cwd);
    logger.newLine();
    
    if (dryRun) {
        logger.bold(`[Dry Run] Would install dependencies using ${packageManager}:`);
        logger.info(`  ${deps.join(', ')}`);
        return;
    }

    logger.bold(`Installing dependencies with ${packageManager}...`);

    try {
        installPackages(packageManager, deps, cwd);
        logger.success('✓ Dependencies installed');
    } catch {
        logger.warn('⚠ Failed to install dependencies automatically.');
        logger.info(`  Run manually: ${getInstallCommand(packageManager, deps)}`);
    }
}

// ============================================================================
// Output Helpers
// ============================================================================

function toPascalCase(str: string): string {
    return str
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
}

function printUsageExample(component: string, componentsAlias: string): void {
    const componentName = toPascalCase(component);
    logger.info(`  import { ${componentName} } from "${componentsAlias}/ui/${component}";`);
}

// ============================================================================
// Main Command
// ============================================================================

export async function add(components: string[], options: AddOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    // Setup logger
    logger.setSilent(options.silent ?? false);

    // Ensure initialized
    const config = await ensureInitialized(cwd);

    // Get components to add
    const selectedComponents = await selectComponents(components, options);

    if (selectedComponents.length === 0) {
        logger.warn('No components selected.');
        return;
    }

    // Validate
    await validateComponents(selectedComponents);

    // Resolve paths
    const utilsPath = resolveAliasPath(config.aliases.utils, cwd) + '.ts';

    // Start adding
    const spinner = options.silent ? null : ora('Resolving and loading components from registry...').start();

    try {
        // Resolve components and their dependencies from registry
        const registryItems = await resolveDeps(selectedComponents, options.registry);
        if (spinner) {
            spinner.text = `Adding ${registryItems.length} components (including dependencies)...`;
        }

        // Ensure utils exists
        if (!options.dryRun) {
            const utilsCreated = await ensureUtilsFile(utilsPath);
            if (utilsCreated) {
                spinner?.info(`Created utility file at ${utilsPath}`);
            }
        }

        // Write files
        const { added, skipped } = await writeRegistryFiles(
            registryItems,
            config,
            cwd,
            options,
            spinner
        );

        // Summary
        const summary = skipped.length > 0
            ? `Added ${added.length} component(s), skipped ${skipped.length}`
            : `Added ${added.length} component(s)`;

        if (options.dryRun) {
            spinner?.succeed(`[Dry Run] Simulated: ${summary}`);
        } else {
            spinner?.succeed(summary);
        }

        // Collect all npm dependencies from the resolved registry items
        const allDeps = new Set<string>();
        for (const item of registryItems) {
            if (item.dependencies) {
                item.dependencies.forEach((dep) => allDeps.add(dep));
            }
        }

        // Install dependencies
        installComponentDeps(Array.from(allDeps), cwd, options.dryRun ?? false);

        // Print usage
        if (added.length > 0) {
            logger.newLine();
            logger.bold('Usage:');
            printUsageExample(added[0], config.aliases.components);
        }

    } catch (error: any) {
        spinner?.fail('Failed to add components');
        logger.error(error?.message || error);
        process.exit(1);
    }
}
