import path from 'path';
import type { ProjectContext } from '../project-context.js';
import type { RegistryItem } from '../types.js';
import { DEFAULT_REGISTRY_URL } from '../constants.js';
import { ensureUtilsFile } from './add-service.js';
import { mergeSnippetsFile, hasVscodeDir } from '../vscode-snippets.js';
import { computeInstalledContentHash, updateInstalledComponents, readManifest } from '../manifest.js';
import { MergeExecutor } from '../merge/merge-executor.js';
import { PackageManagerAdapter } from '../workspace/package-manager-adapter.js';
import { WorkspaceTopologyEngine } from '../workspace/topology-engine.js';
import { CliError } from '../error.js';

export type PlanFileAction = 'create' | 'overwrite' | 'merge' | 'delete' | 'skip';

export interface MutationPlanFile {
    componentName: string;
    filePath: string;
    action: PlanFileAction;
    sourceContent: string;
    mergedContent?: string;
    hasConflicts?: boolean;
    conflictMarkers?: boolean;
}

export interface ComponentMutationPlan {
    /** 待处理的组件列表（含递归解析出的依赖项） */
    items: RegistryItem[];
    /** 计划写入、更新或跳过的文件详情清单 */
    files: MutationPlanFile[];
    /** 需要安装的 npm 依赖包 */
    npmDependencies: string[];
    /** 是否需要生成/更新 cn.ts 工具辅助文件 */
    ensureUtils: boolean;
    /** 是否需要更新 VS Code 代码片段 */
    updateSnippets: boolean;
    /** 命中并解析该组件的注册表源映射 */
    registrySources: Record<string, string>;
    /** 组件版本映射（显式指定或锁定版本） */
    versionByName: Map<string, string>;
    /** 计划阶段产生的诊断与版本告警信息 */
    warnings: string[];
}

export interface ComponentPlanOptions {
    /** 目标安装或更新的组件名称（支持带版本，如 button、card@1.0.0） */
    components: string[];
    /** 是否强制覆盖已有文件 */
    overwrite?: boolean;
    /** 是否启用 3-way 智能合并 */
    merge?: boolean;
    /** 3-way 合并冲突策略 */
    conflictStrategy?: 'ours' | 'theirs' | 'markers';
    /** 自定义注册表地址覆盖 */
    registryOverride?: string;
    /** 是否使用缓存 */
    useCache?: boolean;
    /** 是否更新 VS Code 代码片段（默认自动检测） */
    vscode?: boolean;
}

export interface MutationCallbacks {
    onProgress?: (info: { component: string; current: number; total: number }) => void;
    onFileWritten?: (info: { component: string; filePath: string; action: PlanFileAction }) => void;
    onDependencyStart?: (packages: string[]) => void;
}

export interface ComponentExecuteOptions {
    /** 演练模式（仅触发事件与校验，不提交事务与执行外部命令） */
    dryRun?: boolean;
    /** 是否跳过安装 npm 依赖包 */
    skipDependencies?: boolean;
    /** 目标子包名称（Monorepo 场景下指定安装依赖的具体子包） */
    targetPackageName?: string;
    /** 执行回调 */
    callbacks?: MutationCallbacks;
}

export interface DependencyInstallResult {
    status: 'installed' | 'skipped' | 'failed';
    packages: string[];
    manualCommand?: string;
    error?: string;
}

export interface ComponentMutationResult {
    /** 成功处理的组件列表 */
    succeeded: string[];
    /** 跳过的组件列表 */
    skipped: string[];
    /** 实际写入或合并的目标物理文件路径列表 */
    filesWritten: string[];
    /** 实际删除的目标物理文件路径列表 */
    filesDeleted: string[];
    /** 存在未决冲突标记的文件明细 */
    conflicts: Array<{ component: string; conflictFiles: string[] }>;
    /** npm 依赖安装执行明细 */
    dependencies: DependencyInstallResult;
    /** 是否成功更新并提交了 installed-components.json 清单 */
    manifestUpdated: boolean;
    /** 变更统计 */
    stats: {
        createdFiles: number;
        mergedFiles: number;
        deletedFiles: number;
        skippedFiles: number;
    };
}

export class ComponentMutationEngine {
    constructor(private readonly context: ProjectContext) {}

