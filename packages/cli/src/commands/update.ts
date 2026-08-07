import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import type { UpdateOptions, DiffResult } from '../lib/types.js';
import { readConfigSafe, CliError, logger, readManifest, withOfflineScope, mergeDryRun, withAuditLog } from '../lib/index.js';
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
        logger.info('No updatable components found (all are version-pinned).');
        return;
    }

    // 错误隔离：单个组件的更新检查失败（registry 不可达、缓存损坏等）不中止其余组件，
    // 失败明细告警后继续；全部失败时才抛汇总 CliError
    const settled = await Promise.allSettled(
        updatableComponents.map(name => diffComponent(
            cwd,
            config,
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

    const filesToOverwrite: Array<{ component: string; modifiedFiles: number }> = [];
    for (const result of outdated) {
        if (!selected.includes(result.component)) continue;
        const modifiedFiles = result.files.filter(f => f.status === 'modified').length;
        // 完整性漂移（本地文件相对安装记录被改动/篡改）同样会被覆盖更新，
        // 计入待确认的 overwrite 项，避免静默覆盖本地改动。
        const integrityDrift = result.integrityStatus === 'outdated' ? 1 : 0;
        if (modifiedFiles + integrityDrift > 0) {
            filesToOverwrite.push({ component: result.component, modifiedFiles: modifiedFiles + integrityDrift });
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

    // 错误隔离：某个分组的 add 失败不阻止其余分组更新；失败明细收集后统一汇总
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
            // 组内 add 失败时部分组件可能已写入并注册（如 snippets 合并失败不触发回滚），
            // 如实提示，避免用户误以为整组组件均未更新
            logger.warn(`⚠ Update failed for: ${groupedComponents.join(', ')} — ${message} (some components in this group may have been updated).`);
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
            `Update failed for ${failedComponents.size} component(s): ${Array.from(failedComponents).join(', ')}. First error: ${failedGroups[0].message} Run "brutx-vue list --check-updates" to verify the actual state.`,
            { code: 'WRITE_FAILED' }
        );
    }
}
