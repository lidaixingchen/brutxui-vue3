import ora from 'ora';
import { checkbox } from '@inquirer/prompts';
import path from 'path';

import {
    type AddOptions,
    type BrutalistConfig,
    type RegistryItem,
    AVAILABLE_COMPONENTS,
    DEFAULT_REGISTRY_URL,
    resolveRegistrySources,
    CliError,
    detectPackageManager,
    installPackages,
    getInstallCommand,
    readConfig,
    readManifest,
    isSafePath,
    logger,
    mergeSnippetsFile,
    hasVscodeDir,
    updateInstalledComponents,
    computeInstalledContentHash,
    ensureUtilsFile,
    resolveComponents,
    writeComponentFiles,
    listLocalRegistryComponents,
    withOfflineScope,
    type ComponentFileWriteFailure,
    mergeDryRun,
    withAuditLog,
} from '../lib/index.js';

async function ensureInitialized(cwd: string): Promise<BrutalistConfig> {
    try {
        return await readConfig(cwd);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('not found')) {
            throw new CliError('Brutx-Vue is not initialized. Run: npx brutx-vue@latest init', {
                code: 'CONFIG_NOT_FOUND',
                cause: error,
            });
        } else {
            throw new CliError(`Invalid components.json. ${message}. Run: npx brutx-vue@latest init --force to regenerate.`, {
                code: 'CONFIG_INVALID',
                cause: error,
            });
        }
    }
}

async function validateComponents(components: string[], registryOverride?: string): Promise<void> {
    const MAX_COMPONENT_NAME_LENGTH = 100;

    for (const component of components) {
        if (component.length > MAX_COMPONENT_NAME_LENGTH) {
            throw new CliError(`Component name too long: "${component.slice(0, 50)}..." (max ${MAX_COMPONENT_NAME_LENGTH} characters)`);
        }
    }

    if (registryOverride) {
        return;
    }

    const cleanComponents = components.map(c => c.split('@')[0]);
    const invalid = cleanComponents.filter((c) => !AVAILABLE_COMPONENTS.includes(c));

    if (invalid.length > 0) {
        throw new CliError(`Unknown components: ${invalid.join(', ')}. Available: ${AVAILABLE_COMPONENTS.join(', ')}`);
    }
}

async function selectComponents(inputComponents: string[], options: AddOptions): Promise<string[]> {
    if (options.all) {
        // AVAILABLE_COMPONENTS 仅对默认注册表有效；自定义 registry 可能不含这些组件
        if (options.registry) {
            // 本地目录 registry 支持枚举组件（--all 合法）；远程 HTTP registry 协议
            // 不支持列表，强制显式指定组件名
            const componentsFromRegistry = await listLocalRegistryComponents(options.registry);
            if (componentsFromRegistry !== null) {
                return componentsFromRegistry;
            }
            throw new CliError('--all is not supported with a remote --registry (component listing unavailable). Specify component names explicitly.');
        }
        return [...AVAILABLE_COMPONENTS];
    }

    if (inputComponents.length > 0) {
        return inputComponents;
    }

    if (options.yes) {
        throw new CliError('No components specified. Use: npx brutx-vue@latest add [component] or --all');
    }

    const selected = await checkbox({
        message: 'Which components would you like to add?',
        choices: AVAILABLE_COMPONENTS.map((name) => ({ name, value: name })),
        pageSize: 15,
    });

    return selected;
}

async function installComponentDeps(deps: string[], cwd: string, dryRun: boolean): Promise<boolean> {
    if (deps.length === 0) return true;

    const packageManager = await detectPackageManager(cwd);
    logger.newLine();

    if (dryRun) {
        logger.bold(`[Dry Run] Would install dependencies using ${packageManager}:`);
        logger.info(`  ${deps.join(', ')}`);
        return true;
    }

    logger.bold(`Installing dependencies with ${packageManager}...`);

    try {
        await installPackages(packageManager, deps, cwd);
        logger.success('✓ Dependencies installed');
        return true;
    } catch {
        logger.warn('⚠ Failed to install dependencies automatically.');
        logger.info(`  Run manually: ${getInstallCommand(packageManager, deps)}`);
        return false;
    }
}

