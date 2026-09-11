import ora from 'ora';
import chalk from 'chalk';
import { checkbox } from '@inquirer/prompts';
import path from 'path';

import {
    type AddOptions,
    type RegistryItem,
    AVAILABLE_COMPONENTS,
    DEFAULT_REGISTRY_URL,
    CliError,
    isSafePath,
    logger,
    withOfflineScope,
    mergeDryRun,
    withAuditLog,
    ProjectContext,
    WorkspaceTopologyEngine,
    TargetResolver,
    PackageManagerAdapter,
    RegistryClient,
    ComponentMutationEngine,
} from '../lib/index.js';

async function validateComponents(components: string[], registryOverride?: string): Promise<void> {
    const MAX_COMPONENT_NAME_LENGTH = 100;

    for (const component of components) {
        if (component.length > MAX_COMPONENT_NAME_LENGTH) {
            throw new CliError(`Component name too long: "${component.slice(0, 50)}..." (max ${MAX_COMPONENT_NAME_LENGTH} characters)`, {
                code: 'INVALID_COMPONENT_NAME',
                exitCode: 1,
            });
        }
    }

    if (registryOverride) {
        return;
    }

    const cleanComponents = components.map(c => c.split('@')[0]);
    const invalid = cleanComponents.filter((c) => !AVAILABLE_COMPONENTS.includes(c));

    if (invalid.length > 0) {
        throw new CliError(`Unknown components: ${invalid.join(', ')}. Available: ${AVAILABLE_COMPONENTS.join(', ')}`, {
            code: 'COMPONENT_NOT_FOUND',
            exitCode: 1,
        });
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
                throw new CliError('--all is not supported with a remote --registry (component listing unavailable). Specify component names explicitly.', {
                    code: 'REGISTRY_LIST_UNSUPPORTED',
                    exitCode: 1,
                });
            }
            throw new CliError('--all is not supported with a remote --registry (component listing unavailable). Specify component names explicitly.', {
                code: 'REGISTRY_LIST_UNSUPPORTED',
                exitCode: 1,
            });
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

    // 合并全局 dry-run（BRUTX_DRY_RUN=1 或 --dry-run 全局 flag）
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

    const plan = TargetResolver.resolvePlan(cwd, options.filter, topology, rootConfig, options.shared);

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

    const spinner = options.silent ? null : ora('Resolving components and checking dependencies...').start();
    const engine = new ComponentMutationEngine(context);

    try {
        const mutationPlan = await engine.planInstall({
            components: selectedComponents,
            overwrite: options.overwrite,
            merge: options.merge,
            registryOverride: options.registry,
            useCache,
            vscode: options.vscode,
        });

        if (spinner) {
            spinner.stop();
        }

        if (mutationPlan.items.length === 0) {
            spinner?.warn('No components resolved from registry.');
            return;
        }

        logger.bold('\n📦 Brutx-Vue CLI - Installation Plan:');
        logger.info(`   Target package: ${plan.targetPackageName} (${plan.targetPackageRoot})`);
        logger.info(`   Registry source: ${options.registry || 'Default Brutx-Vue hosted registry'}`);
        logger.newLine();

        const planParts = mutationPlan.items.map(
            (item) => `${item.name} (${item.files.length} file${item.files.length !== 1 ? 's' : ''})`
        );
        logger.bold(
            `Installing ${mutationPlan.items.length} component${mutationPlan.items.length !== 1 ? 's' : ''}: ${planParts.join(', ')}`
        );
        logger.newLine();

        logger.bold('🧩 Components to install/update:');
        for (const item of mutationPlan.items) {
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

        if (mutationPlan.warnings.length > 0) {
            for (const warning of mutationPlan.warnings) {
                logger.warn(`⚠ ${warning}`);
            }
            logger.newLine();
        }

        if (mutationPlan.npmDependencies.length > 0) {
            logger.bold('📚 Required npm packages:');
            logger.info(`   ${mutationPlan.npmDependencies.join(', ')}`);
            logger.newLine();
        }

        if (spinner) {
            spinner.start(`[1/${mutationPlan.items.length}] Adding ${mutationPlan.items[0].name}...`);
        }

        const mutationResult = await engine.execute(mutationPlan, {
            dryRun: options.dryRun,
            targetPackageName: plan.depInstallTarget.packageName,
            callbacks: {
                onProgress: info => {
                    if (spinner) {
                        spinner.text = `[${info.current}/${info.total}] Adding ${info.component}...`;
                    }
                },
                onFileWritten: info => {
                    if (info.action === 'skip') {
                        spinner?.info(`Skipping file "${info.filePath}" for "${info.component}" (already exists). Use --overwrite to overwrite.`);
                    } else if (options.dryRun) {
                        spinner?.info(`[Dry Run] Would create file: ${info.filePath}`);
                    }
                },
            },
        });

        const summary = mutationResult.skipped.length > 0
            ? `Added ${mutationResult.succeeded.length} component(s), skipped ${mutationResult.skipped.length}`
            : `Added ${mutationResult.succeeded.length} component(s)`;

        if (options.dryRun) {
            spinner?.succeed(`[Dry Run] Simulated: ${summary}`);
        } else {
            spinner?.succeed(summary);
        }

        if (mutationResult.succeeded.length > 0 && mutationResult.filesWritten.length > 0) {
            logger.newLine();
            logger.bold('💾 Files written to disk:');
            for (const filePath of mutationResult.filesWritten) {
                const relativePath = path.relative(effectiveTargetCwd, filePath);
                logger.success(`   ✓ ${relativePath}`);
            }
        }

        if (mutationResult.conflicts.length > 0) {
            logger.newLine();
            logger.warn(
                `Notice: ${mutationResult.conflicts.length} component(s) have unresolved conflict markers. Please inspect and resolve them in your editor:`
            );
            for (const c of mutationResult.conflicts) {
                logger.warn(`  ${chalk.yellow('⚠')} ${chalk.bold(c.component)}:`);
                for (const cf of c.conflictFiles) {
                    logger.log(`    ${chalk.dim('→')} ${cf}`);
                }
            }
        }

        if (mutationPlan.updateSnippets && mutationResult.succeeded.length > 0 && !options.dryRun) {
            const snippetRelPath = path.relative(effectiveTargetCwd, path.join(effectiveTargetCwd, '.vscode', 'brutx.code-snippets'));
            logger.success(`✓ VS Code snippets updated at ${snippetRelPath}`);
        }

        if (mutationPlan.npmDependencies.length > 0) {
            logger.newLine();
            if (options.dryRun) {
                const manualCmd = PackageManagerAdapter.getManualInstallCommand(
                    topology.packageManager,
                    mutationPlan.npmDependencies,
                    plan.depInstallTarget.packageName,
                    topology.isMonorepo
                );
                logger.bold(`[Dry Run] Would install dependencies using ${topology.packageManager}:`);
                logger.info(`  ${manualCmd}`);
            } else if (mutationResult.dependencies.status === 'installed') {
                logger.success('✓ Dependencies installed');
            } else if (mutationResult.dependencies.status === 'failed') {
                logger.warn('⚠ Failed to install dependencies automatically.');
                if (mutationResult.dependencies.manualCommand) {
                    logger.info(`  Run manually: ${mutationResult.dependencies.manualCommand}`);
                }
            }
        }

        if (mutationResult.succeeded.length > 0) {
            logger.newLine();
            logger.bold('Usage:');
            printUsageExample(mutationResult.succeeded[0], plan.effectiveConfig.aliases.components);
        }

    } catch (error: unknown) {
        spinner?.fail('Failed to add components');
        if (error instanceof CliError) {
            throw error;
        }
        const message = error instanceof Error ? error.message : String(error);
        throw new CliError(message, { cause: error });
    }
}
