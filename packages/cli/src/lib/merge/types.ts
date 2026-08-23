export type MergeFileStatus =
    | 'unchanged'
    | 'merged'
    | 'conflict'
    | 'added'
    | 'deleted'
    | 'delete-skipped'
    | 'restore-prompt'
    | 'fallback-diff';

export type MergeAction = 'write' | 'delete' | 'skip';

export type ConflictStrategy = 'markers' | 'ours' | 'theirs';

export interface SingleFileMergeResult {
    filePath: string;
    status: MergeFileStatus;
    action: MergeAction;
    content?: string;
    hasConflicts: boolean;
    conflictCount: number;
    baseHash?: string;
    localHash?: string;
    remoteHash?: string;
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