function toPascalCase(str: string): string {
    return str
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
}

function printUsageExample(component: string, componentsAlias: string): void {
    const componentName = toPascalCase(component);
    logger.info(`  import ${componentName} from "${componentsAlias}/ui/${component}/${componentName}.vue"`);
}

function getStatusHint(item: RegistryItem): string {
    if (!item.status || item.status === 'stable') return '';
    return item.replacement ? ` [${item.status}, use ${item.replacement} for new work]` : ` [${item.status}]`;
}

function getComponentFileWriteFailure(error: unknown): ComponentFileWriteFailure | null {
    if (!error || typeof error !== 'object') {
        return null;
    }

    const failure = error as Partial<ComponentFileWriteFailure>;
    if (typeof failure.rollbackFailures === 'number' && typeof failure.rollbackCount === 'number') {
        return {
            rollbackFailures: failure.rollbackFailures,
            rollbackCount: failure.rollbackCount,
        };
    }

    return null;
}

export async function add(components: string[], options: AddOptions): Promise<void> {
    const cwd = options.cwd ?? process.cwd();
    const targetCwd = options.path ? path.resolve(cwd, options.path) : cwd;

    const useCache = options.cache !== false;

    if (options.path && !(await isSafePath(targetCwd, cwd))) {
        throw new CliError(`Security Error: Path traversal detected. Access denied to path "${targetCwd}".`, {
            code: 'PATH_UNSAFE',
            exitCode: 2,
        });
    }

    logger.setSilent(options.silent ?? false);

    // P1-8: 合并全局 dry-run（BRUTX_DRY_RUN=1 或 --dry-run 全局 flag）
    const effectiveDryRun = mergeDryRun(options.dryRun);

    const restoreOffline = withOfflineScope(options.offline === true);
    try {
        await withAuditLog(
            targetCwd,
            {
                command: 'add',
                components,
                cwd: targetCwd,
                dryRun: effectiveDryRun,
                registrySource: options.registry ?? DEFAULT_REGISTRY_URL,
            },
            () => addInner(components, { ...options, dryRun: effectiveDryRun }, cwd, targetCwd, useCache),
        );
    } finally {
        restoreOffline();
    }
}

