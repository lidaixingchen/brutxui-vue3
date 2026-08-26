import { CliError } from '../error.js';

export interface HedgedRaceOptions {
    /** 阶梯延迟间隔（毫秒），前序请求发出后若未完成，在此时间后并发启动下一候选源。默认 600ms */
    readonly hedgeDelayMs?: number;
    /** 单源请求硬超时限制（毫秒），默认 10000ms */
    readonly sourceTimeoutMs?: number;
    /** 全局取消信号 */
    readonly parentSignal?: AbortSignal;
}

export interface HedgedRaceResult<T> {
    readonly result: T;
    readonly winningSource: string;
    readonly durationMs: number;
}

export interface SourceAttemptError {
    readonly source: string;
    readonly error: unknown;
}

/**
 * 聚合多源失败异常，遵循供应链安全与 404 优先级：
 * 1. REGISTRY_SIGNATURE_INVALID（签名被篡改）最高优先级透出
 * 2. REGISTRY_INTEGRITY_FAILED（内容哈希不匹配）次高优先级透出
 * 3. 全部源均为 404 时透出 COMPONENT_NOT_FOUND
 * 4. 其余情况聚合为泛化 REGISTRY_FETCH_FAILED
 */
export function createAggregatedSourceError(errors: readonly SourceAttemptError[]): CliError {
    if (errors.length === 0) {
        return new CliError('All registry sources failed.', { code: 'REGISTRY_FETCH_FAILED' });
    }

    const cliErrors = errors
        .map(e => (e.error instanceof CliError ? e.error : null))
        .filter((e): e is CliError => e !== null);

    // 信任链与完整性异常绝不折叠
    const signatureError = cliErrors.find(e => e.code === 'REGISTRY_SIGNATURE_INVALID');
    if (signatureError) return signatureError;

    const integrityError = cliErrors.find(e => e.code === 'REGISTRY_INTEGRITY_FAILED');
    if (integrityError) {
        return new CliError(
            `${integrityError.message} This may indicate a consistency delay between registry sources ` +
            `(e.g. CDN cache lag). Retry later, or force the primary source with --registry.`,
            { code: 'REGISTRY_INTEGRITY_FAILED', cause: integrityError },
        );
    }

    // 全量源 404
    if (cliErrors.length === errors.length && cliErrors.every(e => e.code === 'COMPONENT_NOT_FOUND')) {
        return new CliError(
            `Component not found in any of the ${errors.length} registry source(s).`,
            { code: 'COMPONENT_NOT_FOUND', cause: cliErrors[0] },
        );
    }

    const lastErr = errors[errors.length - 1]?.error;
    const message = lastErr instanceof Error ? lastErr.message : 'Unknown error';
    return new CliError(
        `All ${errors.length} registry source(s) failed. Last error: ${message}`,
        { code: 'REGISTRY_FETCH_FAILED', cause: lastErr instanceof Error ? lastErr : undefined },
    );
}

/**
 * 链式阶梯式并发多源竞速执行器。
 *
 * 核心行为契约：
 * 1. 启动首个源并仅挂载后继源的相对定时器；
 * 2. 若当前源未能在 hedgeDelayMs 内返回，定时器到期拉起后继源并接力挂载相对定时器；
 * 3. 若当前源提前抛出硬错误（Fast-Fail），立即 0ms 唤醒后继源；
 * 4. 任一源成功返回，立即判定其获胜并级联 abort 其余全部连接；
 * 5. 在 resolve / reject 任一出口处彻底清理所有未决定时器，避免句柄泄漏。
 */
