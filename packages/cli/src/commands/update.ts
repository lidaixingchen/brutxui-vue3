import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import type { UpdateOptions, DiffResult } from '../lib/types.js';
import { readConfigSafe, CliError, logger, readManifest, withOfflineScope } from '../lib/index.js';
import { getInstalledComponents, diffComponent } from '../lib/services/diff-service.js';
import { add } from './add.js';

export async function update(components: string[], options: UpdateOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();
    const useCache = options.cache !== false;

    logger.setSilent(options.silent ?? false);

    const restoreOffline = withOfflineScope(options.offline === true);
    try {
        await updateInner(components, options, cwd, useCache);
    } finally {
        restoreOffline();
    }
}

async function updateInner(components: string[], options: UpdateOptions, cwd: string, useCache: boolean): Promise<void> {
    const config = await readConfigSafe(cwd);

    if (!config) {
        throw new CliError('No components.json found. Run `brutx-vue init` first.', {
            code: 'CONFIG_NOT_FOUND',
        });
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

    // 版本约束（P0-3 延续）：version-pinned 组件默认锁定，需 --across-versions 才跨版本更新。
    // 语义：name@version 是 git ref（非 semver），用户显式锁定即不应被 update 擅自改变。
    // version='latest' 或无 version 字段的组件视为未锁定，正常更新。
    const acrossVersions = options.acrossVersions === true;
    const versionPinnedNames: string[] = [];
    if (!acrossVersions && manifest) {
        for (const name of installedComponents) {
            const entry = manifest.components[name];
            if (entry?.version && entry.version !== 'latest') {
                versionPinnedNames.push(name);
            }
        }
    }

    if (versionPinnedNames.length > 0) {
        logger.newLine();
        logger.warn(`The following ${versionPinnedNames.length} component(s) are version-pinned and will be skipped:`);
        for (const name of versionPinnedNames) {
            const pinnedVersion = manifest!.components[name].version;
            logger.log(`  ${chalk.yellow('●')} ${name} ${chalk.dim(`(locked to ${pinnedVersion})`)}`);
        }
        logger.info(`To update across versions, re-run with ${chalk.cyan('--across-versions')}.`);
        logger.newLine();
    }

    const updatableComponents = installedComponents.filter(name => !versionPinnedNames.includes(name));

    if (updatableComponents.length === 0) {
        logger.info('No updatable components found (all are version-pinned or none installed).');
        return;
    }

    const results = await Promise.all(
        updatableComponents.map(name => diffComponent(
            cwd,
            config,
            name,
            options.registry ?? manifest?.components[name]?.registrySource,
            manifest?.components[name],
            useCache,
        ))
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

    const selectedByRegistry = new Map<string | undefined, string[]>();
    for (const component of selected) {
        const registrySource = options.registry ?? manifest?.components[component]?.registrySource;
        selectedByRegistry.set(registrySource, [
            ...(selectedByRegistry.get(registrySource) ?? []),
            component,
        ]);
    }

    for (const [registrySource, groupedComponents] of selectedByRegistry) {
        await add(groupedComponents, {
            overwrite: true,
            yes: true,
            cwd,
            silent: options.silent,
            dryRun: options.dryRun,
            registry: registrySource,
            offline: options.offline,
        });
    }

    logger.newLine();
    logger.success(`Updated ${selected.length} component(s): ${selected.join(', ')}`);
}
