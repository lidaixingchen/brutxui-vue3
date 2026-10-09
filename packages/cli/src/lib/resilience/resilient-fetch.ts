import { CliError } from '../error.js';
import {
    calculateBoundedJitterDelay,
    parseRetryAfterDelayMs,
    isRetryableHttpStatus,
    isTerminalHttpStatus,
} from './backoff.js';

export interface ResilientFetchOptions {
    readonly headers?: Record<string, string>;
    readonly signal?: AbortSignal;
    readonly maxRetries?: number;
    readonly singleAttemptTimeoutMs?: number;
}

async function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
        throw new CliError('Request aborted.', { code: 'REGISTRY_FETCH_FAILED' });
    }
    return new Promise<void>((resolve, reject) => {
        const onAbort = () => {
            clearTimeout(timer);
            reject(new CliError('Request aborted.', { code: 'REGISTRY_FETCH_FAILED' }));
        };
        const timer = setTimeout(() => {
            if (signal) signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        if (signal) {
            signal.addEventListener('abort', onAbort, { once: true });
        }
    });
}

/**
 * 具备协议感知与有界指数抖动退避的单请求网络门面。
 *
 * 核心行为契约：
 * 1. 2xx 与 304 正常返回；
 * 2. 400/401/403/404/422 等终态状态码不重试，直接返回供上层业务做语义判定；
 * 3. 408/429/5xx 等可重试状态码解析 Retry-After 标头（带 15s 封顶）或使用有界 Full Jitter 退避重试；
 * 4. 超时与取消覆盖响应体完整接收；网络中断/超时异常按退避重试，耗尽后抛出 REGISTRY_FETCH_FAILED。
 */
export async function resilientFetch(
    url: string,
    options: ResilientFetchOptions = {},
): Promise<Response> {
    const { headers, signal, maxRetries = 2, singleAttemptTimeoutMs = 8000 } = options;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (signal?.aborted) {
            throw new CliError('Request aborted.', { code: 'REGISTRY_FETCH_FAILED' });
        }

        const attemptController: AbortController = new AbortController();
        const onParentAbort: () => void = (): void => attemptController.abort(signal?.reason);
        if (signal) {
            signal.addEventListener('abort', onParentAbort, { once: true });
            if (signal.aborted) onParentAbort();
        }

        const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
            attemptController.abort(new Error(`Fetch timed out after ${singleAttemptTimeoutMs}ms`));
        }, singleAttemptTimeoutMs);
        let retryDelayMs: number | null = null;
        let terminalStatus: number | undefined;

        try {
            const res: Response = await fetch(url, {
                headers,
                signal: attemptController.signal,
            });
            terminalStatus = isTerminalHttpStatus(res.status) ? res.status : undefined;

            if (isRetryableHttpStatus(res.status) && terminalStatus === undefined) {
                lastError = new Error(`HTTP ${res.status} ${res.statusText}`);
                await res.body?.cancel();
                if (attempt < maxRetries) {
                    const retryAfterMs: number | null = parseRetryAfterDelayMs(res.headers.get('retry-after'));
                    retryDelayMs = retryAfterMs ?? calculateBoundedJitterDelay(attempt);
                }
            } else {
                // 克隆体接收完整响应，原始响应保留元数据和调用方的读取能力。
                await res.clone().arrayBuffer();
                return res;
            }
        } catch (error: unknown) {
            if (signal?.aborted) {
                throw new CliError('Request aborted.', { code: 'REGISTRY_FETCH_FAILED', cause: error instanceof Error ? error : undefined });
            }
            if (terminalStatus !== undefined) {
                throw new CliError(`Failed to receive HTTP ${terminalStatus} response from "${url}".`, {
                    code: 'REGISTRY_FETCH_FAILED',
                    cause: error,
                });
            }
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries) {
                retryDelayMs = calculateBoundedJitterDelay(attempt);
            }
        } finally {
            clearTimeout(timer);
            if (signal) signal.removeEventListener('abort', onParentAbort);
        }

        if (retryDelayMs !== null) {
            await abortableSleep(retryDelayMs, signal);
        }
    }

    throw new CliError(
        `Failed to fetch from "${url}" after ${maxRetries} attempts. Last error: ${lastError?.message ?? 'Unknown error'}`,
        { code: 'REGISTRY_FETCH_FAILED', cause: lastError ?? undefined },
    );
}
