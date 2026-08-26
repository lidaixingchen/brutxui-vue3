# CLI网络韧性与多源竞速自适应退避方案

> 方案类型：网络韧性 / 性能优化 / 架构设计
> 状态：**done**
> 日期：2026-08-26
> 关联文档：[架构优化方案-v3](架构优化方案-v3.md)；[CLI声明式诊断巡检与自愈引擎方案](CLI声明式诊断巡检与自愈引擎方案.md)
> 修订记录：2026-08-26 初稿设计；基于第一性原理完善并发调度时钟模型、状态机画像细化、异步资源安全回收与协议安全上限；2026-08-27 全量落地实施并通过测试与 AI 审查交付

---

## 一、 背景与第一性原理剖析

### 1. 现状痛点分析

在 BrutxUI Vue 3 CLI（`packages/cli`）现行的网络与组件拉取实现中，负责多源协调与请求拉取的 `fetchWithSources`（位于 `packages/cli/src/lib/registry-source.ts`）与单源重试机制 `fetchWithRetry`（位于 `packages/cli/src/lib/registry.ts`）呈现出典型的**两层割裂、串行阻塞与静态退避**缺陷，具体表现为：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          现行串行阻塞重试流水线                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 主源 (GitHub Release / CDN) 发生网络故障 / DNS 污染 / 黑洞挂起：              │
│                                                                             │
│  [Attempt 1] 挂起超时等待 30s ────▶ 静态休眠 1000ms ──────┐                  │
│  [Attempt 2] 挂起超时等待 30s ────▶ 静态休眠 2000ms ──────┤ 单源总耗时: 97s  │
│  [Attempt 3] 挂起超时等待 30s ────▶ 最终抛出异常 ─────────┘                  │
│                                                                             │
│ 备选源 (Fallback Mirror / Enterprise Registry) 切换：                       │
│  在主源卡顿整整 97 秒之后，才触发 for 循环的下一次迭代切换到备选源！           │
│  若此前尝试拉取 manifest.json，则该耗时将翻倍至近 200 秒，终端表现为假死。   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 痛点 1：串行阻塞 Fallback 导致的时延级联放大（Latency Cascade）
- **超时与重试嵌套叠加**：单次 `fetch` 配置写死 `signal: AbortSignal.timeout(30000)`（30 秒），且硬编码重试 3 次，每次重试前串行休眠。在跨洋链路不稳定、DNS 污染或骨干网黑洞场景下，主源必须耗尽所有重试（$30\text{s} \times 3 + 1\text{s} + 2\text{s} = 93\text{s}$）才会抛错并切换到下一个源。
- **Manifest 预检二次放大**：在拉取组件条目前，`fetchRegistryManifestSummary` 会先行发起一次独立的网络请求。如果主源失联，manifest 拉取将先经历 93 秒阻塞，组件拉取再次经历 93 秒阻塞，整体挂起感知接近 200 秒，极易导致 CI 超时被强杀，或开发者误以为进程卡死按 Ctrl+C 中断。

#### 痛点 2：确定性静态退避阶梯引发并发“惊群效应”（Thundering Herd）
- **固定无抖动休眠**：当前重试间隔硬编码为固定数组 `delays = [1000, 2000, 4000]` ms。
- **CI 矩阵与企业级并发下的雪崩效应**：当企业在 CI 流水线中并发拉取组件（或数十个容器节点同时触发构建），若中心源站遭遇瞬态 503/429 抖动，所有并发节点将在完全相同的时间截面（+1000ms、+2000ms、+4000ms）齐射发起重试波峰，形成周期性流量重击（Pulsing Load），使处于边缘过载的源站陷入恶性循环、持续瘫痪。

#### 痛点 3：重试职责倒置（Inverted Precedence）
- **“坏源死磕”优先于“健康源切换”**：在拥有多个可靠镜像（如官方 Release、全球加速镜像、企业内网缓存镜像）的环境中，**“立即换到健康源”的成功率和响应速度远高于“在已故障源上反复重试”**。现行实现将单源原地重试封装在内层，将多源遍历置于外层，颠倒了网络韧性调度的优先级。

#### 痛点 4：跨请求无状态感知导致批量惩罚累加（Accumulative Penalties）
- **无记忆的轮询机制**：执行 `brutx add button dialog select form` 批量安装多个组件时，每次拉取均是一次完全独立的无状态调用。若主源已确认不可用，后续每个组件仍要重新经历一遍主源的超时与降级流程，使整个批量安装过程变得漫长且不可接受。

---

## 二、 多源调度与退避算法模型