export async function hedgedRace<T>(
    rankedSources: readonly string[],
    fetcher: (source: string, signal: AbortSignal) => Promise<T>,
    options: HedgedRaceOptions = {},
): Promise<HedgedRaceResult<T>> {
    if (rankedSources.length === 0) {
        throw new CliError('No sources provided for hedged race.', { code: 'REGISTRY_FETCH_FAILED' });
    }

    const { hedgeDelayMs = 600, sourceTimeoutMs = 10000, parentSignal } = options;

    if (parentSignal?.aborted) {
        throw new CliError('Request aborted.', { code: 'REGISTRY_FETCH_FAILED' });
    }

    const masterController = new AbortController();

    const errors: SourceAttemptError[] = [];
    let completed = false;

    return new Promise<HedgedRaceResult<T>>((resolve, reject) => {
        let activeOrPendingCount = rankedSources.length;
        const startedIndices = new Set<number>();
        const activeTimers = new Set<NodeJS.Timeout>();

        const cleanupAll = () => {
            for (const tid of activeTimers) {
                clearTimeout(tid);
            }
            activeTimers.clear();
        };

        if (parentSignal) {
            const onParentAbort = () => {
                if (completed) return;
                completed = true;
                cleanupAll();
                masterController.abort(parentSignal.reason);
                reject(new CliError('Request aborted.', { code: 'REGISTRY_FETCH_FAILED' }));
            };
            parentSignal.addEventListener('abort', onParentAbort, { once: true });
        }

        const startSourceAttempt = (index: number) => {
            if (completed || index >= rankedSources.length || startedIndices.has(index)) return;
            startedIndices.add(index);

            const source = rankedSources[index];
            const sourceController = new AbortController();

            const onMasterAbort = () => sourceController.abort(masterController.signal.reason);
            masterController.signal.addEventListener('abort', onMasterAbort, { once: true });

            // 单源超时挂载
            const timeoutId = setTimeout(() => {
                sourceController.abort(new Error(`Timeout after ${sourceTimeoutMs}ms`));
            }, sourceTimeoutMs);
            activeTimers.add(timeoutId);

            // 链式相对延迟挂载：为后继源挂载定时器
            let nextHedgeTimerId: NodeJS.Timeout | null = null;
            const nextIndex = index + 1;
            if (nextIndex < rankedSources.length && !startedIndices.has(nextIndex)) {
                nextHedgeTimerId = setTimeout(() => {
                    if (nextHedgeTimerId) activeTimers.delete(nextHedgeTimerId);
                    startSourceAttempt(nextIndex);
                }, hedgeDelayMs);
                activeTimers.add(nextHedgeTimerId);
            }

            const startTime = Date.now();

            fetcher(source, sourceController.signal)
                .then((result) => {
                    activeTimers.delete(timeoutId);
                    clearTimeout(timeoutId);
                    if (nextHedgeTimerId) {
                        activeTimers.delete(nextHedgeTimerId);
                        clearTimeout(nextHedgeTimerId);
                    }

                    if (completed) return;
                    completed = true;
                    cleanupAll();
                    masterController.abort();

                    resolve({
                        result,
                        winningSource: source,
                        durationMs: Date.now() - startTime,
                    });
                })
                .catch((err: unknown) => {
                    activeTimers.delete(timeoutId);
                    clearTimeout(timeoutId);
                    if (nextHedgeTimerId) {
                        activeTimers.delete(nextHedgeTimerId);
                        clearTimeout(nextHedgeTimerId);
                    }

                    if (completed) return;

                    // 若主控已取消，说明已有其他源获胜，不收集本取消错误
                    if (!masterController.signal.aborted) {
                        errors.push({ source, error: err });
                    }

                    activeOrPendingCount -= 1;

                    // 快速穿透：本源提前失败，若后继源尚未启动，立即 0ms 唤醒
                    if (nextIndex < rankedSources.length && !startedIndices.has(nextIndex)) {
                        startSourceAttempt(nextIndex);
                    }

                    if (activeOrPendingCount === 0 && !completed) {
                        completed = true;
                        cleanupAll();
                        masterController.abort();
                        reject(createAggregatedSourceError(errors));
                    }
                });
        };

        // 启动首个候选源
        startSourceAttempt(0);
    });
}
