import path from 'path';
import type { FileSystemAdapter } from 'brutx-shared-vue/fs';
import { CliError } from '../error.js';
import type { ProjectContext } from '../project-context.js';
import type { FileTransaction } from '../file-transaction.js';
import type { RegistryItem } from '../types.js';
import { BaselineProvider, type RegistryItemFetcher } from './baseline-provider.js';
import { DirectoryMergePlanner } from './directory-merge-planner.js';
import type { ComponentMergePlan, MergeExecutionOptions } from './types.js';

export interface ExecuteComponentMergeOptions extends MergeExecutionOptions {
    transaction?: FileTransaction;
    registrySource?: string;
    useCache?: boolean;
}

export interface ComponentMergeExecutionResult {
    plan: ComponentMergePlan;
    filesWritten: string[];
    filesDeleted: string[];
}

export class MergeExecutor {
    private readonly baselineProvider: BaselineProvider;
    private readonly planner: DirectoryMergePlanner;

    constructor(options: { fs?: FileSystemAdapter; itemFetcher?: RegistryItemFetcher } = {}) {
        this.baselineProvider = new BaselineProvider(options);
        this.planner = new DirectoryMergePlanner(options);
    }

    async planAndExecute(
        context: ProjectContext,
        componentName: string,
        remoteItem: RegistryItem,
        options: ExecuteComponentMergeOptions = {}
    ): Promise<ComponentMergeExecutionResult> {
        const baseline = await this.baselineProvider.getComponentBaseline(context, componentName, {
            useCache: options.useCache,
            registrySource: options.registrySource,
        });

        const plan = await this.planner.planComponentMerge(context, componentName, remoteItem, baseline, {
            conflictStrategy: options.conflictStrategy,
        });

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

        for (const fileResult of plan.files) {
            const absPath = path.resolve(context.cwd, fileResult.filePath);
            if (fileResult.action === 'write' && fileResult.content !== undefined) {
                await transaction.writeFile(absPath, fileResult.content);
                filesWritten.push(absPath);
            } else if (fileResult.action === 'delete') {
                context.assertSafePath(absPath);
                await transaction.remove(absPath);
                filesDeleted.push(absPath);
            }
        }

        return {
            plan,
            filesWritten,
            filesDeleted,
        };
    }
}