从分布式系统第一性原理审视，网络韧性调度应当在保障供应链安全与离线隔离的前提下，实现**高自适应性、低请求放大、无时钟脱节与细粒度状态沉淀**。

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          多源调度模型演进对比                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 严格串行 Fallback:                                                          │
│ Source 1: [==== 93s 阻塞重试 ==== 失败]                                     │
│ Source 2:                             [== 200ms 成功 ==]                     │
│ 总体耗时: ~93.2s                                                            │
│                                                                             │
│ 链式自适应阶梯竞速 (Chained Hedged Racing) + 细粒度健康画像:                  │
│ Source 1: [--- 600ms 挂起未决 ---] ──▶ 相对挂载定时器触发                    │
│ Source 2:                         [== 180ms 成功 ==] ──▶ 获胜，级联释放 S1   │
│                                                                             │
│ 若 Source 1 遭遇 ECONNREFUSED/DNS 错误 (50ms 快速失败):                      │
│ Source 1: [x 50ms 失败]                                                     │
│ Source 2:               [== 180ms 成功 ==] (0ms 等待，立即启动!)             │
│ 后续组件: 直接粘滞以 Source 2 为首选，0ms 发起请求，消除后续所有竞速开销      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. 链式自适应阶梯竞速（Chained Hedged Racing）与快速穿透

基础的 Happy Eyeballs 若采用全局绝对时间定时器（如 $0\text{ms}, 600\text{ms}, 1200\text{ms}$），当首源在 50ms 快速失败唤醒第二源时，第三源仍会被推迟到 1200ms 触发，产生时钟脱节。
本方案采用**基于活跃任务生命周期的相对链式延迟调度（Chained Relative Timer）**：
- **链式相对延迟挂载**：候选源 $i$ 启动后，仅挂载针对后继源 $i+1$ 的单次相对定时器（`hedgeDelayMs`，默认 600ms）。
- **确定性错误快速穿透（Fast-Fail Bypass）**：若源 $i$ 在定时器到期前抛出硬错误（连接断开、DNS 解析失败、不可重试状态码），立即取消该定时器并**以 0ms 延迟直通唤醒源 $i+1$**；源 $i+1$ 启动后接力为其后继源挂载新的相对定时器。
- **首包标头（TTFB）锁定语义**：竞速胜出的判定点设置在**成功接收 HTTP 响应标头且状态码正常（2xx/304）**的瞬间。一旦某源获胜，立刻锁定该源并作为管道消费主体，其余并行发起的候选源通过级联 `AbortController` 立即终止并释放连接池 Socket。

### 2. 细粒度三态健康画像与会话粘滞状态机（Session-Sticky Source Tracker）

在单次 CLI 命令执行生命周期内，维护轻量级源健康状态画像，明确区分三种响应结果：
1. **成功（Success）**：采用指数加权移动平均（EWMA）更新平滑 RTT，重置连续失败计数，置为 `HEALTHY`。
2. **硬故障（Hard Failure）**：网络不可达、DNS 污染、5xx 错误或单源超时，递增 `consecutiveFailures`，达阈值后标记为 `DOWN` 或 `DEGRADED`。
3. **竞速落败取消（Canceled by Winner）**：链路 RTT 略长但并非不可用，**不计入硬故障计数**，仅对平滑 RTT 进行轻量衰减更新，避免健康主源被误判为宕机。

排序打分算法动态将已知健康源置顶，使后续批量组件拉取享受 $O(1)$ 的零延迟命中。

### 3. 协议感知与带安全下界的封顶 Full Jitter 退避算法

为杜绝惊群效应、零延迟瞬发与指数膨胀，重试退避引擎遵循以下数学模型与协议优先级：
1. **协议优先（Protocol-Aware with Safe Cap）**：
   若响应头含合法 `Retry-After`（秒数或 HTTP Date），计算基准等待时长并附加 $\pm 10\%$ 离散抖动；同时设置**交互级安全上限**（`MAX_RETRY_AFTER_CAP_MS = 15000`，15 秒），若远端要求过长休眠则快速放弃并转向下一源。
2. **有界下界 Full Jitter（Bounded Floor Jitter）**：
   $$\text{cap} = \min(\text{maxDelay}, \text{baseDelay} \times 2^{\text{attempt}-1})$$
   $$\text{delay} = \text{minDelay} + \text{randomRatio} \times (\text{cap} - \text{minDelay})$$
   参数基准：$\text{minDelay} = 200\text{ms}$，$\text{baseDelay} = 500\text{ms}$，$\text{maxDelay} = 5000\text{ms}$。
