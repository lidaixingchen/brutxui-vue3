import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import type { RemoveOptions } from '../lib/types.js';
import { readConfigSafe, CliError, readManifest } from '../lib/index.js';
import {
    countComponentFiles,
    prepareRemoveComponents,
    removeComponents,
} from '../lib/services/remove-service.js';
import { logger } from '../lib/logger.js';

function getRollbackFailures(error: unknown): string[] {
    if (
        typeof error === 'object' &&
        error !== null &&
        'rollbackFailures' in error &&
        Array.isArray((error as { rollbackFailures?: unknown }).rollbackFailures)
    ) {
        return (error as { rollbackFailures: string[] }).rollbackFailures;
    }

    return [];
}

export async function remove(components: string[], options: RemoveOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    logger.setSilent(options.silent ?? false);

    if (components.length === 0) {
        throw new CliError('Please specify at least one component to remove.');
    }

    const config = await readConfigSafe(cwd);

    if (!config) {
        throw new CliError('No components.json found. Run `brutx-vue init` first.', {
            code: 'CONFIG_NOT_FOUND',
        });
    }

    const manifest = await readManifest(cwd).catch(() => null);
    const useCache = options.cache !== false;
    const removal = await prepareRemoveComponents(cwd, config, components, manifest, useCache);

    if (removal.notFound.length > 0) {
        logger.warn(`Component(s) not installed: ${removal.notFound.join(', ')}`);
    }

    if (removal.toRemove.length === 0) {
        logger.info('No components to remove.');
        return;
    }

    if (removal.dependents.size > 0) {
        logger.newLine();
        for (const [comp, deps] of removal.dependents) {
            logger.warn(`Warning: ${deps.join(', ')} depends on ${comp}`);
        }
        logger.newLine();
    }

    if (removal.dependencyCheckFailures.length > 0) {
        logger.newLine();
        logger.warn(`Warning: dependency check failed for ${removal.dependencyCheckFailures.length} component(s) — registry may be unreachable. Hidden dependencies could exist for the components being removed: ${removal.dependencyCheckFailures.join(', ')}`);
        logger.newLine();
    }

    if (options.dryRun) {
        logger.newLine();
        logger.bold('[Dry Run] Would remove:');
        logger.newLine();

        for (const comp of removal.toRemove) {
            const fileCount = await countComponentFiles(cwd, config, comp);
            if (fileCount !== null) {
                logger.log(`  ${chalk.red('●')} ${comp} (${fileCount} file${fileCount !== 1 ? 's' : ''})`);
            }
        }

        if (removal.orphanedFiles.length > 0) {
            logger.newLine();
            logger.log(`  ${chalk.yellow('Orphaned files:')}`);
            for (const f of removal.orphanedFiles) {
                logger.log(`    ${chalk.dim(f)}`);
            }
        }

        logger.newLine();
        return;
    }

    if (!options.yes) {
        const confirmed = await confirm({
            message: `Remove ${removal.toRemove.length} component(s): ${removal.toRemove.join(', ')}?`,
            default: false,
        });

        if (!confirmed) {
            logger.info('Removal cancelled.');
            return;
        }
    }

    let removeOrphaned = true;
    if (removal.orphanedFiles.length > 0 && !options.yes) {
        removeOrphaned = await confirm({
            message: `Remove ${removal.orphanedFiles.length} orphaned file(s) no longer referenced by any component?`,
            default: true,
        });
    }

    let totalRemoved = 0;
    let orphanedRemoved = 0;

    try {
        const result = await removeComponents(
            cwd,
            config,
            removal.toRemove,
            removal.orphanedFiles,
            {
                removeOrphaned,
                onRemoveComponent: (componentName, fileCount) => {
                    logger.info(`Removing ${componentName} (${fileCount} files)...`);
                },
            }
        );
        totalRemoved = result.totalRemoved;
        orphanedRemoved = result.orphanedRemoved;
    } catch (error) {
        const rollbackFailures = getRollbackFailures(error);
        if (rollbackFailures.length > 0) {
            logger.error(`Rollback failed for: ${rollbackFailures.join(', ')}`);
        }
        throw new CliError('Failed to remove components. Rolled back file changes.', {
            code: 'WRITE_FAILED',
            cause: error,
        });
    }

    if (!removeOrphaned) {
        logger.info('Keeping orphaned files.');
    }

    logger.newLine();
    logger.success(`Removed ${totalRemoved} file(s) and ${orphanedRemoved} orphaned file(s).`);
}
