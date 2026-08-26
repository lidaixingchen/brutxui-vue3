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
 * 4. 网络中断/超时异常按退避重试，耗尽后抛出 REGISTRY_FETCH_FAILED。
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

        const attemptController = new AbortController();
        const onParentAbort = () => attemptController.abort(signal?.reason);
        if (signal) signal.addEventListener('abort', onParentAbort, { once: true });

        const timer = setTimeout(() => {
            attemptController.abort(new Error(`Fetch timed out after ${singleAttemptTimeoutMs}ms`));
        }, singleAttemptTimeoutMs);

        try {
            const res = await fetch(url, {
                headers,
                signal: attemptController.signal,
            });
            clearTimeout(timer);

            if (res.ok || res.status === 304) {
                return res;
            }

            if (isTerminalHttpStatus(res.status)) {
                // 确定性终态，不进行重试直接返回供上层做 404 等语义判断
                return res;
            }

            if (isRetryableHttpStatus(res.status)) {
                lastError = new Error(`HTTP ${res.status} ${res.statusText}`);
                if (attempt < maxRetries) {
                    const retryAfterMs = parseRetryAfterDelayMs(res.headers.get('retry-after'));
                    const delayMs = retryAfterMs ?? calculateBoundedJitterDelay(attempt);
                    await abortableSleep(delayMs, signal);
                    continue;
                }
                break;
            }

            return res;
        } catch (error: unknown) {
            clearTimeout(timer);
            if (signal?.aborted) {
                throw new CliError('Request aborted.', { code: 'REGISTRY_FETCH_FAILED', cause: error instanceof Error ? error : undefined });
            }
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries) {
                const delayMs = calculateBoundedJitterDelay(attempt);
                await abortableSleep(delayMs, signal);
                continue;
            }
        } finally {
            if (signal) signal.removeEventListener('abort', onParentAbort);
        }
    }

    throw new CliError(
        `Failed to fetch from "${url}" after ${maxRetries} attempts. Last error: ${lastError?.message ?? 'Unknown error'}`,
        { code: 'REGISTRY_FETCH_FAILED', cause: lastError ?? undefined },
    );
}