3. **状态码判决矩阵**：
   - 可重试状态码（Retryable）：`408`, `429`, `500`, `502`, `503`, `504`；
   - 确定性终态状态码（Terminal）：`400`, `401`, `403`, `404`, `422`，直接抛出对应异常，绝不进行无谓退避。

---

## 三、 核心架构设计与详细契约

网络韧性模块解耦独立至 `packages/cli/src/lib/resilience/` 深模块，对外暴露清晰且无副作用的契约。

```text
packages/cli/src/lib/resilience/
├── backoff.ts            # 退避抖动算法、Retry-After 解析与状态码判决
├── source-tracker.ts     # 细粒度源健康画像、EWMA RTT 与动态排序状态机
├── hedged-race.ts        # 链式自适应竞速调度引擎与 Abort 控制器拓扑树
└── resilient-fetch.ts    # 组装深模块门面，提供统一健壮的 fetch 契约
```

### 1. 协议感知与退避算法引擎：`backoff.ts`

```typescript
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
 */
export function calculateBoundedJitterDelay(
    attempt: number,
    options: BackoffOptions = DEFAULT_BACKOFF_OPTIONS,
): number {
    const { baseDelayMs, maxDelayMs, minDelayMs, randomFn = Math.random } = options;
    const exponentialCap = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, Math.max(0, attempt - 1)));
    if (exponentialCap <= minDelayMs) {
        return minDelayMs;
    }
    const randomRatio = randomFn();
    return Math.floor(minDelayMs + randomRatio * (exponentialCap - minDelayMs));
}

/**
 * 解析 HTTP Response 中的 Retry-After 标头。
 * 支持整数秒数与标准 HTTP-Date 格式；解析后附加 ±10% 离散抖动，并受 MAX_RETRY_AFTER_CAP_MS 严格封顶。
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
```

---

### 2. 细粒度会话级源健康追踪器：`source-tracker.ts`

```typescript
export type SourceHealthState = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export interface SourceHealthMetrics {
    state: SourceHealthState;
    consecutiveFailures: number;
    lastFailureTimeMs: number;
    smoothedRttMs: number;
}

export class RegistrySourceTracker {
    private readonly metrics = new Map<string, SourceHealthMetrics>();

    recordSuccess(source: string, rttMs: number): void {
        const current = this.getOrCreate(source);
        current.consecutiveFailures = 0;
        current.state = 'HEALTHY';
        current.smoothedRttMs = current.smoothedRttMs === 0
            ? rttMs
            : Math.floor(current.smoothedRttMs * 0.7 + rttMs * 0.3);
    }

    recordFailure(source: string): void {
        const current = this.getOrCreate(source);
        current.consecutiveFailures += 1;
        current.lastFailureTimeMs = Date.now();
        if (current.consecutiveFailures >= 2) {
            current.state = 'DOWN';
        } else {
            current.state = 'DEGRADED';
        }
    }

    /**
     * 记录请求在竞速中因其他源胜出而被主动取消。
     * 不计入硬故障，仅更新平滑 RTT 的估计下界。
     */
    recordCanceledByWinner(source: string, elapsedMs: number): void {
        const current = this.getOrCreate(source);
        if (current.state === 'HEALTHY') {
            current.smoothedRttMs = Math.max(current.smoothedRttMs, elapsedMs);
        }
    }

    rankSources(sources: readonly string[]): string[] {
        return [...sources].sort((a, b) => {
            const scoreA = this.getPriorityScore(a);
            const scoreB = this.getPriorityScore(b);
            return scoreA - scoreB;
        });
    }

    reset(): void {
        this.metrics.clear();
    }

    private getPriorityScore(source: string): number {
        const m = this.metrics.get(source);
        if (!m) return 0;
        switch (m.state) {
            case 'HEALTHY': return -100 + Math.min(50, m.smoothedRttMs / 20);
            case 'DEGRADED': return 500 + m.consecutiveFailures * 100;
            case 'DOWN': return 10000;
        }
    }

    private getOrCreate(source: string): SourceHealthMetrics {
        let entry = this.metrics.get(source);
        if (!entry) {
            entry = { state: 'HEALTHY', consecutiveFailures: 0, lastFailureTimeMs: 0, smoothedRttMs: 0 };
            this.metrics.set(source, entry);
        }
        return entry;
    }
}
```

---

### 3. 链式自适应竞速调度引擎：`hedged-race.ts`

