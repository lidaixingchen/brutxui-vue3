export interface BackoffOptions {
    /** 基础退避延迟（毫秒），默认 500ms */
    readonly baseDelayMs: number;
    /** 最大退避封顶（毫秒），默认 5000ms */
    readonly maxDelayMs: number;
    /** 最小保底退避延迟（毫秒），防止瞬间重发，默认 200ms */
    readonly minDelayMs: number;
    /** 随机因子注入函数，用于测试桩注入，默认 Math.random */
    readonly randomFn?: () => number;
}

export const DEFAULT_BACKOFF_OPTIONS: BackoffOptions = {
    baseDelayMs: 500,
    maxDelayMs: 5000,
    minDelayMs: 200,
};

/** CLI 交互模式下允许的最大协议等待时间（15 秒） */
export const MAX_RETRY_AFTER_CAP_MS = 15000;

export const RETRYABLE_HTTP_STATUSES = new Set<number>([408, 429, 500, 502, 503, 504]);
export const TERMINAL_HTTP_STATUSES = new Set<number>([400, 401, 403, 404, 422]);

export function isRetryableHttpStatus(status: number): boolean {
    return RETRYABLE_HTTP_STATUSES.has(status);
}

export function isTerminalHttpStatus(status: number): boolean {
    return TERMINAL_HTTP_STATUSES.has(status);
}

/**
 * 计算带安全下界与封顶的有界 Full Jitter 退避时长。
 *
 * @param attempt 重试轮次索引（从 1 开始计）
 * @param options 退避参数配置
 * @returns 本次应休眠的毫秒数
 */
export function calculateBoundedJitterDelay(
    attempt: number,
    options: BackoffOptions = DEFAULT_BACKOFF_OPTIONS,
): number {
    const { baseDelayMs, maxDelayMs, minDelayMs, randomFn = Math.random } = options;
    const exponent = Math.max(0, attempt - 1);
    const exponentialCap = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, exponent));
    if (exponentialCap <= minDelayMs) {
        return minDelayMs;
    }
    const randomRatio = randomFn();
    return Math.floor(minDelayMs + randomRatio * (exponentialCap - minDelayMs));
}

/**
 * 解析 HTTP Response 中的 Retry-After 标头。
 * 支持整数秒数与标准 HTTP-Date 格式；解析后附加 ±10% 离散抖动，并受 MAX_RETRY_AFTER_CAP_MS 严格封顶。
 *
 * @param headerValue 标头原始字符串
 * @param nowMs 当前时间戳，默认为 Date.now()
 * @returns 毫秒数，若无法解析或非正值则返回 null
 */
export function parseRetryAfterDelayMs(
    headerValue: string | null | undefined,
    nowMs: number = Date.now(),
): number | null {
    if (!headerValue) return null;
    const trimmed = headerValue.trim();
    if (trimmed.length === 0) return null;

    let computedMs: number | null = null;

    const seconds = Number(trimmed);
    if (Number.isFinite(seconds) && seconds >= 0) {
        computedMs = seconds * 1000;
    } else {
        const dateMs = Date.parse(trimmed);
        if (!Number.isNaN(dateMs)) {
            computedMs = Math.max(0, dateMs - nowMs);
        }
    }

    if (computedMs === null) return null;

    // 叠加 ±10% 抖动，防止遵循 Retry-After 的多个客户端再度同频撞车
    const jitter = (Math.random() * 0.2 - 0.1) * computedMs;
    const delayWithJitter = Math.max(0, Math.floor(computedMs + jitter));

    return Math.min(MAX_RETRY_AFTER_CAP_MS, delayWithJitter);
}
