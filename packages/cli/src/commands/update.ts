import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import type { UpdateOptions, DiffResult } from '../lib/types.js';
import { readConfigSafe, CliError, logger, readManifest } from '../lib/index.js';
import { getInstalledComponents, diffComponent } from './diff.js';
import { add } from './add.js';

export async function update(components: string[], options: UpdateOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    if ((options as Record<string, unknown>).cache === false) {
        process.env.BRUTX_NO_CACHE = '1';
    }

    logger.setSilent(options.silent ?? false);

    const config = await readConfigSafe(cwd);

    if (!config) {
        throw new CliError('No components.json found. Run `brutx-vue init` first.');
    }

    const installedComponents = components.length > 0
        ? components
        : await getInstalledComponents(cwd, config);

    if (installedComponents.length === 0) {
        logger.info('No installed components found to update.');
        return;
    }

    logger.info('Checking for updates...');
    const manifest = await readManifest(cwd).catch(() => null);

    const results = await Promise.all(
        installedComponents.map(name => diffComponent(cwd, config, name, options.registry, manifest?.components[name]))
    );

    const outdated = results.filter((r): r is DiffResult => r.status === 'modified' || r.integrityStatus === 'outdated');

    if (outdated.length === 0) {
        logger.success('All components are up-to-date.');
        return;
    }

    logger.newLine();
    logger.bold(`${outdated.length} component(s) have updates available:`);
    logger.newLine();

    for (const result of outdated) {
        const changedFiles = result.files.filter(f => f.status !== 'unchanged');
        const statuses = changedFiles.map(f => f.status).filter((s, i, arr) => arr.indexOf(s) === i);
        const statusLabel = statuses.length > 0 ? statuses.join(', ') : 'registry';
        logger.info(`  ${chalk.yellow('●')} ${result.component}  ${chalk.dim(`(${statusLabel})`)}`);
    }

    logger.newLine();

    if (options.dryRun) {
        logger.info(`[Dry Run] Would update ${outdated.length} component(s): ${outdated.map(r => r.component).join(', ')}`);
        return;
    }

    let selected: string[];

    if (options.all || options.yes) {
        selected = outdated.map(r => r.component);
    } else {
        selected = await checkbox({
            message: 'Select components to update:',
            choices: outdated.map(r => ({
                name: r.component,
                value: r.component,
                checked: true,
            })),
            pageSize: 15,
        });
    }

    if (selected.length === 0) {
        logger.warn('No components selected for update.');
        return;
    }

    const filesToOverwrite: Array<{ component: string; modifiedFiles: number }> = [];
    for (const result of outdated) {
        if (!selected.includes(result.component)) continue;
        const modifiedFiles = result.files.filter(f => f.status === 'modified').length;
        if (modifiedFiles > 0) {
            filesToOverwrite.push({ component: result.component, modifiedFiles });
        }
    }

    if (filesToOverwrite.length > 0) {
        logger.newLine();
        logger.warn('The following components have local modifications that will be overwritten:');
        for (const item of filesToOverwrite) {
            logger.log(`  ${chalk.yellow('●')} ${item.component} (${item.modifiedFiles} file${item.modifiedFiles !== 1 ? 's' : ''} modified)`);
        }

        if (!options.yes) {
            const proceed = await confirm({
                message: `Overwrite local modifications in ${filesToOverwrite.length} component(s)?`,
                default: false,
            });

            if (!proceed) {
                logger.info('Update cancelled.');
                return;
            }
        }
    }

    await add(selected, {
        overwrite: true,
        yes: true,
        cwd,
        silent: options.silent,
        dryRun: options.dryRun,
        registry: options.registry,
    });

    logger.newLine();
    logger.success(`Updated ${selected.length} component(s): ${selected.join(', ')}`);
}