```typescript
import { CliError } from '../error.js';

export interface HedgedRaceOptions {
    /** 阶梯延迟间隔（毫秒），前序请求发出后若未完成，在此时间后并发启动下一候选源。默认 600ms */
    readonly hedgeDelayMs: number;
    /** 单源请求硬超时限制（毫秒），默认 10000ms */
    readonly sourceTimeoutMs: number;
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

export function createAggregatedSourceError(errors: readonly SourceAttemptError[]): CliError {
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
 */
export async function hedgedRace<T>(
    rankedSources: readonly string[],
    fetcher: (source: string, signal: AbortSignal) => Promise<T>,
    options: HedgedRaceOptions,
): Promise<HedgedRaceResult<T>> {
    if (rankedSources.length === 0) {
        throw new CliError('No sources provided for hedged race.', { code: 'REGISTRY_FETCH_FAILED' });
    }

    const { hedgeDelayMs = 600, sourceTimeoutMs = 10000, parentSignal } = options;
    const masterController = new AbortController();

    if (parentSignal) {
        if (parentSignal.aborted) {
            masterController.abort(parentSignal.reason);
        } else {
            parentSignal.addEventListener('abort', () => masterController.abort(parentSignal.reason), { once: true });
        }
    }

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

        const startSourceAttempt = (index: number) => {
            if (completed || index >= rankedSources.length || startedIndices.has(index)) return;
            startedIndices.add(index);

            const source = rankedSources[index];
            const sourceController = new AbortController();

            const onMasterAbort = () => sourceController.abort(masterController.signal.reason);
            masterController.signal.addEventListener('abort', onMasterAbort, { once: true });

            // 单源超时
            const timeoutId = setTimeout(() => {
                sourceController.abort(new Error(`Timeout after ${sourceTimeoutMs}ms`));
            }, sourceTimeoutMs);
            activeTimers.add(timeoutId);

            // 链式延迟：为下一个后继源挂载相对定时器
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

        // 启动首个源
        startSourceAttempt(0);
    });
}
```

---

### 4. 弹性网络门面：`resilient-fetch.ts`

```typescript
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
                // 确定性终态，不进行重试直接返回，交由上层做语义判决（如 404 COMPONENT_NOT_FOUND）
                return res;
            }

            if (isRetryableHttpStatus(res.status)) {
                lastError = new Error(`HTTP ${res.status} ${res.statusText}`);
                if (attempt < maxRetries) {
                    const retryAfterMs = parseRetryAfterDelayMs(res.headers.get('retry-after'));
                    const delayMs = retryAfterMs ?? calculateBoundedJitterDelay(attempt);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }
            }

            return res;
        } catch (error: unknown) {
            clearTimeout(timer);
            if (signal?.aborted) {
                throw error;
            }
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries) {
                const delayMs = calculateBoundedJitterDelay(attempt);
                await new Promise(resolve => setTimeout(resolve, delayMs));
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
```

---

### 5. 业务层无缝集成与安全契约保障

在集成到 `packages/cli/src/lib/registry-source.ts` 与 `packages/cli/src/lib/registry.ts` 时：

1. **安全完整性与签名错误永不降级**：
   - 任一源抛出 `REGISTRY_SIGNATURE_INVALID` 或 `REGISTRY_INTEGRITY_FAILED` 时，`createAggregatedSourceError` 会在错误聚合中置顶透出，绝不折叠为普通网络异常。
2. **`fetchRegistryManifestSummary` 全面接入弹性管道**：
   - 彻底移除 `registry.ts` 内旧有的 `fetchWithRetry`，manifest 与 item 的网络拉取统一由 `resilientFetch` 承载，防止单源内部发生长达 30s 的静态挂起。
3. **离线模式（`BRUTX_OFFLINE=1`）硬隔离**：
   - 离线模式在 `fetchWithSources` 顶层进行拦截，仅遍历本地缓存，保持网络层零调用。

---

