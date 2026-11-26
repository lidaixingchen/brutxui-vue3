import path from 'path';
import type { ProjectContext } from '../project-context.js';
import type { RegistryItem, RegistryItemSnapshot } from '../types.js';
import { DEFAULT_REGISTRY_URL } from '../constants.js';
import { ensureUtilsFile } from './add-service.js';
import { mergeSnippetsFile, hasVscodeDir } from '../vscode-snippets.js';
import {
    assertInstalledComponentIdentity,
    computeInstalledContentHash,
    updateInstalledComponents,
    readManifest,
    ensureGitattributes,
    getBaselineRelativePath,
    getInstalledComponentIdentity,
    type BaselineRecovery,
    type InstalledComponentIdentity,
    type RegistrySelectionUpdate,
} from '../manifest.js';
import { collectInstalledFilePaths, projectRegistryFiles, resolveInstalledFile, type PlannedComponentSource } from '../component-files.js';
import { normalizeEol } from '../merge/whitespace-normalizer.js';
import { MergeExecutor } from '../merge/merge-executor.js';
import { assertMergeFilesUnchanged, recordMergeFileObservations } from '../merge/file-observations.js';
import { withRegistryPlanningCache } from '../storage/cache-storage.js';
import { PackageManagerAdapter } from '../workspace/package-manager-adapter.js';
import { WorkspaceTopologyEngine } from '../workspace/topology-engine.js';
import { CliError } from '../error.js';
import { collectRegistryComponentRequests } from '../registry-client.js';
import { getUpdateRegistrySource, isRegistrySelectionOnlyUpdate } from '../registry-source.js';
import { findFilesReferencedByInstalledComponents } from './remove-service.js';

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
    registryBaseSources?: Record<string, string>;
    /** 仅同步注册表信息的组件及规划时对应的安装时间 */
    registrySelectionOnly?: ReadonlyMap<string, string>;
    /** 需要同步文件归属的组件，包括仅变更清单的更新 */
    fileOwnershipUpdates?: ReadonlySet<string>;
    /** 执行事务时待写入的已安装版本基线 */
    baselineRecoveries?: readonly BaselineRecovery[];
    /** 安装时使用的合并基线对应的清单身份 */
    installedIdentities?: ReadonlyMap<string, InstalledComponentIdentity | null>;
    /** 合并规划时读取的文件内容，缺失文件记为 undefined */
    observedFiles?: ReadonlyMap<string, string | undefined>;
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

