import chalk from 'chalk';
import type { BrutalistConfig, ListOptions, InstalledComponentInfo } from '../lib/types.js';
import { readConfigSafe, CliError, getInstalledComponentInfos, withOfflineScope, resolveRegistrySources } from '../lib/index.js';
import { getItemFromSources } from '../lib/registry.js';
import { logger } from '../lib/logger.js';

async function attachUpdateInfo(
    infos: InstalledComponentInfo[],
    config: BrutalistConfig,
    registryOverride: string | undefined,
    useCache: boolean
): Promise<InstalledComponentInfo[]> {
    const sources = resolveRegistrySources(config, registryOverride);

    return Promise.all(infos.map(async (info) => {
        // 显式请求 --check-updates 但缺少本地 integrity（旧版本/手工编辑的 manifest）：
        // 如实写入 updateCheckError，表格显示 'unknown'，避免用户误以为根本没执行检查
        if (!info.integrity) {
            return {
                ...info,
                updateCheckError: 'missing installed integrity, cannot compare',
            };
        }

        try {
            const { item: latest } = await getItemFromSources(info.name, sources, useCache);
            // 远端项缺失 integrity 时不能比较：显式判空，避免恒为"可更新"的误判
            if (!latest.integrity) {
                return {
                    ...info,
                    updateCheckError: 'registry item missing integrity',
                };
            }
            return {
                ...info,
                latestIntegrity: latest.integrity,
                updateAvailable: latest.integrity !== info.integrity,
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
        // 数据源自运行时解析的 manifest，旧版本/手工编辑可能缺字段：低成本防御
        const deps = info.dependencies ?? [];
        const depsStr = deps.length > 0
            ? deps.join(', ')
            : chalk.dim('none');
        const source = formatSource(info.registrySource);
        // 先对纯文本 padEnd 再上色：chalk 生成的 ANSI 转义码会被 padEnd 计入宽度，
        // 直接对彩色字符串 padEnd 会让带颜色的单元格可视宽度变小、后续列错位
        const sourceStr = info.registrySource ? source.padEnd(sourceWidth) : chalk.dim(source.padEnd(sourceWidth));
        const category = formatCategory(info);
        const categoryStr = info.category ? category.padEnd(categoryWidth) : chalk.dim(category.padEnd(categoryWidth));
        const status = formatStatus(info);
        const statusStr = info.status && info.status !== 'stable' ? chalk.yellow(status.padEnd(statusWidth)) : status.padEnd(statusWidth);
        const version = info.version ?? '-';
        const versionStr = info.version && info.version !== 'latest' ? chalk.cyan(version.padEnd(versionWidth)) : chalk.dim(version.padEnd(versionWidth));
        const update = formatUpdate(info);
        const updateStr = info.updateAvailable ? chalk.yellow(update.padEnd(updateWidth)) : update.padEnd(updateWidth);
        const updateColumn = showUpdates ? updateStr : '';
        logger.log(`  ${info.name.padEnd(nameWidth)}${String(info.files.length).padEnd(filesWidth)}${categoryStr}${statusStr}${versionStr}${sourceStr}${updateColumn}${depsStr}`);
    }

    logger.newLine();
    logger.info(`  ${infos.length} component(s) installed`);
    logger.newLine();
}

export async function list(options: ListOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();

    logger.setSilent(options.silent ?? false);

    const restoreOffline = withOfflineScope(options.offline === true);
    try {
        await listInner(options, cwd);
    } finally {
        restoreOffline();
    }
}

async function listInner(options: ListOptions, cwd: string): Promise<void> {
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
        infos = await attachUpdateInfo(infos, config, options.registry, options.cache !== false);
    }

    if (options.json) {
        // #107：fileCount 已从类型层移除（恒等于 files.length），JSON 输出仍保留该键
        // 以便下游消费者继续读取——输出契约保持不变，仅改为读取时派生
        const output = infos.map((info) => ({
            ...info,
            fileCount: info.files.length,
        }));
        console.log(JSON.stringify(output, null, 2));
        return;
    }

    printTable(infos, options.checkUpdates === true);
}