## 四、 分阶段演进与实施路径

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          实施路线与分步里程碑                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Milestone 1: 算法与状态机核心库 (纯计算、零外部依赖、100% 单测)              │
│   ├─ backoff.ts (Bounded Full Jitter, Retry-After 安全封顶, 状态码判决)      │
│   ├─ source-tracker.ts (细粒度三态画像、EWMA RTT、动态重排)                  │
│   └─ tests/resilience/ 专项单元测试 (含假时间伪装与边界覆盖)                  │
│                                                                             │
│ Milestone 2: 链式阶梯竞速调度器与网络门面                                    │
│   ├─ hedged-race.ts (实现链式相对定时器、快速穿透与全量资源清理)              │
│   ├─ resilient-fetch.ts (有界退避与单请求防护)                              │
│   └─ 验证网络挂起时 600ms 自动拉起备选源、首胜立即 Abort 其余连接            │
│                                                                             │
│ Milestone 3: 业务集成与旧版重试机制清理                                      │
│   ├─ 重构 packages/cli/src/lib/registry-source.ts 中的 fetchWithSources     │
│   ├─ 替换 packages/cli/src/lib/registry.ts 中的 fetchWithRetry 与 manifest   │
│   └─ 保持全部现有单测通过，移除硬编码 30s 与 [1000, 2000, 4000]ms 静态数组   │
│                                                                             │
│ Milestone 4: 可观测性与健康自检联动                                          │
│   ├─ logger.debug 记录竞速获胜源与往返 RTT，--verbose 模式可直观查验         │
│   └─ 联动 brutx doctor 检查项，探测并展示各 Registry 响应延迟                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Milestone 1: 算法与状态机核心库
- **任务目标**：建立 `packages/cli/src/lib/resilience/` 目录，封装纯数学计算的退避公式与会话级健康状态机。
- **交付标准**：
  - 导出 `calculateBoundedJitterDelay` 与 `parseRetryAfterDelayMs`（带 `MAX_RETRY_AFTER_CAP_MS` 封顶）；
  - 导出 `RegistrySourceTracker`，具备 `recordSuccess`、`recordFailure` 与 `recordCanceledByWinner` 三态方法；
  - 编写独立单测，使用 Mock 验证随机抖动上下界与 EWMA 平滑算法。

### 2. Milestone 2: 链式阶梯竞速引擎与网络门面
- **任务目标**：实现 `hedged-race.ts` 与 `resilient-fetch.ts`。
- **交付标准**：
  - 单测覆盖：慢源（800ms）与快源（100ms）在 600ms 拉起后于 700ms 决出胜负，慢源被立即 abort 且不被标记为硬故障；
  - 单测覆盖：首源快速失败（30ms 抛错）瞬间以 0ms 唤醒第二源，第二源的后继相对定时器正常挂载；
  - 单测覆盖：所有源均失败时，所有未决定时器被彻底清理，`createAggregatedSourceError` 正确透出高优先级安全错误。

### 3. Milestone 3: 业务集成与旧机制清理
- **任务目标**：无损升级 `fetchWithSources` 与 `registry.ts`，注入单例 `RegistrySourceTracker`。
- **交付标准**：
  - 批量组件下载时，首个组件确定健康备源后，后续组件直接命中首选健康源；
  - 彻底清理 `registry.ts` 中的 `fetchWithRetry` 与静态休眠数组；
  - CLI 全量单测 100% 通过（离线测试、篡改测试与 not-found 测试）。

### 4. Milestone 4: 可观测性与终端反馈
- **任务目标**：在调试模式（`--verbose`）下提供细粒度诊断信息，在 `doctor` 命令中复用源延迟探针。
- **交付标准**：
  - 当发生跨源 fallback 时友好记录调试日志；
  - `brutx doctor` 输出多源连通性与健康状态评估。

---

## 五、 风险评估与防御策略

### 1. 流量放大与源站负载（Bandwidth & Request Amplification）
- **风险**：并发拉取多个源可能增加客户端并发连接数与源站负载。
- **防御**：
  - 严格限制并发源上限：默认阶梯深度最多拉起 2 个源，其余备选源仅在前序源失败后串联递补；
  - 阶梯延迟（`hedgeDelayMs`）设置保底阈值（默认 600ms），不发起全量无脑泛洪；
  - 获胜源一旦返回标头，立即触发 `masterController.abort()` 释放其余连接。

### 2. 未决异步定时器与 Socket 泄漏（Dangling Timers & Socket Leak）
- **风险**：被取消或竞速失败的任务若未清理定时器，会导致进程滞留或测试挂起。
- **防御**：
  - 在 `hedgedRace` 内部维护活跃定时器集合 `activeTimers`，在任一出口（resolve/reject）通过统一清理函数 `cleanupAll()` 立即清除；
  - 异常捕获层区分主动 Abort 与网络异常，避免无害的取消信号触发 `unhandledRejection`。

### 3. 离线模式零网络红线保障
- **风险**：竞速引擎如果绕过离线判断直接发起探测，会破坏 `BRUTX_OFFLINE=1` 契约。
- **防御**：
  - `fetchWithSources` 顶层强制保留离线拦截网，离线模式完全绕开 `hedgedRace`，确保无任何 socket 建立动作。