async function addInner(
    components: string[],
    options: AddOptions,
    cwd: string,
    targetCwd: string,
    useCache: boolean,
): Promise<void> {
    const config = await ensureInitialized(cwd);

    await validateComponents(components, options.registry);

    const selectedComponents = await selectComponents(components, options);

    if (selectedComponents.length === 0) {
        logger.warn('No components selected.');
        return;
    }

    // 多源解析（基础设施闭环 P0）：--registry 覆盖整个源列表，否则用 config.registries，
    // 未配置时回退到官方默认多源（GitHub Raw + jsDelivr CDN）。
    const sources = resolveRegistrySources(config, options.registry);

    const spinner = options.silent ? null : ora('Resolving components and checking dependencies...').start();

    try {
        const { items: registryItems, dependencies: allDeps, registrySources: hitRegistrySources } =
            await resolveComponents(selectedComponents, options.registry, useCache, sources);

        if (spinner) {
            spinner.stop();
        }

        if (registryItems.length === 0) {
            spinner?.warn('No components resolved from registry.');
            return;
        }

        logger.bold('\n📦 Brutx-Vue CLI - Installation Plan:');
        logger.info(`   Registry source: ${options.registry || 'Default Brutx-Vue hosted registry'}`);
        logger.newLine();

        const planParts = registryItems.map(
            (item) => `${item.name} (${item.files.length} file${item.files.length !== 1 ? 's' : ''})`
        );
        logger.bold(
            `Installing ${registryItems.length} component${registryItems.length !== 1 ? 's' : ''}: ${planParts.join(', ')}`
        );
        logger.newLine();

        logger.bold('🧩 Components to install/update:');
        for (const item of registryItems) {
            const depsStr = item.registryDependencies && item.registryDependencies.length > 0
                ? ` (depends on: ${item.registryDependencies.join(', ')})`
                : '';
            const statusHint = getStatusHint(item);
            if (item.status && item.status !== 'stable') {
                logger.warn(`   - ${item.name}${depsStr}${statusHint}`);
            } else {
                logger.info(`   - ${item.name}${depsStr}`);
            }
        }
        logger.newLine();

        if (allDeps.length > 0) {
            logger.bold('📚 Required npm packages:');
            logger.info(`   ${allDeps.join(', ')}`);
            logger.newLine();
        }

        if (spinner) {
            spinner.start(`[1/${registryItems.length}] Adding ${registryItems[0].name}...`);
        }

        if (!options.dryRun) {
            const utils = await ensureUtilsFile(targetCwd, config);
            if (utils.created) {
                spinner?.info(`Created utility file at ${utils.path}`);
            }
        }

        const { added, skipped, filesWritten, filesByComponent, rollback } = await writeComponentFiles(
            registryItems,
            config,
            targetCwd,
            {
                overwrite: options.overwrite,
                dryRun: options.dryRun,
                callbacks: {
                    onProgress: result => {
                        if (spinner) {
                            spinner.text = `[${result.index + 1}/${result.total}] Adding ${result.item.name}...`;
                        }
                    },
                    onSkipFile: result => {
                        spinner?.info(`Skipping file "${result.filePath}" for "${result.item.name}" (already exists). Use --overwrite to overwrite.`);
                    },
                    onDryRunFile: result => {
                        spinner?.info(`[Dry Run] Would create file: ${result.targetPath}`);
                    },
                },
            }
        );

        const summary = skipped.length > 0
            ? `Added ${added.length} component(s), skipped ${skipped.length}`
            : `Added ${added.length} component(s)`;

        if (options.dryRun) {
            spinner?.succeed(`[Dry Run] Simulated: ${summary}`);
        } else {
            spinner?.succeed(summary);
        }

        if (added.length > 0 && filesWritten.length > 0) {
            logger.newLine();
            logger.bold('💾 Files written to disk:');
            for (const filePath of filesWritten) {
                const relativePath = path.relative(targetCwd, filePath);
                logger.success(`   ✓ ${relativePath}`);
            }
        }

        // 标记 manifest 是否已更新成功：决定失败回滚是否还安全（见下方 catch 注释）
        let manifestUpdated = false;

        try {
            const depsInstalled = await installComponentDeps(allDeps, targetCwd, options.dryRun ?? false);

            if (!options.dryRun && added.length > 0) {
                if (allDeps.length > 0 && !depsInstalled) {
                    // 依赖安装失败：回滚本次已写入的文件，避免组件陷入"文件已写、manifest 未记录"的不可恢复半安装状态
                    // （否则重跑 add 时文件已存在会被全部 skip，永远无法注册）
                    const { rollbackFailures } = await rollback();
                    logger.warn('⚠ Dependency installation failed. Rolled back written component files.');
                    if (rollbackFailures > 0) {
                        logger.warn(`⚠ Rollback failed for ${rollbackFailures} file(s). You may need to restore them manually.`);
                    }
                    logger.info('  Install dependencies manually, then re-run the add command.');
                    // 清空 added：避免末尾对"已回滚、未注册"的组件打印误导性的 Usage 示例
                    added.length = 0;
                } else {
                    // 解析用户输入的 @version（若有），用于 manifest 记录版本契约
                    const versionByName = new Map<string, string>();
                    for (const inputName of components) {
                        const match = inputName.match(/^(@[a-z0-9-]+\/[a-z0-9-]+|[a-z0-9-]+)@([a-zA-Z0-9._-]+)$/);
                        if (match) {
                            versionByName.set(match[1], match[2]);
                        }
                    }

                    // 版本混用兼容性提示：检测已安装组件与即将安装组件的版本差异。
                    // 已装版本为 'latest'（manifest 未记录具体版本）时同样告警——实际已装版本未知，
                    // 混用具体版本可能引入兼容性问题
                    if (versionByName.size > 0) {
                        const existingManifest = await readManifest(targetCwd);
                        if (existingManifest) {
                            for (const [name, newVersion] of versionByName) {
                                const existing = existingManifest.components[name];
                                if (existing?.version && existing.version !== newVersion) {
                                    logger.warn(`⚠ Version mismatch: "${name}" is already installed at version ${existing.version}, but you requested ${newVersion}. Mixing versions may cause compatibility issues.`);
                                }
                            }
                        }
                    }

                    const manifestEntries = await Promise.all(
                        registryItems
                            .filter(item => added.includes(item.name))
                            .map(async item => {
                                const files = filesByComponent[item.name] ?? [];
                                const installedContentHash = files.length > 0
                                    ? await computeInstalledContentHash(files)
                                    : undefined;
                                return {
                                    item,
                                    registrySource: hitRegistrySources[item.name] ?? options.registry ?? DEFAULT_REGISTRY_URL,
                                    files,
                                    installedContentHash,
                                    version: versionByName.get(item.name) ?? 'latest',
                                };
                            })
                    );
                    await updateInstalledComponents(targetCwd, manifestEntries);
                    manifestUpdated = true;

                    const shouldUpdateSnippets = options.vscode === true
                        || (options.vscode !== false && await hasVscodeDir(targetCwd));

                    if (shouldUpdateSnippets) {
                        const snippetPath = await mergeSnippetsFile(targetCwd, added);
                        logger.success(`✓ VS Code snippets updated at ${path.relative(targetCwd, snippetPath)}`);
                    }
                }
            }
        } catch (error: unknown) {
            if (!manifestUpdated) {
                // 失败发生在 manifest 更新之前（依赖安装/manifest 更新本身失败）：
                // 回滚已写入的组件文件 → "文件已删、manifest 未记录"，两侧状态一致。
                // rollback 基于写入快照、幂等（重复调用安全）；依赖安装失败分支已自行回滚且不再抛错，
                // 不会重复触发这里的回滚。
                try {
                    await rollback();
                    logger.warn('⚠ Installation failed after writing files. Rolled back written component files.');
                } catch (rollbackError) {
                    const rollbackMessage = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
                    logger.error(`⚠ Rollback failed: ${rollbackMessage}`);
                    logger.info('  Run "brutx-vue doctor --fix" to repair.');
                }
            } else {
                // manifest 已登记、组件文件已写入，两侧已一致（失败仅发生在 snippets 合并等后续步骤）：
                // 不再回滚文件，避免产生"manifest 有记录、文件缺失"的反向半安装状态；仅提示失败步骤
                logger.warn('⚠ Component files and manifest are in sync, but a post-write step failed (e.g. VS Code snippets merge). Re-run the command or fix the failing step manually.');
            }
            throw error;
        }

        if (added.length > 0) {
            logger.newLine();
            logger.bold('Usage:');
            printUsageExample(added[0], config.aliases.components);
        }

    } catch (error: unknown) {
        spinner?.fail('Failed to add components');
        const writeFailure = getComponentFileWriteFailure(error);
        if (writeFailure) {
            if (writeFailure.rollbackFailures > 0) {
                logger.error(`Rollback partially failed for ${writeFailure.rollbackFailures} file(s). Run "brutx-vue doctor --fix" to repair.`);
            }
            logger.error(`Installation failed. Rolled back ${writeFailure.rollbackCount} file(s) to previous state.`);
        }
        if (error instanceof CliError) {
            throw error;
        }
        const message = error instanceof Error ? error.message : String(error);
        throw new CliError(message);
    }
}
