import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import type { BrutalistConfig, RemoveOptions, RegistryItem } from '../lib/types.js';
import { getItem } from '../lib/registry.js';
import { readConfigSafe, CliError, FileTransaction } from '../lib/index.js';
import { resolveAliasPath } from '../lib/project.js';
import { logger } from '../lib/logger.js';

const SCRIPT_EXTENSIONS = ['.ts', '.js', '.mts', '.mjs'] as const;

async function getInstalledComponentDirs(cwd: string, config: BrutalistConfig): Promise<string[]> {
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);

    if (!await fs.pathExists(componentsPath)) {
        return [];
    }

    const dirs = await fs.readdir(componentsPath, { withFileTypes: true });
    return dirs
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .sort();
}

async function scanAllImports(componentsPath: string): Promise<Map<string, Set<string>>> {
    const importMap = new Map<string, Set<string>>();

    async function scanDir(dir: string, componentName: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await scanDir(fullPath, componentName);
                continue;
            }

            const ext = path.extname(entry.name);
            if (ext !== '.vue' && ext !== '.ts' && ext !== '.js') continue;

            const content = await fs.readFile(fullPath, 'utf-8');
            const importRegex = /from\s+['"]([^'"]+)['"]/g;
            let match: RegExpExecArray | null;

            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];
                if (!importMap.has(importPath)) {
                    importMap.set(importPath, new Set());
                }
                importMap.get(importPath)!.add(componentName);
            }
        }
    }

    const dirs = await fs.readdir(componentsPath, { withFileTypes: true });
    for (const dir of dirs) {
        if (!dir.isDirectory()) continue;
        await scanDir(path.join(componentsPath, dir.name), dir.name);
    }

    return importMap;
}

async function resolveScriptFile(baseDir: string, fileName: string): Promise<string | null> {
    for (const ext of SCRIPT_EXTENSIONS) {
        const candidate = path.join(baseDir, fileName + ext);
        if (await fs.pathExists(candidate)) {
            return candidate;
        }
    }
    const noExtCandidate = path.join(baseDir, fileName);
    if (await fs.pathExists(noExtCandidate)) {
        return noExtCandidate;
    }
    return null;
}

async function findOrphanedFiles(
    cwd: string,
    config: BrutalistConfig,
    remainingComponents: string[],
    removedComponents: string[]
): Promise<string[]> {
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const importMap = await scanAllImports(componentsPath);

    const composablesPath = await resolveAliasPath(config.aliases.composables, cwd);
    const utilsAlias = config.aliases.utils;
    const utilsDir = path.dirname(utilsAlias);
    const utilsPath = await resolveAliasPath(utilsDir, cwd);
    const localesPath = path.join(path.dirname(composablesPath), 'locales');
    const directivesPath = path.join(path.dirname(composablesPath), 'directives');

    const orphaned: string[] = [];

    for (const [importPath, importers] of importMap) {
        const wasOnlyUsedByRemoved = [...importers].every(c => removedComponents.includes(c));
        if (!wasOnlyUsedByRemoved) continue;

        const isComposable = importPath.includes('/composables/');
        const isLocale = importPath.includes('/locales/');
        const isDirective = importPath.includes('/directives/');
        const isUtils = importPath.includes('/lib/') && !importPath.endsWith('/utils');

        if (!isComposable && !isLocale && !isDirective && !isUtils) continue;

        let resolvedPath: string | null = null;
        const fileName = importPath.split('/').pop() ?? '';

        if (isComposable && await fs.pathExists(composablesPath)) {
            resolvedPath = await resolveScriptFile(composablesPath, fileName);
        }

        if (!resolvedPath && isLocale && await fs.pathExists(localesPath)) {
            resolvedPath = await resolveScriptFile(localesPath, fileName);
        }

        if (!resolvedPath && isDirective && await fs.pathExists(directivesPath)) {
            resolvedPath = await resolveScriptFile(directivesPath, fileName);
        }

        if (!resolvedPath && isUtils && await fs.pathExists(utilsPath)) {
            resolvedPath = await resolveScriptFile(utilsPath, fileName);
        }

        if (resolvedPath) {
            orphaned.push(resolvedPath);
        }
    }

    return [...new Set(orphaned)];
}

