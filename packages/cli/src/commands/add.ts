import ora from 'ora';
import { checkbox } from '@inquirer/prompts';
import path from 'path';

import {
    type AddOptions,
    type RegistryItem,
    AVAILABLE_COMPONENTS,
    DEFAULT_REGISTRY_URL,
    resolveRegistrySources,
    CliError,
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
    withOfflineScope,
    type ComponentFileWriteFailure,
    mergeDryRun,
    withAuditLog,
    ProjectContext,
    WorkspaceTopologyEngine,
    TargetResolver,
    PackageManagerAdapter,
    RegistryClient,
} from '../lib/index.js';

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

async function selectComponents(inputComponents: string[], options: AddOptions, client?: RegistryClient): Promise<string[]> {
    if (options.all) {
        // AVAILABLE_COMPONENTS 仅对默认注册表有效；自定义 registry 可能不含这些组件
        if (options.registry) {
            try {
                const effectiveClient = client ?? new RegistryClient({ sources: [options.registry] });
                const list = await effectiveClient.listComponents({ source: options.registry });
                if (list && list.length > 0) {
                    return [...list];
                }
            } catch {
                throw new CliError('--all is not supported with a remote --registry (component listing unavailable). Specify component names explicitly.');
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
    const callerContext = await ProjectContext.loadUninitialized(cwd);
    const topology = await WorkspaceTopologyEngine.resolveTopology(cwd, callerContext.fs);
    const rootConfig = callerContext.config;

    if (!callerContext.isConfigured && !topology.isMonorepo) {
        throw new CliError(`components.json not found in "${cwd}". Run "brutx init" first.`, {
            code: 'CONFIG_NOT_FOUND',
            exitCode: 1,
        });
    }

    const plan = TargetResolver.resolvePlan(cwd, options.filter, topology, rootConfig);

    let context = callerContext;
    const effectiveTargetCwd = targetCwd !== cwd ? targetCwd : plan.targetPackageRoot;
    if (effectiveTargetCwd !== cwd || !context.isConfigured) {
        context = await ProjectContext.loadUninitialized(effectiveTargetCwd, {
            fs: callerContext.fs,
            configOverride: plan.effectiveConfig,
        });
    }

    await validateComponents(components, options.registry);

    const selectedComponents = await selectComponents(components, options, context.registry);

    if (selectedComponents.length === 0) {
        logger.warn('No components selected.');
        return;
    }

    const sources = resolveRegistrySources(plan.effectiveConfig, options.registry);

    const spinner = options.silent ? null : ora('Resolving components and checking dependencies...').start();

    try {
        const { items: registryItems, dependencies: allDeps, registrySources: hitRegistrySources } =
            await resolveComponents(selectedComponents, options.registry, useCache, sources, context.registry);

        if (spinner) {
            spinner.stop();
        }

        if (registryItems.length === 0) {
            spinner?.warn('No components resolved from registry.');
            return;
        }

        logger.bold('\n📦 Brutx-Vue CLI - Installation Plan:');
        logger.info(`   Target package: ${plan.targetPackageName} (${plan.targetPackageRoot})`);
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
            const utils = await ensureUtilsFile(context);
            if (utils.created) {
                spinner?.info(`Created utility file at ${utils.path}`);
            }
        }

        // ==========================================
        // 阶段一：文件事务与组件源码写入（原子提交）
        // ==========================================
        const { added, skipped, filesWritten, filesByComponent, transaction } = await writeComponentFiles(
            context,
            registryItems,
            {
                overwrite: options.overwrite,
                merge: options.merge,
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
                const relativePath = path.relative(effectiveTargetCwd, filePath);
                logger.success(`   ✓ ${relativePath}`);
            }
        }

        if (!options.dryRun && added.length > 0) {
            const versionByName = new Map<string, string>();
            for (const inputName of components) {
                const match = inputName.match(/^(@[a-z0-9-]+\/[a-z0-9-]+|[a-z0-9-]+)@([a-zA-Z0-9._-]+)$/);
                if (match) {
                    versionByName.set(match[1], match[2]);
                }
            }

            if (versionByName.size > 0) {
                const existingManifest = await readManifest(effectiveTargetCwd);
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
            await updateInstalledComponents(effectiveTargetCwd, manifestEntries);
            await transaction?.commit();

            const shouldUpdateSnippets = options.vscode === true
                || (options.vscode !== false && await hasVscodeDir(effectiveTargetCwd));

            if (shouldUpdateSnippets) {
                const snippetPath = await mergeSnippetsFile(effectiveTargetCwd, added);
                logger.success(`✓ VS Code snippets updated at ${path.relative(effectiveTargetCwd, snippetPath)}`);
            }
        }

        // ==========================================
        // 阶段二：跨包依赖安装调度与自愈输出
        // ==========================================
        if (allDeps.length > 0) {
            logger.newLine();
            if (options.dryRun) {
                const manualCmd = PackageManagerAdapter.getManualInstallCommand(
                    topology.packageManager,
                    allDeps,
                    plan.depInstallTarget.packageName,
                    topology.isMonorepo
                );
                logger.bold(`[Dry Run] Would install dependencies using ${topology.packageManager}:`);
                logger.info(`  ${manualCmd}`);
            } else {
                logger.bold(`Installing dependencies with ${topology.packageManager}...`);
                try {
                    await PackageManagerAdapter.executeInstall(
                        topology.packageManager,
                        allDeps,
                        topology.workspaceRoot,
                        plan.depInstallTarget.packageName,
                        topology.isMonorepo
                    );
                    logger.success('✓ Dependencies installed');
                } catch {
                    const manualCmd = PackageManagerAdapter.getManualInstallCommand(
                        topology.packageManager,
                        allDeps,
                        plan.depInstallTarget.packageName,
                        topology.isMonorepo
                    );
                    logger.warn('⚠ Failed to install dependencies automatically.');
                    logger.info(`  Run manually: ${manualCmd}`);
                }
            }
        }

        if (added.length > 0) {
            logger.newLine();
            logger.bold('Usage:');
            printUsageExample(added[0], plan.effectiveConfig.aliases.components);
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
