import path from 'path';
import type { FileSystemAdapter } from '../fs/index.js';
import { CliError } from '../error.js';
import type { ProjectContext } from '../project-context.js';
import type { FileTransaction } from '../file-transaction.js';
import type { BrutxManifest, InstalledComponentManifest, RegistryItem } from '../types.js';
import { collectInstalledFilePaths, projectRegistryFiles, resolveInstalledFile } from '../component-files.js';
import {
    assertInstalledComponentIdentity,
    getInstalledComponentIdentity,
    readManifest,
    updateInstalledComponents,
} from '../manifest.js';
import { BaselineProvider, type RegistryItemFetcher } from './baseline-provider.js';
import { DirectoryMergePlanner } from './directory-merge-planner.js';
import type { ComponentMergePlan, MergeExecutionOptions } from './types.js';
import { normalizeEol } from './whitespace-normalizer.js';
import { withRegistryOperationCache, withRegistryPlanningCache } from '../storage/cache-storage.js';
import { assertMergeFilesUnchanged } from './file-observations.js';

export interface ExecuteComponentMergeOptions extends MergeExecutionOptions {
    transaction?: FileTransaction;
    registrySource?: string;
    useCache?: boolean;
    installedManifest?: BrutxManifest | null;
}

export interface ComponentMergeExecutionResult {
    plan: ComponentMergePlan;
    filesWritten: string[];
    filesDeleted: string[];
}

interface AppliedBaselineOwner {
    entry: InstalledComponentManifest;
    readBaseline: (relativePath: string) => Promise<string | undefined>;
}

export class MergeExecutor {
    private readonly baselineProvider: BaselineProvider;
    private readonly planner: DirectoryMergePlanner;

    constructor(options: { fs?: FileSystemAdapter; itemFetcher?: RegistryItemFetcher } = {}) {
        this.baselineProvider = new BaselineProvider(options);
        this.planner = new DirectoryMergePlanner(options);
    }

    async plan(
        context: ProjectContext,
        componentName: string,
        remoteItem: RegistryItem,
        options: ExecuteComponentMergeOptions = {},
        retainedPaths?: ReadonlySet<string>,
    ): Promise<ComponentMergePlan> {
        return withRegistryPlanningCache(() => this.planComponent(context, componentName, remoteItem, options, retainedPaths));
    }

    private async planComponent(
        context: ProjectContext,
        componentName: string,
        remoteItem: RegistryItem,
        options: ExecuteComponentMergeOptions,
        retainedPaths?: ReadonlySet<string>,
    ): Promise<ComponentMergePlan> {
        const installedManifest = options.installedManifest === undefined
            ? await readManifest(context.cwd, context.fs).catch(() => null)
            : options.installedManifest;
        const baselineOptions = {
            useCache: options.useCache,
            registrySource: options.registrySource,
            installedManifest,
        };
        const baseline = await this.baselineProvider.getComponentBaseline(context, componentName, baselineOptions);
        const ownedFiles = retainedPaths ?? collectInstalledFilePaths(context, installedManifest, new Set([componentName]));
        const projectedFiles = await projectRegistryFiles(context, remoteItem.files ?? []);
        const remoteContents = new Map(projectedFiles.map(file => [file.relativePath, file.content]));
        const installedEntry = installedManifest?.components[componentName];
        const pendingPaths = new Set(installedEntry?.pendingFiles?.map(file => this.installedPath(context, file)));
        const installedAt = Date.parse(installedEntry?.installedAt ?? '');
        const ownersByPath = new Map<string, string[]>();
        const appliedOwnersByPath = new Map<string, AppliedBaselineOwner[]>();
        const sharedOwners = new Set<string>();
        for (const [owner, entry] of Object.entries(installedManifest?.components ?? {})) {
            if (owner === componentName) continue;
            // 只有晚于本次部分安装且已应用该文件的归属，才能证明磁盘内容来自另一个安装。
            const installedLater = pendingPaths.size > 0 && Date.parse(entry.installedAt) > installedAt;
            const ownerPending = new Set(installedLater ? entry.pendingFiles?.map(file => this.installedPath(context, file)) : undefined);
            const ownerPaths = new Set(entry.files.map(file => this.installedPath(context, file)));
            let appliedOwner: AppliedBaselineOwner | undefined;
            for (const relativePath of ownerPaths) {
                if (!remoteContents.has(relativePath)) continue;
                if (installedLater && pendingPaths.has(relativePath) && !ownerPending.has(relativePath)) {
                    appliedOwner ??= { entry, readBaseline: this.baselineProvider.localBaselines(context, entry, ownerPaths).read };
                    const owners = appliedOwnersByPath.get(relativePath) ?? [];
                    owners.push(appliedOwner);
                    appliedOwnersByPath.set(relativePath, owners);
                }
                if (baseline.projectPaths?.has(relativePath)) continue;
                const owners = ownersByPath.get(relativePath) ?? [];
                owners.push(owner);
                ownersByPath.set(relativePath, owners);
                sharedOwners.add(owner);
            }
        }

        const ownerBaselines = new Map(await Promise.all([...sharedOwners].map(async owner =>
            [owner, await this.baselineProvider.getComponentBaseline(context, owner, baselineOptions)] as const
        )));
        const sharedBaselines = new Map<string, string>();
        const installedIdentities = new Map([
            [componentName, getInstalledComponentIdentity(installedEntry)],
        ]);
        for (const [relativePath, owners] of ownersByPath) {
            const remoteContent = normalizeEol(remoteContents.get(relativePath)!);
            const baselines = owners.map(owner => ownerBaselines.get(owner)?.files.get(relativePath));
            const [sharedBase] = baselines;
            if (sharedBase === undefined || !baselines.every(base => base !== undefined && normalizeEol(base) === remoteContent)) {
                continue;
            }
            sharedBaselines.set(relativePath, sharedBase);
            for (const owner of owners) {
                installedIdentities.set(owner, getInstalledComponentIdentity(installedManifest?.components[owner]));
            }
        }

        const plan = await this.planner.planComponentMerge(context, componentName, remoteItem, baseline, {
            conflictStrategy: options.conflictStrategy,
        }, {
            retainedPaths: ownedFiles,
            sharedBaselines,
            projectedFiles,
            getAppliedSharedBaseline: appliedOwnersByPath.size === 0 ? undefined : async (relativePath, normalizedLocalContent) => {
                for (const { entry, readBaseline } of appliedOwnersByPath.get(relativePath) ?? []) {
                    const content = await readBaseline(relativePath);
                    if (content === undefined || normalizeEol(content) !== normalizedLocalContent) continue;
                    installedIdentities.set(entry.name, getInstalledComponentIdentity(entry));
                    return content;
                }
            },
        });
        return { ...plan, installedIdentities };
    }

