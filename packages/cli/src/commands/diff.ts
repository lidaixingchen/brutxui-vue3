import chalk from 'chalk';
import type {
    BrutalistConfig,
    DiffComponentStatus,
    DiffResult,
    DiffOptions,
} from '../lib/types.js';
import { readConfigSafe, CliError, readManifest, withOfflineScope, withAuditLog } from '../lib/index.js';
import { diffComponents, getInstalledComponents } from '../lib/services/diff-service.js';
import { logger } from '../lib/logger.js';
export { diffComponent, getInstalledComponents } from '../lib/services/diff-service.js';

function getIntegrityHint(result: DiffResult): string {
    return result.integrityStatus === 'outdated'
        ? chalk.yellow(' (update available)')
        : '';
}

// 兜底分组：diffComponents 未来新增状态（或出现未预期的数据）时，
// 计入独立分组并在 Summary 中体现，避免报告数据静默缺失
const KNOWN_DIFF_STATUSES: readonly DiffComponentStatus[] = [
    'modified',
    'up-to-date',
    'not-installed',
    'local-only',
    'registry-unreachable',
];

function printDiffReport(results: DiffResult[]): void {
    logger.newLine();
    logger.bold(' Component Diff Report');
    logger.newLine();

    const modified = results.filter((r) => r.status === 'modified');
    const upToDate = results.filter((r) => r.status === 'up-to-date');
    const notInstalled = results.filter((r) => r.status === 'not-installed');
    const localOnly = results.filter((r) => r.status === 'local-only');
    const registryUnreachable = results.filter((r) => r.status === 'registry-unreachable');
    const other = results.filter((r) => !(KNOWN_DIFF_STATUSES as readonly string[]).includes(r.status));

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

    if (registryUnreachable.length > 0) {
        logger.log(chalk.red(`  ⚠️  REGISTRY UNREACHABLE (${registryUnreachable.length})`));
        for (const result of registryUnreachable) {
            const detail = result.registryError ? `: ${result.registryError}` : '';
            logger.log(`    — ${result.component}${detail}`);
        }
        logger.newLine();
    }

    if (localOnly.length > 0) {
        logger.log(chalk.gray(`  📦 LOCAL ONLY (${localOnly.length})`));
        for (const result of localOnly) {
            logger.log(`    — ${result.component}`);
        }
        logger.newLine();
    }

    if (other.length > 0) {
        logger.log(chalk.magenta(`  ⚠️  UNKNOWN STATUS (${other.length})`));
        for (const result of other) {
            logger.log(`    — ${result.component} (status: ${String(result.status)})`);
        }
        logger.newLine();
    }

    const updateAvailable = results.filter((r) => r.integrityStatus === 'outdated').length;
    const updateSummary = updateAvailable > 0 ? `, ${chalk.yellow(`${updateAvailable} update available`)}` : '';
    const otherSummary = other.length > 0 ? `, ${chalk.magenta(`${other.length} unknown status`)}` : '';
    logger.log(`  Summary: ${chalk.yellow(`${modified.length} modified`)}, ${chalk.green(`${upToDate.length} up-to-date`)}, ${chalk.gray(`${notInstalled.length} not in registry`)}, ${chalk.gray(`${localOnly.length} local-only`)}, ${chalk.red(`${registryUnreachable.length} registry unreachable`)}${otherSummary}${updateSummary}`);
    logger.newLine();
}

export async function diff(options: DiffOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();
    const useCache = options.cache !== false;

    logger.setSilent(options.silent ?? false);

    const restoreOffline = withOfflineScope(options.offline === true);
    try {
        const config = await readConfigSafe(cwd);

        if (!config) {
            throw new CliError('No components.json found. Run `brutx-vue init` first.', {
                code: 'CONFIG_NOT_FOUND',
            });
        }

        // 先解析实际比较的组件列表（未显式指定时取全部已安装组件），
        // 保证审计记录与实际执行范围一致
        const targetComponents = options.components?.length
            ? options.components
            : await getInstalledComponents(cwd, config);

        await withAuditLog(
            cwd,
            {
                command: 'diff',
                components: targetComponents,
                cwd,
                dryRun: false, // diff 是只读操作，无 dry-run 语义
            },
            () => diffInner(options, cwd, useCache, config, targetComponents),
        );
    } finally {
        restoreOffline();
    }
}

async function diffInner(
    options: DiffOptions,
    cwd: string,
    useCache: boolean,
    config: BrutalistConfig,
    targetComponents: string[],
): Promise<void> {
    // 清单读取失败仅对"文件不存在"降级为 null（readManifest 内部已用 pathExists 提前返回 null，
    // 此处 ENOENT 只出现在读取瞬间文件被删的竞态下）；JSON 损坏/权限错误等其余错误
    // 包装为带上下文的 CliError，避免 diff 在缺少完整性/registrySource 信息时静默降级
    const manifest = await readManifest(cwd).catch((error: unknown) => {
        if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
            return null;
        }
        throw new CliError(
            `Failed to read manifest: ${error instanceof Error ? error.message : String(error)}`,
            { code: 'MANIFEST_READ_FAILED', cause: error },
        );
    });

    if (targetComponents.length === 0) {
        logger.info('No components found to compare.');
        return;
    }

    const results = await diffComponents(
        cwd,
        config,
        targetComponents,
        component => options.registry ?? manifest?.components?.[component]?.registrySource,
        component => manifest?.components?.[component],
        useCache,
    );

    if (options.json) {
        console.log(JSON.stringify(results, null, 2));
    } else {
        printDiffReport(results);
    }
}
