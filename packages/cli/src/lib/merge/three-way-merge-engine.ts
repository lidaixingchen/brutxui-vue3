import * as Diff from 'diff';
import type { ConflictStrategy, SingleFileMergeResult, ThreeWayMergeOptions } from './types.js';
import { detectEol, normalizeEol, normalizeLineForFuzzyDiff, restoreEol } from './whitespace-normalizer.js';

const LOCAL_MARKER_START = '<<<<<<< LOCAL';
const CONFLICT_DIVIDER = '=======';
const REMOTE_MARKER_END = '>>>>>>> REMOTE';

export function areLineArraysFuzzyEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (normalizeLineForFuzzyDiff(a[i]) !== normalizeLineForFuzzyDiff(b[i])) {
            return false;
        }
    }
    return true;
}

export function compute3WayMergeLines(
    baseLines: string[],
    localLines: string[],
    remoteLines: string[],
    strategy: ConflictStrategy = 'markers'
): { mergedLines: string[]; hasConflicts: boolean; conflictCount: number } {
    // 快速短路
    if (localLines.join('\n') === remoteLines.join('\n')) {
        return { mergedLines: [...localLines], hasConflicts: false, conflictCount: 0 };
    }
    if (localLines.join('\n') === baseLines.join('\n')) {
        return { mergedLines: [...remoteLines], hasConflicts: false, conflictCount: 0 };
    }
    if (remoteLines.join('\n') === baseLines.join('\n')) {
        return { mergedLines: [...localLines], hasConflicts: false, conflictCount: 0 };
    }

    // 采用结构化 LCS 对比：以 Base 为基准分别计算 Diff(Base -> Local) 与 Diff(Base -> Remote)
    const diffLocal = Diff.diffArrays(baseLines, localLines);
    const diffRemote = Diff.diffArrays(baseLines, remoteLines);

    // 将 diff 展开为基于 Base 索引的操作流
    interface SliceChange {
        baseStart: number;
        baseCount: number;
        newLines: string[];
    }

    function extractHunks(changes: Diff.ArrayChange<string>[]): SliceChange[] {
        const hunks: SliceChange[] = [];
        let baseIndex = 0;

        let pendingRemoved: string[] = [];
        let pendingAdded: string[] = [];
        let pendingBaseStart = -1;

        function flush() {
            if (pendingRemoved.length > 0 || pendingAdded.length > 0) {
                hunks.push({
                    baseStart: pendingBaseStart,
                    baseCount: pendingRemoved.length,
                    newLines: pendingAdded,
                });
                pendingRemoved = [];
                pendingAdded = [];
                pendingBaseStart = -1;
            }
        }

        for (const part of changes) {
            if (part.added) {
                if (pendingBaseStart === -1) {
                    pendingBaseStart = baseIndex;
                }
                pendingAdded.push(...part.value);
            } else if (part.removed) {
                if (pendingBaseStart === -1) {
                    pendingBaseStart = baseIndex;
                }
                pendingRemoved.push(...part.value);
                baseIndex += part.value.length;
            } else {
                flush();
                baseIndex += part.value.length;
            }
        }
        flush();

        return hunks;
    }

    const localHunks = extractHunks(diffLocal);
    const remoteHunks = extractHunks(diffRemote);

    // 归并双向 hunks，切分为互不重叠或重叠的区域
    const resultLines: string[] = [];
    let conflictCount = 0;
    let baseCursor = 0;

    let lIdx = 0;
    let rIdx = 0;

    while (lIdx < localHunks.length || rIdx < remoteHunks.length) {
        const lHunk = localHunks[lIdx];
        const rHunk = remoteHunks[rIdx];

        if (lHunk && rHunk) {
            const lStart = lHunk.baseStart;
            const lEnd = lHunk.baseStart + lHunk.baseCount;
            const rStart = rHunk.baseStart;
            const rEnd = rHunk.baseStart + rHunk.baseCount;

            // 检查两者在 Base 范围上是否重叠或相邻（空插入在同一点时）
            const overlaps = (lStart < rEnd && rStart < lEnd) || (lStart === rStart && lHunk.baseCount === 0 && rHunk.baseCount === 0);

            if (overlaps) {
                // 重叠区域：先同步推进未改动的 Base 行
                const minStart = Math.min(lStart, rStart);
                if (baseCursor < minStart) {
                    resultLines.push(...baseLines.slice(baseCursor, minStart));
                }

                // 收集此重叠区内的所有连续重叠 hunks
                const groupBaseStart = minStart;
                let groupBaseEnd = Math.max(lEnd, rEnd);
                const currentLocalLines: string[] = [];
                const currentRemoteLines: string[] = [];

                let combinedL = lIdx;
                let combinedR = rIdx;

                // 扩展窗口直到不再与后续 hunks 交叉
                let expanded = true;
                while (expanded) {
                    expanded = false;
                    if (combinedL < localHunks.length) {
                        const curL = localHunks[combinedL];
                        if (curL.baseStart <= groupBaseEnd) {
                            groupBaseEnd = Math.max(groupBaseEnd, curL.baseStart + curL.baseCount);
                            combinedL++;
                            expanded = true;
                        }
                    }
                    if (combinedR < remoteHunks.length) {
                        const curR = remoteHunks[combinedR];
                        if (curR.baseStart <= groupBaseEnd) {
                            groupBaseEnd = Math.max(groupBaseEnd, curR.baseStart + curR.baseCount);
                            combinedR++;
                            expanded = true;
                        }
                    }
                }

                // 重构该 group 范围内 Local 和 Remote 的最终行
                // 对于 Local：
                let curBase = groupBaseStart;
                for (let i = lIdx; i < combinedL; i++) {
                    const h = localHunks[i];
                    if (curBase < h.baseStart) {
                        currentLocalLines.push(...baseLines.slice(curBase, h.baseStart));
                    }
                    currentLocalLines.push(...h.newLines);
                    curBase = h.baseStart + h.baseCount;
                }
                if (curBase < groupBaseEnd) {
                    currentLocalLines.push(...baseLines.slice(curBase, groupBaseEnd));
                }

                // 对于 Remote：
                curBase = groupBaseStart;
                for (let i = rIdx; i < combinedR; i++) {
                    const h = remoteHunks[i];
                    if (curBase < h.baseStart) {
                        currentRemoteLines.push(...baseLines.slice(curBase, h.baseStart));
                    }
                    currentRemoteLines.push(...h.newLines);
                    curBase = h.baseStart + h.baseCount;
                }
                if (curBase < groupBaseEnd) {
                    currentRemoteLines.push(...baseLines.slice(curBase, groupBaseEnd));
                }

                // 判定重叠区域：完全相同或容差相同即为 Clean Merge
                if (
                    currentLocalLines.join('\n') === currentRemoteLines.join('\n') ||
                    areLineArraysFuzzyEqual(currentLocalLines, currentRemoteLines)
                ) {
                    // 双方改动等价，采纳 Local 行
                    resultLines.push(...currentLocalLines);
                } else {
                    // 真实冲突
                    if (strategy === 'ours') {
                        resultLines.push(...currentLocalLines);
                    } else if (strategy === 'theirs') {
                        resultLines.push(...currentRemoteLines);
                    } else {
                        conflictCount++;
                        resultLines.push(LOCAL_MARKER_START);
                        resultLines.push(...currentLocalLines);
                        resultLines.push(CONFLICT_DIVIDER);
                        resultLines.push(...currentRemoteLines);
                        resultLines.push(REMOTE_MARKER_END);
                    }
                }

                baseCursor = groupBaseEnd;
                lIdx = combinedL;
                rIdx = combinedR;
                continue;
            }
        }

        // 无重叠：先处理出现位置更早的那个 hunk
        if (lHunk && (!rHunk || lHunk.baseStart < rHunk.baseStart)) {
            if (baseCursor < lHunk.baseStart) {
                resultLines.push(...baseLines.slice(baseCursor, lHunk.baseStart));
            }
            resultLines.push(...lHunk.newLines);
            baseCursor = lHunk.baseStart + lHunk.baseCount;
            lIdx++;
        } else if (rHunk) {
            if (baseCursor < rHunk.baseStart) {
                resultLines.push(...baseLines.slice(baseCursor, rHunk.baseStart));
            }
            resultLines.push(...rHunk.newLines);
            baseCursor = rHunk.baseStart + rHunk.baseCount;
            rIdx++;
        }
    }

    // 补齐尾部未修改的 Base 行
    if (baseCursor < baseLines.length) {
        resultLines.push(...baseLines.slice(baseCursor));
    }

    return {
        mergedLines: resultLines,
        hasConflicts: conflictCount > 0,
        conflictCount,
    };
}

