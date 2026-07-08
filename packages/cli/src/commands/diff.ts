import chalk from 'chalk';
import type {
    DiffResult,
    DiffOptions,
} from '../lib/types.js';
import { readConfigSafe, CliError, readManifest } from '../lib/index.js';
import { diffComponents, getInstalledComponents } from '../lib/services/diff-service.js';
import { logger } from '../lib/logger.js';
export { diffComponent, getInstalledComponents } from '../lib/services/diff-service.js';

function getIntegrityHint(result: DiffResult): string {
    return result.integrityStatus === 'outdated'
        ? chalk.yellow(' (update available)')
        : '';
}

function printDiffReport(results: DiffResult[]): void {
    logger.newLine();
    logger.bold(' Component Diff Report');
    logger.newLine();

    const modified = results.filter((r) => r.status === 'modified');
    const upToDate = results.filter((r) => r.status === 'up-to-date');
    const notInstalled = results.filter((r) => r.status === 'not-installed');
    const localOnly = results.filter((r) => r.status === 'local-only');

    if (modified.length > 0) {
        logger.log(chalk.yellow(`  🔄 MODIFIED (${modified.length})`));
        for (const result of modified) {
            const changedFiles = result.files.filter((f) => f.status !== 'unchanged').length;
            logger.log(`    — ${result.component}    (${changedFiles} file${changedFiles !== 1 ? 's' : ''} changed)${getIntegrityHint(result)}`);

            for (const file of result.files) {
                if (file.status === 'modified' && file.patch) {
                    logger.newLine();
                    const patchLines = file.patch.split('\n');
                    for (const line of patchLines) {
                        if (line.startsWith('+')) {
                            logger.log(chalk.green(`    ${line}`));
                        } else if (line.startsWith('-')) {
                            logger.log(chalk.red(`    ${line}`));
                        } else {
                            logger.dim(`    ${line}`);
                        }
                    }
                }
            }
        }
        logger.newLine();
    }

    if (upToDate.length > 0) {
        logger.log(chalk.green(`  ✅ UP-TO-DATE (${upToDate.length})`));
        for (const result of upToDate) {
            logger.log(`    — ${result.component}${getIntegrityHint(result)}`);
        }
        logger.newLine();
    }

    if (notInstalled.length > 0) {
        logger.log(chalk.gray(`  ❓ NOT IN REGISTRY (${notInstalled.length})`));
        for (const result of notInstalled) {
            logger.log(`    — ${result.component}`);
        }
        logger.newLine();
    }

    if (localOnly.length > 0) {
        logger.log(chalk.gray(`  📦 LOCAL ONLY (${localOnly.length})`));
        for (const result of localOnly) {
            logger.log(`    — ${result.component} (registry unreachable)`);
        }
        logger.newLine();
    }

    const updateAvailable = results.filter((r) => r.integrityStatus === 'outdated').length;
    const updateSummary = updateAvailable > 0 ? `, ${chalk.yellow(`${updateAvailable} update available`)}` : '';
    logger.log(`  Summary: ${chalk.yellow(`${modified.length} modified`)}, ${chalk.green(`${upToDate.length} up-to-date`)}, ${chalk.gray(`${notInstalled.length} not in registry`)}, ${chalk.gray(`${localOnly.length} local-only`)}${updateSummary}`);
    logger.newLine();
}

export async function diff(options: DiffOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    if (options.cache === false) {
        process.env.BRUTX_NO_CACHE = '1';
    }

    logger.setSilent(options.silent ?? false);

    const config = await readConfigSafe(cwd);

    if (!config) {
        throw new CliError('No components.json found. Run `brutx-vue init` first.', {
            code: 'CONFIG_NOT_FOUND',
        });
    }

    const targetComponents = options.components?.length
        ? options.components
        : await getInstalledComponents(cwd, config);
    const manifest = await readManifest(cwd).catch(() => null);

    if (targetComponents.length === 0) {
        logger.info('No components found to compare.');
        return;
    }

    const results = await diffComponents(
        cwd,
        config,
        targetComponents,
        component => options.registry ?? manifest?.components[component]?.registrySource,
        component => manifest?.components[component],
    );

    if (options.json) {
        console.log(JSON.stringify(results, null, 2));
    } else {
        printDiffReport(results);
    }
}
