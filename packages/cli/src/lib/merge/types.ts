import type { BaselineRecovery, InstalledComponentIdentity } from '../manifest.js';

/**
 * 单文件合并处理状态
 * - `unchanged`: 本地与远端一致，无须处理
 * - `merged`: 3-Way Merge 干净合入（无冲突）
 * - `conflict`: 3-Way Merge 发生冲突（输出冲突标记或应用冲突策略）
 * - `added`: 远端新增文件，执行写入
 * - `deleted`: 远端弃用且本地未修改，安全删除
 * - `delete-skipped`: 远端弃用，但文件有本地定制、仍有其他所有者或缺少可用基线
 * - `restore-prompt`: 远端有更新但本地已主动删除，提示恢复并标记跳过
 * - `fallback-diff`: 基线不可用，默认保留本地内容
 */
export type MergeFileStatus =
    | 'unchanged'
    | 'merged'
    | 'conflict'
    | 'added'
    | 'deleted'
    | 'delete-skipped'
    | 'restore-prompt'
    | 'fallback-diff';

/** 文件事务操作动作 */
export type MergeAction = 'write' | 'delete' | 'skip';

/** 冲突解决策略 */
export type ConflictStrategy = 'markers' | 'ours' | 'theirs';

export interface SingleFileMergeResult {
    filePath: string;
    status: MergeFileStatus;
    action: MergeAction;
    content?: string;
    hasConflicts: boolean;
    conflictCount: number;
    detectedEol: '\n' | '\r\n';
}

export interface ComponentMergePlan {
    componentName: string;
    files: SingleFileMergeResult[];
    hasConflicts: boolean;
    totalFiles: number;
    mergedFiles: number;
    conflictedFiles: number;
    addedFiles: number;
    deletedFiles: number;
    isFallback: boolean;
    baselineRecovery?: BaselineRecovery;
    installedIdentities?: ReadonlyMap<string, InstalledComponentIdentity | null>;
    observedFiles?: ReadonlyMap<string, string | undefined>;
}

export interface MergeExecutionOptions {
    dryRun?: boolean;
    conflictStrategy?: ConflictStrategy;
    forceOverwrite?: boolean;
    isCi?: boolean;
}

export interface ThreeWayMergeOptions {
    filePath?: string;
    conflictStrategy?: ConflictStrategy;
    baseLabel?: string;
    localLabel?: string;
    remoteLabel?: string;
}
