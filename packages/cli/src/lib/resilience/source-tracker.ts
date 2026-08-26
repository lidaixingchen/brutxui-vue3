export type SourceHealthState = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export interface SourceHealthMetrics {
    state: SourceHealthState;
    consecutiveFailures: number;
    lastFailureTimeMs: number;
    smoothedRttMs: number;
}

export class RegistrySourceTracker {
    private readonly metrics = new Map<string, SourceHealthMetrics>();

    /**
     * 记录某源请求成功，更新往返时间并恢复健康状态。
     */
    recordSuccess(source: string, rttMs: number): void {
        const current = this.getOrCreate(source);
        current.consecutiveFailures = 0;
        current.state = 'HEALTHY';
        // 指数加权移动平均（EWMA）计算平滑 RTT
        current.smoothedRttMs = current.smoothedRttMs === 0
            ? rttMs
            : Math.floor(current.smoothedRttMs * 0.7 + rttMs * 0.3);
    }

    /**
     * 记录某源硬故障（网络不可达/5xx/超时），递增失败计数并评估是否降级。
     */
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
     * 不计入硬故障，仅更新平滑 RTT 的估计下界，保持 HEALTHY 状态。
     */
    recordCanceledByWinner(source: string, elapsedMs: number): void {
        const current = this.getOrCreate(source);
        if (current.state === 'HEALTHY') {
            current.smoothedRttMs = Math.max(current.smoothedRttMs, elapsedMs);
        }
    }

    /**
     * 根据当前会话健康画像对源列表进行动态重排（健康源置顶，降级/宕机源后置）。
     */
    rankSources(sources: readonly string[]): string[] {
        return [...sources].sort((a, b) => {
            const scoreA = this.getPriorityScore(a);
            const scoreB = this.getPriorityScore(b);
            return scoreA - scoreB;
        });
    }

    /**
     * 重置所有追踪状态（单测或会话清理）。
     */
    reset(): void {
        this.metrics.clear();
    }

    private getPriorityScore(source: string): number {
        const m = this.metrics.get(source);
        if (!m) return 0; // 未探测源保持中立优先级
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
