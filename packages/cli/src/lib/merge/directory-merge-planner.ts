import path from 'path';
import type { FileSystemAdapter } from 'brutx-shared-vue/fs';
import type { ProjectContext } from '../project-context.js';
import type { RegistryItem } from '../types.js';
import { resolveImportAlias } from '../project.js';
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
        options: ThreeWayMergeOptions = {}
    ): Promise<ComponentMergePlan> {
        const fs = this.fsAdapter ?? context.fs;
        const config = context.config;

        interface TargetFileInfo {
            relPath: string;
            absPath: string;
            remoteRawContent: string;
            remoteProjectedContent: string;
            baseName: string;
        }

        const remoteFilesMap = new Map<string, TargetFileInfo>();
        const baseNameToRelPath = new Map<string, string>();

        if (remoteItem.files && Array.isArray(remoteItem.files)) {
            for (const file of remoteItem.files) {
                const absPath = await context.resolveTargetPath(file.path);
                const relPath = path.relative(context.cwd, absPath).split(path.sep).join('/');
                const baseName = file.path.replace(/\\/g, '/').split('/').pop()!;
                const remoteRawContent = file.content ?? '';
                const remoteProjectedContent = config
                    ? resolveImportAlias(remoteRawContent, config)
                    : remoteRawContent;

                const fileInfo: TargetFileInfo = {
                    relPath,
                    absPath,
                    remoteRawContent,
                    remoteProjectedContent,
                    baseName,
                };
                remoteFilesMap.set(relPath, fileInfo);
                if (!baseNameToRelPath.has(baseName)) {
                    baseNameToRelPath.set(baseName, relPath);
                }
            }
        }

        // 收集所有相关文件的 POSIX 相对路径
        const allRelPaths = new Set<string>();
        for (const relPath of remoteFilesMap.keys()) {
            allRelPaths.add(relPath);
        }

        // 尝试从 baseline 获取文件路径
        for (const [key] of baseline.files) {
            if (key.includes('/')) {
                allRelPaths.add(key);
            } else if (baseNameToRelPath.has(key)) {
                allRelPaths.add(baseNameToRelPath.get(key)!);
            }
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
        const isFallback = baseline.status === 'fallback-diff';

        for (const relPath of Array.from(allRelPaths).sort()) {
            const absPath = path.resolve(context.cwd, relPath);
            const localExists = await fs.pathExists(absPath);
            const localContent = localExists ? await fs.readFile(absPath) : undefined;
            const remoteInfo = remoteFilesMap.get(relPath);
            const baseName = relPath.split('/').pop()!;
            const baseContent = baseline.files.get(relPath) ?? baseline.files.get(baseName);

            const detectedEol = localContent ? detectEol(localContent) : '\n';

            // 1. Base 缺失时的 2-Way 优雅降级
            if (isFallback) {
                if (!localExists && remoteInfo) {
                    fileResults.push({
                        filePath: relPath,
                        status: 'added',
                        action: 'write',
                        content: remoteInfo.remoteProjectedContent,
                        hasConflicts: false,
                        conflictCount: 0,
                        detectedEol,
                    });
                } else if (localExists && remoteInfo) {
                    const normLocal = normalizeEol(localContent!);
                    const normRemote = normalizeEol(remoteInfo.remoteProjectedContent);
                    if (normLocal === normRemote) {
                        fileResults.push({
                            filePath: relPath,
                            status: 'unchanged',
                            action: 'skip',
                            content: localContent,
                            hasConflicts: false,
                            conflictCount: 0,
                            detectedEol,
                        });
                    } else {
                        fileResults.push({
                            filePath: relPath,
                            status: 'fallback-diff',
                            action: 'write',
                            content: restoreEol(remoteInfo.remoteProjectedContent, detectedEol),
                            hasConflicts: false,
                            conflictCount: 0,
                            detectedEol,
                        });
                    }
                } else if (localExists && !remoteInfo) {
                    fileResults.push({
                        filePath: relPath,
                        status: 'delete-skipped',
                        action: 'skip',
                        content: localContent,
                        hasConflicts: false,
                        conflictCount: 0,
                        detectedEol,
                    });
                }
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
                    remoteInfo.remoteProjectedContent,
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
                    content: remoteInfo.remoteProjectedContent,
                    hasConflicts: false,
                    conflictCount: 0,
                    detectedEol,
                });
            } else if (hasBase && hasLocal && !hasRemote) {
                // Case 3: 官方弃用文件
                const isLocalModified = normalizeEol(localContent) !== normalizeEol(baseContent);
                if (isLocalModified) {
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
                const isRemoteUpdated = normalizeEol(remoteInfo.remoteProjectedContent) !== normalizeEol(baseContent);
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
                    remoteInfo.remoteProjectedContent,
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
        };
    }
}