    /**
     * 阶段一：安装规划（纯内存计算，零副作用）
     */
    async planInstall(options: ComponentPlanOptions): Promise<ComponentMutationPlan> {
        const versionByName = new Map<string, string>();
        const cleanNames: string[] = [];

        for (const comp of options.components) {
            const match = comp.match(/^(@[a-z0-9-]+\/[a-z0-9-]+|[a-z0-9-]+)@([a-zA-Z0-9._-]+)$/);
            if (match) {
                versionByName.set(match[1], match[2]);
                cleanNames.push(match[1]);
            } else {
                cleanNames.push(comp);
            }
        }

        const client = this.context.getRegistryClient({
            sources: options.registryOverride ? [options.registryOverride] : undefined,
            useCache: options.useCache !== false,
        });

        const resolution = await client.resolve(cleanNames, {
            sourceOverride: options.registryOverride,
            useCache: options.useCache !== false,
        });

        const utilsPath = await this.context.resolveUtilsFilePath();
        const utilsExists = await this.context.fs.pathExists(utilsPath);
        const ensureUtils = !utilsExists;

        let updateSnippets = false;
        if (options.vscode === true) {
            updateSnippets = true;
        } else if (options.vscode !== false) {
            updateSnippets = await hasVscodeDir(this.context.cwd, this.context.fs);
        }

        const files: MutationPlanFile[] = [];
        const mergeExecutor = options.merge ? new MergeExecutor({ fs: this.context.fs }) : null;

        for (const item of resolution.items) {
            if (options.merge && mergeExecutor) {
                const mergePlan = await mergeExecutor.plan(this.context, item.name, item, {
                    conflictStrategy: options.conflictStrategy,
                    registrySource: resolution.hitSources.get(item.name) ?? options.registryOverride,
                    useCache: options.useCache,
                });

                for (const fileResult of mergePlan.files) {
                    const absPath = path.resolve(this.context.cwd, fileResult.filePath);
                    let action: PlanFileAction;
                    if (fileResult.action === 'write') {
                        action = fileResult.status === 'added' ? 'create' : 'merge';
                    } else {
                        action = 'skip';
                    }

                    files.push({
                        componentName: item.name,
                        filePath: absPath,
                        action,
                        sourceContent: fileResult.content ?? '',
                        mergedContent: fileResult.content,
                        hasConflicts: fileResult.status === 'conflict' || fileResult.status === 'restore-prompt',
                        conflictMarkers: fileResult.status === 'conflict',
                    });
                }
            } else {
                for (const file of item.files) {
                    const targetPath = await this.context.resolveTargetPath(file.path);
                    const exists = await this.context.fs.pathExists(targetPath);
                    let action: PlanFileAction;
                    if (exists) {
                        action = options.overwrite ? 'overwrite' : 'skip';
                    } else {
                        action = 'create';
                    }

                    const resolvedContent = this.context.resolveImportAlias(file.content);
                    files.push({
                        componentName: item.name,
                        filePath: targetPath,
                        action,
                        sourceContent: resolvedContent,
                        hasConflicts: false,
                    });
                }
            }
        }

        const warnings: string[] = [];
        const existingManifest = await readManifest(this.context.cwd, this.context.fs).catch(() => null);
        if (existingManifest && versionByName.size > 0) {
            for (const [name, newVersion] of versionByName) {
                const existing = existingManifest.components[name];
                if (existing?.version && existing.version !== newVersion) {
                    warnings.push(`Version mismatch: "${name}" is already installed at version ${existing.version}, but you requested ${newVersion}. Mixing versions may cause compatibility issues.`);
                }
            }
        }

        return {
            items: [...resolution.items],
            files,
            npmDependencies: [...resolution.npmDependencies],
            ensureUtils,
            updateSnippets,
            registrySources: Object.fromEntries(resolution.hitSources),
            versionByName,
            warnings,
        };
    }

