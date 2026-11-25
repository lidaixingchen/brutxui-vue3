import type { ProjectContext } from '../project-context.js';

export function recordMergeFileObservations(
    context: ProjectContext,
    observations: Map<string, string | undefined>,
    files?: ReadonlyMap<string, string | undefined>,
): void {
    for (const [filePath, content] of files ?? []) {
        if (observations.has(filePath) && observations.get(filePath) !== content) {
            throw mergeFileChanged(context, filePath);
        }
        observations.set(filePath, content);
    }
}

export async function assertMergeFilesUnchanged(
    context: ProjectContext,
    observations?: ReadonlyMap<string, string | undefined>,
): Promise<void> {
    for (const [filePath, expected] of observations ?? []) {
        const exists = await context.fs.pathExists(filePath);
        if (exists !== (expected !== undefined) || (exists && await context.fs.readFile(filePath, 'utf-8') !== expected)) {
            throw mergeFileChanged(context, filePath);
        }
    }
}

function mergeFileChanged(context: ProjectContext, filePath: string): Error {
    return new Error(`File "${context.toRelativePosixPath(filePath)}" changed during merge planning. Run the merge again.`);
}
