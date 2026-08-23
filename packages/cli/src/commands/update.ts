import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import type { UpdateOptions, DiffResult, RegistryItem } from '../lib/types.js';
import {
    readConfigSafe,
    CliError,
    logger,
    readManifest,
    withOfflineScope,
    mergeDryRun,
    withAuditLog,
    ProjectContext,
    getItem,
    computeInstalledContentHash,
    updateInstalledComponents,
    DEFAULT_REGISTRY_URL,
} from '../lib/index.js';
import { MergeExecutor } from '../lib/merge/index.js';
import { getInstalledComponents, diffComponent } from '../lib/services/diff-service.js';
import { add } from './add.js';

export async function update(components: string[], options: UpdateOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();
    const useCache = options.cache !== false;

    logger.setSilent(options.silent ?? false);

    // P1-8: 合并全局 dry-run
    const effectiveDryRun = mergeDryRun(options.dryRun);

    const restoreOffline = withOfflineScope(options.offline === true);
    try {
        await withAuditLog(
            cwd,
            {
                command: 'update',
                components: components ?? [],
                cwd,
                dryRun: effectiveDryRun,
            },
            () => updateInner(components, { ...options, dryRun: effectiveDryRun }, cwd, useCache),
        );
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

    const context = await ProjectContext.loadUninitialized(cwd, { configOverride: config });

    const installedComponents = components.length > 0
        ? components
        : await getInstalledComponents(context);

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
        logger.info('No updatable components found (all are version-pinned).');
        return;
    }

    // 错误隔离：单个组件的更新检查失败（registry 不可达、缓存损坏等）不中止其余组件，
    // 失败明细告警后继续；全部失败时才抛汇总 CliError
    const settled = await Promise.allSettled(
        updatableComponents.map(name => diffComponent(
            context,
            name,
            options.registry ?? manifest?.components[name]?.registrySource,
            manifest?.components[name],
            useCache,
        ))
    );

    const results: DiffResult[] = [];
    const checkFailures: Array<{ name: string; message: string }> = [];
    for (let i = 0; i < settled.length; i++) {
        const entry = settled[i];
        const name = updatableComponents[i];
        if (entry.status === 'rejected') {
            const message = entry.reason instanceof Error ? entry.reason.message : String(entry.reason);
            checkFailures.push({ name, message });
            logger.warn(`⚠ Update check failed for "${name}": ${message}`);
        } else if (entry.value.status === 'registry-unreachable') {
            // diffComponent 内部已 catch registry 错误并以 registry-unreachable 返回（不会 reject）：
            // 必须同样计入失败集合，否则全部 registry 不可达时会被误报为"全部最新"
            const message = entry.value.registryError ?? 'registry unreachable';
            checkFailures.push({ name, message });
            logger.warn(`⚠ Update check failed for "${name}": ${message}`);
        } else {
            results.push(entry.value);
        }
    }

    if (results.length === 0 && checkFailures.length > 0) {
        throw new CliError(
            `Update check failed for all ${checkFailures.length} component(s). First error: ${checkFailures[0].message}`,
            { code: 'REGISTRY_FETCH_FAILED' }
        );
    }

    const outdated = results.filter((r): r is DiffResult => r.status === 'modified' || r.integrityStatus === 'outdated');

    if (outdated.length === 0) {
        // 部分组件检查失败时不能输出"全部最新"：如实区分成功与失败
        if (checkFailures.length > 0) {
            logger.warn(
                `All reachable components are up-to-date, but update check failed for ${checkFailures.length} component(s): ${checkFailures.map(f => f.name).join(', ')}.`
            );
            return;
        }
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

    if (options.force) {
        // --force 显式指定时，回退到暴力全量覆盖
        const filesToOverwrite: Array<{ component: string; modifiedFiles: number }> = [];
        for (const result of outdated) {
            if (!selected.includes(result.component)) continue;
            const modifiedFiles = result.files.filter(f => f.status === 'modified').length;
            const integrityDrift = result.integrityStatus === 'outdated' ? 1 : 0;
            if (modifiedFiles + integrityDrift > 0) {
                filesToOverwrite.push({ component: result.component, modifiedFiles: modifiedFiles + integrityDrift });
            }
        }

        if (filesToOverwrite.length > 0 && !options.yes) {
            const proceed = await confirm({
                message: `Force overwrite local modifications in ${filesToOverwrite.length} component(s)?`,
                default: false,
            });

            if (!proceed) {
                logger.info('Update cancelled.');
                return;
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

        const failedGroups: Array<{ components: string[]; message: string }> = [];
        for (const [registrySource, groupedComponents] of selectedByRegistry) {
            try {
                await add(groupedComponents, {
                    overwrite: true,
                    yes: true,
                    cwd,
                    silent: options.silent,
                    dryRun: options.dryRun,
                    registry: registrySource,
                    offline: options.offline,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                failedGroups.push({ components: groupedComponents, message });
                logger.warn(`⚠ Update failed for: ${groupedComponents.join(', ')} — ${message}`);
            }
        }

        const failedComponents = new Set(failedGroups.flatMap(g => g.components));
        const succeededComponents = selected.filter(c => !failedComponents.has(c));

        if (succeededComponents.length > 0) {
            logger.newLine();
            logger.success(`Updated ${succeededComponents.length} component(s): ${succeededComponents.join(', ')}`);
        }

        if (failedGroups.length > 0) {
            throw new CliError(
                `Update failed for ${failedComponents.size} component(s): ${Array.from(failedComponents).join(', ')}. First error: ${failedGroups[0].message}`,
                { code: 'WRITE_FAILED' }
            );
        }
        return;
    }

    // 默认启用 3-Way Merge 智能合并引擎与三合一原子事务
    const conflictStrategy = options.ours ? 'ours' : options.theirs ? 'theirs' : 'markers';
    const mergeExecutor = new MergeExecutor({ fs: context.fs });
    const transaction = context.createTransaction();

    logger.newLine();
    logger.info('Applying 3-Way Merge for selected components...');
    logger.newLine();

    const succeededComponents: string[] = [];
    const conflictedComponents: Array<{ name: string; conflictFiles: string[] }> = [];
    const manifestEntries: Array<{
        item: RegistryItem;
        registrySource: string;
        files: string[];
        installedContentHash?: string;
        version?: string;
    }> = [];
    let totalMergedFiles = 0;
    let totalAddedFiles = 0;
    let totalDeletedFiles = 0;

    try {
        for (const componentName of selected) {
            const registrySource = options.registry ?? manifest?.components[componentName]?.registrySource;
            const remoteItem = await getItem(componentName, registrySource, useCache, context.fs);

            const { plan, filesWritten } = await mergeExecutor.planAndExecute(
                context,
                componentName,
                remoteItem,
                {
                    conflictStrategy,
                    dryRun: options.dryRun,
                    isCi: options.ci,
                    transaction,
                    registrySource,
                    useCache,
                }
            );

            totalMergedFiles += plan.mergedFiles;
            totalAddedFiles += plan.addedFiles;
            totalDeletedFiles += plan.deletedFiles;

            if (plan.hasConflicts && conflictStrategy === 'markers') {
                const conflicts = plan.files
                    .filter(f => f.status === 'conflict' || f.status === 'restore-prompt')
                    .map(f => f.filePath);
                conflictedComponents.push({ name: componentName, conflictFiles: conflicts });
                logger.warn(`  ${chalk.yellow('⚠')} ${chalk.bold(componentName)}: ${conflicts.length} conflict(s) marked with <<<<<<< LOCAL ... >>>>>>> REMOTE`);
                for (const cf of conflicts) {
                    logger.log(`    ${chalk.dim('→')} ${cf}`);
                }
            } else {
                logger.success(`  ${chalk.green('✔')} ${chalk.bold(componentName)}: merged cleanly (${plan.mergedFiles} merged, ${plan.addedFiles} added, ${plan.deletedFiles} deleted)`);
            }

            // 记录待更新的 manifest 条目
            if (!options.dryRun) {
                const contentHash = await computeInstalledContentHash(filesWritten, context.fs);
                manifestEntries.push({
                    item: remoteItem,
                    registrySource: registrySource ?? DEFAULT_REGISTRY_URL,
                    files: filesWritten,
                    installedContentHash: contentHash,
                    version: remoteItem.$schema ?? 'latest',
                });
            }

            succeededComponents.push(componentName);
        }

        if (!options.dryRun && manifestEntries.length > 0) {
            await updateInstalledComponents(cwd, manifestEntries, { transaction }, context.fs);
            await transaction.commit();
        }
    } catch (error) {
        await transaction.rollback();
        const message = error instanceof Error ? error.message : String(error);
        if (error instanceof CliError) {
            throw error;
        }
        throw new CliError(`Update transaction failed and was rolled back cleanly: ${message}`, {
            code: 'MERGE_TRANSACTION_FAILED',
            cause: error,
        });
    }

    logger.newLine();
    logger.success(
        `3-Way Merge completed for ${succeededComponents.length} component(s) (${totalMergedFiles} files merged, ${totalAddedFiles} added, ${totalDeletedFiles} deleted).`
    );

    if (conflictedComponents.length > 0) {
        logger.newLine();
        logger.warn(
            `Notice: ${conflictedComponents.length} component(s) have unresolved conflict markers. Please inspect and resolve them in your editor.`
        );
    }
}
