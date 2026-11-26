import path from 'path';
import type { FileSystemAdapter } from '../fs/index.js';
import type { ProjectContext } from '../project-context.js';
import type { RegistryItem } from '../types.js';
import { projectRegistryFiles } from '../component-files.js';
import type { ComponentBaselineResult } from './baseline-provider.js';
import { threeWayMerge } from './three-way-merge-engine.js';
import type {
    ComponentMergePlan,
    SingleFileMergeResult,
    ThreeWayMergeOptions,
} from './types.js';
import { detectEol, normalizeEol, restoreEol } from './whitespace-normalizer.js';

export interface DirectoryMergePlannerOptions {
    fs?: FileSystemAdapter;
}

export class DirectoryMergePlanner {
    private readonly fsAdapter?: FileSystemAdapter;

    constructor(options: DirectoryMergePlannerOptions = {}) {
        this.fsAdapter = options.fs;
    }

    async planComponentMerge(
        context: ProjectContext,
        componentName: string,
        remoteItem: RegistryItem,
        baseline: ComponentBaselineResult,
        options: ThreeWayMergeOptions = {},
        {
            retainedPaths = new Set(),
            sharedBaselines = new Map(),
            projectedFiles,
            getAppliedSharedBaseline,
        }: {
            retainedPaths?: ReadonlySet<string>;
            sharedBaselines?: ReadonlyMap<string, string>;
            projectedFiles?: Awaited<ReturnType<typeof projectRegistryFiles>>;
            getAppliedSharedBaseline?: (relativePath: string, normalizedLocalContent: string) => Promise<string | undefined>;
        } = {},
    ): Promise<ComponentMergePlan> {
        const fs = this.fsAdapter ?? context.fs;
        const remoteFiles = projectedFiles ?? await projectRegistryFiles(context, remoteItem.files ?? []);
        const remoteFilesMap = new Map(remoteFiles.map(file => [file.relativePath, file]));
        const baseNameToRelPath = new Map<string, string>();
        for (const { relativePath } of remoteFiles) {
            const baseName = path.posix.basename(relativePath);
            if (!baseNameToRelPath.has(baseName)) baseNameToRelPath.set(baseName, relativePath);
        }

        // 收集所有相关文件的 POSIX 相对路径
        const allRelPaths = new Set(remoteFilesMap.keys());

        for (const key of baseline.projectPaths ?? baseline.files.keys()) {
            const relPath = baseline.projectPaths || key.includes('/') ? key : baseNameToRelPath.get(key);
            if (relPath) allRelPaths.add(relPath);
        }

        // 检查磁盘上现有组件目录
        try {
            const componentDir = await context.resolveComponentDir(componentName);
            if (await fs.pathExists(componentDir)) {
                const entries = await fs.readdir(componentDir);
                for (const entry of entries) {
                    const entryAbs = path.join(componentDir, typeof entry === 'string' ? entry : (entry as { name: string }).name);
                    const isFile = (await fs.stat(entryAbs)).isFile();
                    if (isFile) {
                        const rel = path.relative(context.cwd, entryAbs).split(path.sep).join('/');
                        allRelPaths.add(rel);
                    }
                }
            }
        } catch {
            // 目录不存在则继续
        }

        const fileResults: SingleFileMergeResult[] = [];
        const observedFiles = new Map<string, string | undefined>();
        const isFallback = baseline.status === 'fallback-diff';

        for (const relPath of Array.from(allRelPaths).sort()) {
            const absPath = path.resolve(context.cwd, relPath);
            const localExists = await fs.pathExists(absPath);
            const localContent = localExists ? await fs.readFile(absPath) : undefined;
            const remoteInfo = remoteFilesMap.get(relPath);
            const baseName = path.posix.basename(relPath);
            const installedBase = baseline.projectPaths
                ? baseline.projectPaths.has(relPath) ? baseline.files.get(relPath) : undefined
                : baseline.files.get(relPath) ?? baseline.files.get(baseName);
            const recordedBase = installedBase ?? sharedBaselines.get(relPath);
            let appliedSharedBase: string | undefined;
            if (getAppliedSharedBaseline && remoteInfo && localContent !== undefined) {
                const normalizedLocal = normalizeEol(localContent);
                if ((recordedBase === undefined || normalizeEol(recordedBase) !== normalizedLocal)
                    && normalizeEol(remoteInfo.content) !== normalizedLocal) {
                    appliedSharedBase = await getAppliedSharedBaseline(relPath, normalizedLocal);
                }
            }
            const baseContent = appliedSharedBase ?? recordedBase;
            if (remoteInfo || baseContent !== undefined || baseline.projectPaths?.has(relPath)) {
                observedFiles.set(absPath, localContent);
            }
            const detectedEol = localContent ? detectEol(localContent) : '\n';

            const lacksInstalledBaseline = baseContent === undefined && isFallback
                && (baseline.projectPaths?.has(relPath) ?? true);
            if (lacksInstalledBaseline && localContent !== undefined) {
                const sameContent = remoteInfo && normalizeEol(localContent) === normalizeEol(remoteInfo.content);
                const overwrite = remoteInfo && !sameContent && options.conflictStrategy === 'theirs';
                fileResults.push({
                    filePath: relPath,
                    status: remoteInfo ? sameContent ? 'unchanged' : 'fallback-diff' : 'delete-skipped',
                    action: overwrite ? 'write' : 'skip',
                    content: overwrite ? restoreEol(remoteInfo.content, detectedEol) : localContent,
                    hasConflicts: false,
                    conflictCount: 0,
                    detectedEol,
                });
                continue;
            }

            // 2. Base 存在时的标准四象限 3-Way Merge 拓扑判定
            const hasBase = baseContent !== undefined;
            const hasLocal = localExists && localContent !== undefined;
            const hasRemote = remoteInfo !== undefined;

            if (hasBase && hasLocal && hasRemote) {
                // Case 1: 三方均存在 -> 进入单文件 3-Way Merge
                const mergeRes = threeWayMerge(
                    baseContent,
                    localContent,
                    remoteInfo.content,
                    {
                        filePath: relPath,
                        conflictStrategy: options.conflictStrategy,
                    }
                );
                fileResults.push(mergeRes);
            } else if (!hasBase && !hasLocal && hasRemote) {
                // Case 2: 官方新增文件 -> 安全写入
                fileResults.push({
                    filePath: relPath,
                    status: 'added',
                    action: 'write',
                    content: remoteInfo.content,
                    hasConflicts: false,
                    conflictCount: 0,
                    detectedEol,
                });
            } else if (hasBase && hasLocal && !hasRemote) {
                // Case 3: 官方弃用文件
                const isLocalModified = normalizeEol(localContent) !== normalizeEol(baseContent);
                if (isLocalModified || retainedPaths.has(absPath)) {
                    // 用户有修改 -> 冲突保留
                    fileResults.push({
                        filePath: relPath,
                        status: 'delete-skipped',
                        action: 'skip',
                        content: localContent,
                        hasConflicts: false,
                        conflictCount: 0,
                        detectedEol,
                    });
                } else {
                    // 用户未修改 -> 安全删除
                    fileResults.push({
                        filePath: relPath,
                        status: 'deleted',
                        action: 'delete',
                        content: undefined,
                        hasConflicts: false,
                        conflictCount: 0,
                        detectedEol,
                    });
                }
            } else if (hasBase && !hasLocal && hasRemote) {
                // Case 4: 用户在本地删除了该文件
                const isRemoteUpdated = normalizeEol(remoteInfo.content) !== normalizeEol(baseContent);
                if (isRemoteUpdated) {
                    // 远端有更新，用户删除了 -> 提示恢复
                    fileResults.push({
                        filePath: relPath,
                        status: 'restore-prompt',
                        action: 'skip',
                        content: undefined,
                        hasConflicts: true,
                        conflictCount: 1,
                        detectedEol,
                    });
                } else {
                    // 远端无更新，保持删除
                    fileResults.push({
                        filePath: relPath,
                        status: 'deleted',
                        action: 'skip',
                        content: undefined,
                        hasConflicts: false,
                        conflictCount: 0,
                        detectedEol,
                    });
                }
            } else if (!hasBase && hasLocal && hasRemote) {
                // Case 5: 本地自建同名文件 vs 官方新增 -> 执行合并
                const mergeRes = threeWayMerge(
                    '',
                    localContent,
                    remoteInfo.content,
                    {
                        filePath: relPath,
                        conflictStrategy: options.conflictStrategy,
                    }
                );
                fileResults.push(mergeRes);
            }
        }

        const totalFiles = fileResults.length;
        const mergedFiles = fileResults.filter(f => f.status === 'merged').length;
        const conflictedFiles = fileResults.filter(f => f.status === 'conflict' || f.status === 'restore-prompt').length;
        const addedFiles = fileResults.filter(f => f.status === 'added').length;
        const deletedFiles = fileResults.filter(f => f.status === 'deleted' && f.action === 'delete').length;
        const hasConflicts = conflictedFiles > 0;

        return {
            componentName,
            files: fileResults,
            hasConflicts,
            totalFiles,
            mergedFiles,
            conflictedFiles,
            addedFiles,
            deletedFiles,
            isFallback,
            observedFiles,
            ...(baseline.recovery ? { baselineRecovery: baseline.recovery } : {}),
        };
    }
}