export interface ComponentUpdatePlanOptions extends ComponentPlanOptions {
    acrossVersions?: boolean;
    /** 按组件说明符记录更新检查阶段已获取的条目快照 */
    registrySnapshots?: ReadonlyMap<string, RegistryItemSnapshot>;
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
        return withRegistryPlanningCache(() => this.planInstallComponents(options));
    }

    private async planInstallComponents(options: ComponentPlanOptions): Promise<ComponentMutationPlan> {
        const resolution = await this.context.registry.resolve(options.components, {
            sourceOverride: options.registryOverride,
            useCache: options.useCache !== false,
        });
        const versionByName = new Map<string, string>();
        const registryBaseSources: Record<string, string> = {};
        for (const [name, snapshot] of resolution.itemSnapshots ?? []) {
            if (snapshot.version) versionByName.set(name, snapshot.version);
            if (snapshot.baseSource) registryBaseSources[name] = snapshot.baseSource;
        }

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
        const baselineRecoveries: BaselineRecovery[] = [];
        const observedFiles = new Map<string, string | undefined>();
        const plannedContent = new Map<string, string>();
        const mergeExecutor = options.merge ? new MergeExecutor({ fs: this.context.fs }) : null;
        const existingManifest = await readManifest(this.context.cwd, this.context.fs).catch(() => null);
        const installedIdentities = mergeExecutor
            ? new Map(resolution.items.map(item => [item.name, getInstalledComponentIdentity(existingManifest?.components[item.name])]))
            : undefined;

        for (const item of resolution.items) {
            if (options.merge && mergeExecutor) {
                const mergePlan = await mergeExecutor.plan(this.context, item.name, item, {
                    conflictStrategy: options.conflictStrategy,
                    registrySource: resolution.hitSources.get(item.name) ?? options.registryOverride,
                    useCache: options.useCache,
                    installedManifest: existingManifest,
                });
                for (const [name, identity] of mergePlan.installedIdentities ?? []) installedIdentities?.set(name, identity);
                if (mergePlan.baselineRecovery) baselineRecoveries.push(mergePlan.baselineRecovery);
                recordMergeFileObservations(this.context, observedFiles, mergePlan.observedFiles);

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
                for (const { absolutePath, content } of await projectRegistryFiles(this.context, item.files)) {
                    const alreadyPlanned = plannedContent.has(absolutePath);
                    const exists = alreadyPlanned || await this.context.fs.pathExists(absolutePath);
                    let action: PlanFileAction;
                    if (alreadyPlanned && plannedContent.get(absolutePath) === content) {
                        action = 'skip';
                    } else if (exists) {
                        action = options.overwrite ? 'overwrite' : 'skip';
                    } else {
                        action = 'create';
                    }

                    if (action !== 'skip') plannedContent.set(absolutePath, content);
                    files.push({
                        componentName: item.name,
                        filePath: absolutePath,
                        action,
                        sourceContent: content,
                        hasConflicts: false,
                    });
                }
            }
        }

        const warnings: string[] = [];
        if (existingManifest && versionByName.size > 0) {
            for (const [name, newVersion] of versionByName) {
                const existing = existingManifest.components[name];
                if (existing?.version && existing.version !== newVersion) {
                    warnings.push(`Version mismatch: "${name}" is already installed at version ${existing.version}, but the registry resolved version ${newVersion}. Mixing versions may cause compatibility issues.`);
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
            registryBaseSources,
            baselineRecoveries,
            installedIdentities,
            observedFiles,
            versionByName,
            warnings,
        };
    }

    /**
     * 阶段一：更新规划（针对已安装组件计算差异与 3-way 合并计划）
     */
    async planUpdate(options: ComponentUpdatePlanOptions): Promise<ComponentMutationPlan> {
        return withRegistryPlanningCache(() => this.planUpdateComponents(options));
    }

    private async planUpdateComponents(options: ComponentUpdatePlanOptions): Promise<ComponentMutationPlan> {
        const manifest = await readManifest(this.context.cwd, this.context.fs).catch(() => null);
        const versionByName = new Map<string, string>();
        const remoteItems: RegistryItem[] = [];
        const registrySources: Record<string, string> = {};
        const registryBaseSources: Record<string, string> = {};
        const npmDepsSet = new Set<string>();
        const registrySelectionOnly = new Map<string, string>();

        for (const { name, version, specifier } of collectRegistryComponentRequests(options.components).values()) {
            const entry = manifest?.components[name];
            const useBaseSource = options.acrossVersions || version !== undefined;
            const sourceOverride = getUpdateRegistrySource(entry, options.registryOverride, useBaseSource);
            const snapshot = options.registrySnapshots?.get(specifier) ?? await this.context.registry.fetchItemWithMeta(specifier, {
                sourceOverride,
                useCache: options.useCache !== false,
            });
            const { item, source } = snapshot;
            const keepPin = !useBaseSource && !options.registryOverride && entry?.registrySource === source;
            const selectedVersion = snapshot.version ?? (keepPin && entry?.registryBaseSource ? entry.version : undefined);
            const baseSource = snapshot.baseSource ?? (keepPin ? entry?.registryBaseSource : undefined);

            remoteItems.push(item);
            registrySources[item.name] = source;
            if (selectedVersion) versionByName.set(item.name, selectedVersion);
            if (baseSource) registryBaseSources[item.name] = baseSource;
            const selectionOnly = entry !== undefined && useBaseSource && isRegistrySelectionOnlyUpdate(entry, snapshot);
            if (selectionOnly) registrySelectionOnly.set(item.name, entry.installedAt);
            for (const dep of item.dependencies) {
                if (!selectionOnly || !entry.dependencies.includes(dep)) npmDepsSet.add(dep);
            }
        }

        const conflictStrategy = options.conflictStrategy ?? 'markers';
        const mergeExecutor = new MergeExecutor({ fs: this.context.fs });
        const files: MutationPlanFile[] = [];
        const baselineRecoveries: BaselineRecovery[] = [];
        const observedFiles = new Map<string, string | undefined>();
        const fileOwnershipUpdates = new Set<string>();
        const updatingItems = remoteItems.filter(item => !registrySelectionOnly.has(item.name));
        const updatingNames = new Set(updatingItems.map(item => item.name));
        const installedIdentities = new Map(remoteItems.map(item => [item.name, getInstalledComponentIdentity(manifest?.components[item.name])]));
        const retainedPaths = collectInstalledFilePaths(this.context, manifest, updatingNames);
        const projectedByComponent = new Map(await Promise.all(updatingItems.map(async item =>
            [item.name, await projectRegistryFiles(this.context, item.files)] as const
        )));
        const protectedRetirements = new Set<string>();
        for (const [name, projected] of projectedByComponent) {
            const projectedPaths = new Set(projected.map(file => file.absolutePath));
            for (const absolutePath of projectedPaths) retainedPaths.add(absolutePath);
            const previous = manifest?.components[name];
            if (previous && (
                previous.files.length !== projectedPaths.size ||
                previous.files.some(filePath => !projectedPaths.has(resolveInstalledFile(this.context, filePath)))
            )) {
                fileOwnershipUpdates.add(name);
            }
        }

        for (const item of updatingItems) {
            if (options.overwrite) {
                for (const { absolutePath, content } of projectedByComponent.get(item.name) ?? []) {
                    files.push({
                        componentName: item.name,
                        filePath: absolutePath,
                        action: 'overwrite',
                        sourceContent: content,
                        hasConflicts: false,
                    });
                }
            } else {
                const mergePlan = await mergeExecutor.plan(this.context, item.name, item, {
                    conflictStrategy,
                    registrySource: registrySources[item.name] ?? options.registryOverride,
                    useCache: options.useCache,
                    installedManifest: manifest,
                }, retainedPaths);
                for (const [name, identity] of mergePlan.installedIdentities ?? []) installedIdentities.set(name, identity);
                if (mergePlan.baselineRecovery) baselineRecoveries.push(mergePlan.baselineRecovery);
                recordMergeFileObservations(this.context, observedFiles, mergePlan.observedFiles);

                for (const fileResult of mergePlan.files) {
                    const absPath = path.resolve(this.context.cwd, fileResult.filePath);
                    if (fileResult.status === 'delete-skipped') protectedRetirements.add(absPath);
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
        const deletions = new Map(files.filter(file => file.action === 'delete').map(file => [file.filePath, file.componentName]));
        if (deletions.size > 0) {
            const finalSources = new Map<string, PlannedComponentSource>();
            const sourcePaths = new Map<string, string>();
            for (const [name, projected] of projectedByComponent) {
                for (const file of projected) sourcePaths.set(file.absolutePath, name);
                for (const recorded of manifest?.components[name]?.files ?? []) {
                    sourcePaths.set(resolveInstalledFile(this.context, recorded), name);
                }
            }
            for (const file of files) {
                sourcePaths.set(file.filePath, file.componentName);
                if (file.action !== 'skip' && file.action !== 'delete') {
                    finalSources.set(file.filePath, {
                        componentName: file.componentName,
                        content: file.mergedContent ?? file.sourceContent,
                    });
                }
            }
            for (const [filePath, componentName] of sourcePaths) {
                if (deletions.has(filePath) && !protectedRetirements.has(filePath)) continue;
                if (!finalSources.has(filePath) && await this.context.isSafePath(filePath) && await this.context.fs.pathExists(filePath)) {
                    const content = await this.context.fs.readFile(filePath, 'utf-8');
                    finalSources.set(filePath, { componentName, content });
                }
            }
            const candidates = [...deletions.keys()].filter(file => !protectedRetirements.has(file));
            const referenced = await findFilesReferencedByInstalledComponents(
                this.context, manifest, candidates, updatingNames, finalSources,
            );
            for (const filePath of referenced) protectedRetirements.add(filePath);
        }
        for (const file of files) {
            if (file.action !== 'delete') continue;
            if (protectedRetirements.has(file.filePath)) file.action = 'skip';
            else protectedRetirements.add(file.filePath);
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
            registryBaseSources,
            registrySelectionOnly,
            fileOwnershipUpdates,
            baselineRecoveries,
            installedIdentities,
            observedFiles,
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
        const baselinesByComponent = new Map<string, Record<string, string>>();
        const conflictsMap = new Map<string, string[]>();
        const registrySelections: RegistrySelectionUpdate[] = [];
        const registrySelectionFor = (item: RegistryItem) => ({
            item,
            registrySource: plan.registrySources[item.name] ?? DEFAULT_REGISTRY_URL,
            registryBaseSource: plan.registryBaseSources?.[item.name],
            version: plan.versionByName.get(item.name) ?? 'latest',
        });
        let manifestUpdated: boolean = false;

        try {
            await transaction.lockProjectWrites();
            const previousManifest = await readManifest(this.context.cwd, this.context.fs);
            for (const [name, identity] of plan.installedIdentities ?? []) {
                assertInstalledComponentIdentity(previousManifest, name, identity);
            }
            await assertMergeFilesUnchanged(this.context, plan.observedFiles);
            const updatedNames = new Set(plan.items.filter(item => !plan.registrySelectionOnly?.has(item.name)).map(item => item.name));
            const retainedPaths = collectInstalledFilePaths(this.context, previousManifest, updatedNames);
            if (deletedFiles > 0) {
                const candidates: string[] = [];
                const plannedSources = new Map<string, PlannedComponentSource>();
                for (const file of plan.files) {
                    if (file.action === 'delete') {
                        if (!retainedPaths.has(file.filePath)) candidates.push(file.filePath);
                    } else if (file.action !== 'skip') {
                        plannedSources.set(file.filePath, {
                            componentName: file.componentName,
                            content: file.mergedContent ?? file.sourceContent,
                        });
                    }
                }
                const referenced = await findFilesReferencedByInstalledComponents(
                    this.context, previousManifest, candidates, new Set(), plannedSources,
                );
                for (const file of referenced) retainedPaths.add(file);
            }
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

                const installedAt = plan.registrySelectionOnly?.get(item.name);
                if (installedAt !== undefined) {
                    registrySelections.push({ ...registrySelectionFor(item), installedAt });
                    succeeded.push(item.name);
                    continue;
                }

                const itemFiles = plan.files.filter(f => f.componentName === item.name);
                const previousEntry = previousManifest?.components[item.name];
                const projectedFiles = await projectRegistryFiles(this.context, item.files);

                const hasFileMutations = itemFiles.some(file => file.action !== 'skip');
                const adoptExistingFiles = !previousEntry && projectedFiles.length > 0 && !hasFileMutations
                    && (await Promise.all(projectedFiles.map(async file =>
                        await this.context.fs.pathExists(file.absolutePath) &&
                        normalizeEol(await this.context.fs.readFile(file.absolutePath, 'utf-8')) === normalizeEol(file.content)
                    ))).every(Boolean);
                if (!hasFileMutations && !adoptExistingFiles && !plan.fileOwnershipUpdates?.has(item.name)) {
                    skipped.push(item.name);
                    continue;
                }

                for (const file of itemFiles) {
                    if (file.action === 'skip') {
                        continue;
                    }

                    if (file.action === 'delete') {
                        if (retainedPaths.has(file.filePath)) {
                            deletedFiles--;
                            skippedFiles++;
                            continue;
                        }
                        await this.context.assertSafePath(file.filePath);
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

                succeeded.push(item.name);

                const installedPaths: string[] = [];
                const componentBaselines: Record<string, string> = {};
                const currentBaselinePaths = new Set<string>();
                for (const { absolutePath, relativePath, content } of projectedFiles) {
                    const baselineRelPath = getBaselineRelativePath(item.name, relativePath);
                    await transaction.writeFile(path.resolve(this.context.cwd, baselineRelPath), content);
                    installedPaths.push(absolutePath);
                    componentBaselines[relativePath] = baselineRelPath;
                    currentBaselinePaths.add(baselineRelPath);
                }

                const previousBaselinePaths = new Set([
                    ...Object.values(previousEntry?.baselines ?? {}),
                    ...(previousEntry?.files ?? []).map(filePath =>
                        getBaselineRelativePath(item.name, path.posix.basename(filePath.replace(/\\/g, '/')))
                    ),
                ]);
                for (const baselineRelPath of previousBaselinePaths) {
                    if (!currentBaselinePaths.has(baselineRelPath)) {
                        await transaction.remove(path.resolve(this.context.cwd, baselineRelPath));
                    }
                }

                filesByComponent.set(item.name, installedPaths);
                baselinesByComponent.set(item.name, componentBaselines);
            }

            if (plan.updateSnippets && filesByComponent.size > 0) {
                await mergeSnippetsFile(this.context.cwd, [...filesByComponent.keys()], this.context.fs, transaction);
            }

            const baselineRecoveries = plan.baselineRecoveries?.filter(recovery => !filesByComponent.has(recovery.componentName));
            if (succeeded.length > 0 || baselineRecoveries?.length) {
                if (filesByComponent.size > 0) {
                    await ensureGitattributes(this.context.cwd, this.context.fs, transaction);
                }

                const manifestEntries = await Promise.all(
                    plan.items
                        .filter(item => filesByComponent.has(item.name))
                        .map(async item => {
                            const compFiles = filesByComponent.get(item.name) ?? [];
                            const allInstalledFilesExist = compFiles.length > 0
                                && (await Promise.all(compFiles.map(filePath => this.context.fs.pathExists(filePath)))).every(Boolean);
                            const installedContentHash = allInstalledFilesExist
                                ? await computeInstalledContentHash(compFiles, this.context.fs)
                                : undefined;

                            return {
                                ...registrySelectionFor(item),
                                files: compFiles,
                                installedContentHash,
                                baselines: baselinesByComponent.get(item.name),
                            };
                        })
                );

                await updateInstalledComponents(this.context.cwd, manifestEntries, {
                    transaction,
                    registrySelections,
                    baselineRecoveries,
                }, this.context.fs);
                manifestUpdated = true;
            }

        } catch (error: unknown) {
            const errorMessage: string = error instanceof Error ? error.message : String(error);
            let rollbackFailures: string[] = [];
            let rollbackErrorMessage: string | undefined;
            try {
                rollbackFailures = await transaction.rollback();
            } catch (rollbackError: unknown) {
                rollbackErrorMessage = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
            }

            const rollbackDetails: string = rollbackFailures.length > 0
                ? `rollback was incomplete; inspect paths with rollback failures: ${rollbackFailures.join(', ')}`
                : rollbackErrorMessage
                    ? `rollback did not complete: ${rollbackErrorMessage}; inspect changed component files: ${plan.files.map((file: MutationPlanFile): string => file.filePath).join(', ')}`
                    : 'rollback completed';
            const code: CliError['code'] | undefined = error instanceof CliError ? error.code : undefined;
            const exitCode: number | undefined = error instanceof CliError ? error.exitCode : undefined;
            throw new CliError(
                `Component mutation failed; ${rollbackDetails}. Original error: ${errorMessage}`,
                { code, exitCode, cause: error }
            );
        }

        try {
            await transaction.commit();
        } catch (error: unknown) {
            const errorMessage: string = error instanceof Error ? error.message : String(error);
            throw new CliError(`Component files were committed, but transaction backup cleanup failed: ${errorMessage}`, {
                code: error instanceof CliError ? error.code : undefined,
                exitCode: error instanceof CliError ? error.exitCode : undefined,
                cause: error,
            });
        }

        let dependenciesResult: DependencyInstallResult = {
            status: 'skipped',
            packages: plan.npmDependencies,
        };

        if (plan.npmDependencies.length > 0 && !options.skipDependencies) {
            let topology: Awaited<ReturnType<typeof WorkspaceTopologyEngine.resolveTopology>> | undefined;
            let targetPackage: string | undefined = options.targetPackageName;
            try {
                options.callbacks?.onDependencyStart?.(plan.npmDependencies);
                topology = await WorkspaceTopologyEngine.resolveTopology(this.context.cwd, this.context.fs);

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
                        // 包名不可用时，在工作区层级安装依赖。
                    }
                }

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
            } catch (dependencyError: unknown) {
                const manualCommand: string | undefined = topology
                    ? PackageManagerAdapter.getManualInstallCommand(
                        topology.packageManager,
                        plan.npmDependencies,
                        targetPackage,
                        topology.isMonorepo
                    )
                    : undefined;

                dependenciesResult = {
                    status: 'failed',
                    packages: plan.npmDependencies,
                    ...(manualCommand ? { manualCommand } : {}),
                    error: dependencyError instanceof Error ? dependencyError.message : String(dependencyError),
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
    }
}