async function getDependents(
    cwd: string,
    config: BrutalistConfig,
    componentsToRemove: string[]
): Promise<Map<string, string[]>> {
    const dependents = new Map<string, string[]>();
    const installed = await getInstalledComponentDirs(cwd, config);
    const remaining = installed.filter(c => !componentsToRemove.includes(c));

    for (const name of componentsToRemove) {
        for (const other of remaining) {
            try {
                const otherItem: RegistryItem = await getItem(other);
                if (otherItem.registryDependencies?.includes(name)) {
                    if (!dependents.has(name)) {
                        dependents.set(name, []);
                    }
                    dependents.get(name)!.push(other);
                }
            } catch {
                // skip if registry item not found
            }
        }
    }

    return dependents;
}

export async function remove(components: string[], options: RemoveOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    logger.setSilent(options.silent ?? false);

    if (components.length === 0) {
        throw new CliError('Please specify at least one component to remove.');
    }

    const config = await readConfigSafe(cwd);

    if (!config) {
        throw new CliError('No components.json found. Run `brutx-vue init` first.');
    }

    const installed = await getInstalledComponentDirs(cwd, config);
    const toRemove = components.filter(c => installed.includes(c));
    const notFound = components.filter(c => !installed.includes(c));

    if (notFound.length > 0) {
        logger.warn(`Component(s) not installed: ${notFound.join(', ')}`);
    }

    if (toRemove.length === 0) {
        logger.info('No components to remove.');
        return;
    }

    const dependents = await getDependents(cwd, config, toRemove);

    if (dependents.size > 0) {
        logger.newLine();
        for (const [comp, deps] of dependents) {
            logger.warn(`Warning: ${deps.join(', ')} depends on ${comp}`);
        }
        logger.newLine();
    }

    const remaining = installed.filter(c => !toRemove.includes(c));
    const orphanedFiles = await findOrphanedFiles(cwd, config, remaining, toRemove);

    if (options.dryRun) {
        logger.newLine();
        logger.bold('[Dry Run] Would remove:');
        logger.newLine();

        for (const comp of toRemove) {
            const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
            const componentPath = path.join(componentsPath, comp);
            if (await fs.pathExists(componentPath)) {
                const entries = await fs.readdir(componentPath, { withFileTypes: true });
                const fileCount = entries.filter(e => e.isFile()).length;
                logger.log(`  ${chalk.red('●')} ${comp} (${fileCount} file${fileCount !== 1 ? 's' : ''})`);
            }
        }

        if (orphanedFiles.length > 0) {
            logger.newLine();
            logger.log(`  ${chalk.yellow('Orphaned files:')}`);
            for (const f of orphanedFiles) {
                logger.log(`    ${chalk.dim(f)}`);
            }
        }

        logger.newLine();
        return;
    }

    if (!options.yes) {
        const confirmed = await confirm({
            message: `Remove ${toRemove.length} component(s): ${toRemove.join(', ')}?`,
            default: false,
        });

        if (!confirmed) {
            logger.info('Removal cancelled.');
            return;
        }
    }

    const transaction = new FileTransaction();
    let totalRemoved = 0;
    let orphanedRemoved = 0;

    try {
        for (const comp of toRemove) {
            const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
            const componentPath = path.join(componentsPath, comp);

            if (await fs.pathExists(componentPath)) {
                const files = await fs.readdir(componentPath);
                logger.info(`Removing ${comp} (${files.length} files)...`);
                await transaction.remove(componentPath);
                totalRemoved += files.length;
            }
        }

        if (orphanedFiles.length > 0) {
            if (!options.yes) {
                const removeOrphaned = await confirm({
                    message: `Remove ${orphanedFiles.length} orphaned file(s) no longer referenced by any component?`,
                    default: true,
                });

                if (!removeOrphaned) {
                    await transaction.commit();
                    logger.info('Keeping orphaned files.');
                    logger.newLine();
                    logger.success(`Removed ${totalRemoved} file(s) and 0 orphaned file(s).`);
                    return;
                }
            }

            for (const f of orphanedFiles) {
                if (await fs.pathExists(f)) {
                    await transaction.remove(f);
                    orphanedRemoved++;
                }
            }
        }

        await transaction.commit();
    } catch (error) {
        const rollbackFailures = await transaction.rollback();
        if (rollbackFailures.length > 0) {
            logger.error(`Rollback failed for: ${rollbackFailures.join(', ')}`);
        }
        throw new CliError('Failed to remove components. Rolled back file changes.', {
            code: 'WRITE_FAILED',
            cause: error,
        });
    }

    logger.newLine();
    logger.success(`Removed ${totalRemoved} file(s) and ${orphanedRemoved} orphaned file(s).`);
}