    /**
     * 阶段一：更新规划（针对已安装组件计算差异与 3-way 合并计划）
     */
    async planUpdate(options: ComponentPlanOptions): Promise<ComponentMutationPlan> {
        const manifest = await readManifest(this.context.cwd, this.context.fs).catch(() => null);
        const versionByName = new Map<string, string>();
        const cleanNames: string[] = [];

        for (const comp of options.components) {
            const match = comp.match(/^(@[a-z0-9-]+\/[a-z0-9-]+|[a-z0-9-]+)@([a-zA-Z0-9._-]+)$/);
            if (match) {
                versionByName.set(match[1], match[2]);
                cleanNames.push(match[1]);
            } else {
                cleanNames.push(comp);
            }
        }

        const client = this.context.getRegistryClient({
            sources: options.registryOverride ? [options.registryOverride] : undefined,
            useCache: options.useCache !== false,
        });

        const remoteItems: RegistryItem[] = [];
        const registrySources: Record<string, string> = {};
        const npmDepsSet = new Set<string>();

        for (const name of cleanNames) {
            const itemRegistrySource = options.registryOverride ?? manifest?.components[name]?.registrySource;
            const item = await client.fetchItem(name, {
                sourceOverride: itemRegistrySource,
                useCache: options.useCache !== false,
            });
            remoteItems.push(item);
            if (itemRegistrySource) {
                registrySources[name] = itemRegistrySource;
            }
            for (const dep of item.dependencies) {
                npmDepsSet.add(dep);
            }
        }

        const conflictStrategy = options.conflictStrategy ?? 'markers';
        const mergeExecutor = new MergeExecutor({ fs: this.context.fs });
        const files: MutationPlanFile[] = [];

        for (const item of remoteItems) {
            if (options.overwrite) {
                for (const file of item.files) {
                    const targetPath = await this.context.resolveTargetPath(file.path);
                    const resolvedContent = this.context.resolveImportAlias(file.content);
                    files.push({
                        componentName: item.name,
                        filePath: targetPath,
                        action: 'overwrite',
                        sourceContent: resolvedContent,
                        hasConflicts: false,
                    });
                }
            } else {
                const mergePlan = await mergeExecutor.plan(this.context, item.name, item, {
                    conflictStrategy,
                    registrySource: registrySources[item.name] ?? options.registryOverride,
                    useCache: options.useCache,
                });

                for (const fileResult of mergePlan.files) {
                    const absPath = path.resolve(this.context.cwd, fileResult.filePath);
                    let action: PlanFileAction;
                    if (fileResult.action === 'write') {
                        action = fileResult.status === 'added' ? 'create' : 'merge';
                    } else if (fileResult.action === 'delete') {
                        action = 'delete';
                    } else {
                        action = 'skip';
                    }

                    files.push({
                        componentName: item.name,
                        filePath: absPath,
                        action,
                        sourceContent: fileResult.content ?? '',
                        mergedContent: fileResult.content,
                        hasConflicts: fileResult.status === 'conflict' || fileResult.status === 'restore-prompt',
                        conflictMarkers: fileResult.status === 'conflict',
                    });
                }
            }
        }

        let updateSnippets = false;
        if (options.vscode === true) {
            updateSnippets = true;
        } else if (options.vscode !== false) {
            updateSnippets = await hasVscodeDir(this.context.cwd, this.context.fs);
        }

        return {
            items: remoteItems,
            files,
            npmDependencies: Array.from(npmDepsSet),
            ensureUtils: false,
            updateSnippets,
            registrySources,
            versionByName,
            warnings: [],
        };
    }