export function threeWayMerge(
    base: string,
    local: string,
    remote: string,
    options: ThreeWayMergeOptions = {}
): SingleFileMergeResult {
    const filePath = options.filePath ?? 'unknown';
    const strategy = options.conflictStrategy ?? 'markers';
    const detectedEol = detectEol(local);

    const normBase = normalizeEol(base);
    const normLocal = normalizeEol(local);
    const normRemote = normalizeEol(remote);

    // 1. 三方完全一致
    if (normLocal === normRemote && normLocal === normBase) {
        return {
            filePath,
            status: 'unchanged',
            action: 'skip',
            content: local,
            hasConflicts: false,
            conflictCount: 0,
            detectedEol,
        };
    }

    // 2. 远端未修改，本地定制直接保留，无需覆写
    if (normRemote === normBase) {
        return {
            filePath,
            status: 'unchanged',
            action: 'skip',
            content: local,
            hasConflicts: false,
            conflictCount: 0,
            detectedEol,
        };
    }

    // 3. 本地未修改，远端有升级，直接合入远端
    if (normLocal === normBase) {
        return {
            filePath,
            status: 'merged',
            action: 'write',
            content: restoreEol(normRemote, detectedEol),
            hasConflicts: false,
            conflictCount: 0,
            detectedEol,
        };
    }

    const baseLines = normBase.length === 0 ? [] : normBase.split('\n');
    const localLines = normLocal.length === 0 ? [] : normLocal.split('\n');
    const remoteLines = normRemote.length === 0 ? [] : normRemote.split('\n');

    const { mergedLines, hasConflicts, conflictCount } = compute3WayMergeLines(
        baseLines,
        localLines,
        remoteLines,
        strategy
    );

    const mergedContent = restoreEol(mergedLines.join('\n'), detectedEol);

    return {
        filePath,
        status: hasConflicts ? 'conflict' : 'merged',
        action: 'write',
        content: mergedContent,
        hasConflicts,
        conflictCount,
        detectedEol,
    };
}