    private installedPath(context: ProjectContext, file: string): string {
        return context.toRelativePosixPath(resolveInstalledFile(context, file));
    }

    async planAndExecute(
        context: ProjectContext,
        componentName: string,
        remoteItem: RegistryItem,
        options: ExecuteComponentMergeOptions = {}
    ): Promise<ComponentMergeExecutionResult> {
        const plan = await withRegistryOperationCache(options.dryRun === true, () =>
            this.plan(context, componentName, remoteItem, options),
        );

        const isCi = options.isCi ?? (process.env.CI === 'true' || !process.stdout.isTTY);
        if (isCi && plan.hasConflicts && options.conflictStrategy !== 'ours' && options.conflictStrategy !== 'theirs') {
            const conflictedFiles = plan.files.filter(f => f.status === 'conflict' || f.status === 'restore-prompt');
            throw new CliError(
                `[CI Blocked] Unresolved merge conflicts detected in component "${componentName}":\n` +
                conflictedFiles.map(f => `  - ${f.filePath}`).join('\n') +
                `\nResolve conflicts locally or run with --ours / --theirs.`,
                { code: 'MERGE_CONFLICT_CI_BLOCKED', exitCode: 1 }
            );
        }

        if (options.dryRun) {
            return {
                plan,
                filesWritten: plan.files.filter(f => f.action === 'write' && f.content !== undefined).map(f => path.resolve(context.cwd, f.filePath)),
                filesDeleted: plan.files.filter(f => f.action === 'delete').map(f => path.resolve(context.cwd, f.filePath)),
            };
        }

        const transaction = options.transaction ?? context.createTransaction();
        const filesWritten: string[] = [];
        const filesDeleted: string[] = [];

        try {
            await transaction.lockProjectWrites();
            const currentManifest = await readManifest(context.cwd, context.fs);
            for (const [name, expected] of plan.installedIdentities ?? []) {
                assertInstalledComponentIdentity(currentManifest, name, expected);
            }
            await assertMergeFilesUnchanged(context, plan.observedFiles);
            if (plan.baselineRecovery) {
                await updateInstalledComponents(context.cwd, [], {
                    transaction,
                    baselineRecoveries: [plan.baselineRecovery],
                }, context.fs);
            }
            for (const fileResult of plan.files) {
                const absPath = path.resolve(context.cwd, fileResult.filePath);
                if (fileResult.action === 'write' && fileResult.content !== undefined) {
                    await transaction.writeFile(absPath, fileResult.content);
                    filesWritten.push(absPath);
                } else if (fileResult.action === 'delete') {
                    await context.assertSafePath(absPath);
                    await transaction.remove(absPath);
                    filesDeleted.push(absPath);
                }
            }
        } catch (error) {
            if (options.transaction) throw error;
            const rollbackFailures = await transaction.rollback();
            if (rollbackFailures.length === 0) throw error;
            throw new Error(`Rollback failed for: ${rollbackFailures.join(', ')}`, { cause: error });
        }
        if (!options.transaction) await transaction.commit();

        return {
            plan,
            filesWritten,
            filesDeleted,
        };
    }
}