    /**
     * 阶段二：原子事务执行与外部副作用调度
     */
    async execute(
        plan: ComponentMutationPlan,
        options: ComponentExecuteOptions = {}
    ): Promise<ComponentMutationResult> {
        let createdFiles = 0;
        let mergedFiles = 0;
        let deletedFiles = 0;
        let skippedFiles = 0;

        for (const f of plan.files) {
            if (f.action === 'create') createdFiles++;
            else if (f.action === 'merge' || f.action === 'overwrite') mergedFiles++;
            else if (f.action === 'delete') deletedFiles++;
            else if (f.action === 'skip') skippedFiles++;
        }

        if (options.dryRun) {
            const filesWritten = plan.files
                .filter(f => f.action !== 'skip' && f.action !== 'delete')
                .map(f => f.filePath);
            const filesDeleted = plan.files
                .filter(f => f.action === 'delete')
                .map(f => f.filePath);

            return {
                succeeded: plan.items.map(i => i.name),
                skipped: [],
                filesWritten,
                filesDeleted,
                conflicts: [],
                dependencies: {
                    status: 'skipped',
                    packages: plan.npmDependencies,
                },
                manifestUpdated: false,
                stats: {
                    createdFiles,
                    mergedFiles,
                    deletedFiles,
                    skippedFiles,
                },
            };
        }

        const transaction = this.context.createTransaction();
        const succeeded: string[] = [];
        const skipped: string[] = [];
        const filesWritten: string[] = [];
        const filesDeleted: string[] = [];
        const filesByComponent = new Map<string, string[]>();
        const conflictsMap = new Map<string, string[]>();

        try {
            if (plan.ensureUtils) {
                await ensureUtilsFile(this.context, undefined, undefined, transaction);
            }

            for (let i = 0; i < plan.items.length; i++) {
                const item = plan.items[i];
                options.callbacks?.onProgress?.({
                    component: item.name,
                    current: i + 1,
                    total: plan.items.length,
                });

                const itemFiles = plan.files.filter(f => f.componentName === item.name);
                const writtenForThisItem: string[] = [];

                if (itemFiles.length > 0 && itemFiles.every(f => f.action === 'skip')) {
                    skipped.push(item.name);
                    continue;
                }

                for (const file of itemFiles) {
                    if (file.action === 'skip') {
                        continue;
                    }

                    if (file.action === 'delete') {
                        this.context.assertSafePath(file.filePath);
                        await transaction.remove(file.filePath);
                        filesDeleted.push(file.filePath);

                        options.callbacks?.onFileWritten?.({
                            component: item.name,
                            filePath: file.filePath,
                            action: file.action,
                        });
                        continue;
                    }

                    const contentToWrite = file.mergedContent ?? file.sourceContent;
                    await transaction.writeFile(file.filePath, contentToWrite);

                    filesWritten.push(file.filePath);
                    writtenForThisItem.push(file.filePath);

                    options.callbacks?.onFileWritten?.({
                        component: item.name,
                        filePath: file.filePath,
                        action: file.action,
                    });

                    if (file.conflictMarkers) {
                        const currentConflicts = conflictsMap.get(item.name) ?? [];
                        currentConflicts.push(file.filePath);
                        conflictsMap.set(item.name, currentConflicts);
                    }
                }

                if (writtenForThisItem.length > 0 || itemFiles.some(f => f.action === 'delete')) {
                    succeeded.push(item.name);
                    filesByComponent.set(item.name, writtenForThisItem);
                }
            }

            if (plan.updateSnippets && succeeded.length > 0) {
                await mergeSnippetsFile(this.context.cwd, succeeded, this.context.fs, transaction);
            }

            let manifestUpdated = false;
            if (succeeded.length > 0) {
                const manifestEntries = await Promise.all(
                    plan.items
                        .filter(item => succeeded.includes(item.name))
                        .map(async item => {
                            const compFiles = filesByComponent.get(item.name) ?? [];
                            const installedContentHash = compFiles.length > 0
                                ? await computeInstalledContentHash(compFiles, this.context.fs)
                                : undefined;

                            return {
                                item,
                                registrySource: plan.registrySources[item.name] ?? DEFAULT_REGISTRY_URL,
                                files: compFiles,
                                installedContentHash,
                                version: plan.versionByName.get(item.name) ?? 'latest',
                            };
                        })
                );

                await updateInstalledComponents(this.context.cwd, manifestEntries, { transaction }, this.context.fs);
                manifestUpdated = true;
            }

            await transaction.commit();

            let dependenciesResult: DependencyInstallResult = {
                status: 'skipped',
                packages: plan.npmDependencies,
            };

            if (plan.npmDependencies.length > 0 && !options.skipDependencies) {
                options.callbacks?.onDependencyStart?.(plan.npmDependencies);
                const topology = await WorkspaceTopologyEngine.resolveTopology(this.context.cwd, this.context.fs);

                let targetPackage = options.targetPackageName;
                if (!targetPackage && topology.isMonorepo) {
                    try {
                        const pkgJsonPath = path.resolve(this.context.cwd, 'package.json');
                        if (await this.context.fs.pathExists(pkgJsonPath)) {
                            const raw = await this.context.fs.readFile(pkgJsonPath, 'utf8');
                            const parsed = JSON.parse(raw);
                            if (typeof parsed?.name === 'string') {
                                targetPackage = parsed.name;
                            }
                        }
                    } catch {
                        // ignore and proceed
                    }
                }

                try {
                    await PackageManagerAdapter.executeInstall(
                        topology.packageManager,
                        plan.npmDependencies,
                        topology.workspaceRoot,
                        targetPackage,
                        topology.isMonorepo
                    );
                    dependenciesResult = {
                        status: 'installed',
                        packages: plan.npmDependencies,
                    };
                } catch (installError) {
                    const manualCommand = PackageManagerAdapter.getManualInstallCommand(
                        topology.packageManager,
                        plan.npmDependencies,
                        targetPackage,
                        topology.isMonorepo
                    );
                    dependenciesResult = {
                        status: 'failed',
                        packages: plan.npmDependencies,
                        manualCommand,
                        error: installError instanceof Error ? installError.message : String(installError),
                    };
                }
            }

            const conflicts = Array.from(conflictsMap.entries()).map(([component, conflictFiles]) => ({
                component,
                conflictFiles,
            }));

            return {
                succeeded,
                skipped,
                filesWritten,
                filesDeleted,
                conflicts,
                dependencies: dependenciesResult,
                manifestUpdated,
                stats: {
                    createdFiles,
                    mergedFiles,
                    deletedFiles,
                    skippedFiles,
                },
            };
        } catch (error) {
            await transaction.rollback();
            if (error instanceof CliError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : String(error);
            throw new CliError(`Component mutation failed and was cleanly rolled back: ${message}`, {
                cause: error,
            });
        }
    }
}
