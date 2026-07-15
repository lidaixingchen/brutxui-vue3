import chalk from 'chalk';
import type { ListOptions, InstalledComponentInfo } from '../lib/types.js';
import { readConfigSafe, CliError, getInstalledComponentInfos } from '../lib/index.js';
import { getItem } from '../lib/registry.js';
import { logger } from '../lib/logger.js';

async function attachUpdateInfo(
    infos: InstalledComponentInfo[],
    registryOverride: string | undefined,
    useCache: boolean
): Promise<InstalledComponentInfo[]> {
    return Promise.all(infos.map(async (info) => {
        if (!info.installedIntegrity) {
            return info;
        }

        const source = registryOverride ?? info.registrySource;
        if (!source) {
            return info;
        }

        try {
            const latest = await getItem(info.name, source, useCache);
            return {
                ...info,
                latestIntegrity: latest.integrity,
                updateAvailable: latest.integrity !== info.installedIntegrity,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                ...info,
                updateCheckError: message,
            };
        }
    }));
}

function formatSource(source: string | undefined): string {
    if (!source) {
        return 'local';
    }

    try {
        return new URL(source).host;
    } catch {
        return source;
    }
}

function formatStatus(info: InstalledComponentInfo): string {
    if (!info.status || info.status === 'stable') {
        return 'stable';
    }
    return info.replacement ? `${info.status} -> ${info.replacement}` : info.status;
}

function formatCategory(info: InstalledComponentInfo): string {
    return info.category ?? 'local';
}

function formatUpdate(info: InstalledComponentInfo): string {
    if (info.updateCheckError) return 'unknown';
    if (info.updateAvailable === true) return 'available';
    if (info.updateAvailable === false) return 'current';
    return 'not checked';
}

function printTable(infos: InstalledComponentInfo[], showUpdates: boolean): void {
    logger.newLine();
    logger.bold('Installed Components');
    logger.newLine();

    const nameWidth = Math.max(10, ...infos.map(i => i.name.length)) + 2;
    const filesWidth = 8;
    const categoryWidth = Math.max(10, ...infos.map(i => formatCategory(i).length)) + 2;
    const statusWidth = Math.max(10, ...infos.map(i => formatStatus(i).length)) + 2;
    const sourceWidth = Math.max(10, ...infos.map(i => formatSource(i.registrySource).length)) + 2;
    const versionWidth = Math.max(7, ...infos.map(i => (i.version ?? '-').length)) + 2;
    const updateWidth = showUpdates ? Math.max(10, ...infos.map(i => formatUpdate(i).length)) + 2 : 0;
    const updateHeader = showUpdates ? 'Update'.padEnd(updateWidth) : '';
    const updateSeparator = showUpdates ? '─'.repeat(updateWidth) : '';
    const header = `  ${'Name'.padEnd(nameWidth)}${'Files'.padEnd(filesWidth)}${'Category'.padEnd(categoryWidth)}${'Status'.padEnd(statusWidth)}${'Version'.padEnd(versionWidth)}${'Source'.padEnd(sourceWidth)}${updateHeader}Dependencies`;
    const separator = `  ${'─'.repeat(nameWidth)}${'─'.repeat(filesWidth)}${'─'.repeat(categoryWidth)}${'─'.repeat(statusWidth)}${'─'.repeat(versionWidth)}${'─'.repeat(sourceWidth)}${updateSeparator}${'─'.repeat(20)}`;

    logger.log(header);
    logger.log(separator);

    for (const info of infos) {
        const depsStr = info.dependencies.length > 0
            ? info.dependencies.join(', ')
            : chalk.dim('none');
        const source = formatSource(info.registrySource);
        const sourceStr = info.registrySource ? source : chalk.dim(source);
        const category = formatCategory(info);
        const categoryStr = info.category ? category : chalk.dim(category);
        const status = formatStatus(info);
        const statusStr = info.status && info.status !== 'stable' ? chalk.yellow(status) : status;
        const version = info.version ?? '-';
        const versionStr = info.version && info.version !== 'latest' ? chalk.cyan(version) : chalk.dim(version);
        const update = formatUpdate(info);
        const updateStr = info.updateAvailable ? chalk.yellow(update) : update;
        const updateColumn = showUpdates ? updateStr.padEnd(updateWidth) : '';
        logger.log(`  ${info.name.padEnd(nameWidth)}${String(info.fileCount).padEnd(filesWidth)}${categoryStr.padEnd(categoryWidth)}${statusStr.padEnd(statusWidth)}${versionStr.padEnd(versionWidth)}${sourceStr.padEnd(sourceWidth)}${updateColumn}${depsStr}`);
    }

    logger.newLine();
    logger.info(`  ${infos.length} component(s) installed`);
    logger.newLine();
}

export async function list(options: ListOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    logger.setSilent(options.silent ?? false);

    const config = await readConfigSafe(cwd);

    if (!config) {
        throw new CliError('No components.json found. Run `brutx-vue init` first.', {
            code: 'CONFIG_NOT_FOUND',
        });
    }

    let infos = await getInstalledComponentInfos(cwd, config);

    if (infos.length === 0) {
        logger.info('No installed components found.');
        return;
    }

    if (options.checkUpdates) {
        infos = await attachUpdateInfo(infos, options.registry, options.cache !== false);
    }

    if (options.json) {
        console.log(JSON.stringify(infos, null, 2));
        return;
    }

    printTable(infos, options.checkUpdates === true);
}
