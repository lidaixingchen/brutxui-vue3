import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import type { CompiledRegistryResult } from '../compiler/types.js';

export interface BenchmarkMetrics {
    timestamp: string;
    totalDurationMs: number;
    itemCount: number;
    cachedCount: number;
    builtCount: number;
    items: Record<string, { durationMs: number; cached: boolean }>;
}

export class BenchmarkTracker {
    constructor(
        private fs: FileSystemAdapter,
        private benchFilePath: string
    ) {}

    public createMetrics(result: CompiledRegistryResult): BenchmarkMetrics {
        const items: BenchmarkMetrics['items'] = {};
        let cachedCount = 0;
        let builtCount = 0;

        for (const itemRes of result.itemResults) {
            items[itemRes.name] = {
                durationMs: itemRes.durationMs,
                cached: itemRes.cached,
            };
            if (itemRes.cached) {
                cachedCount++;
            } else {
                builtCount++;
            }
        }

        return {
            timestamp: new Date().toISOString(),
            totalDurationMs: result.totalDurationMs,
            itemCount: result.itemResults.length,
            cachedCount,
            builtCount,
            items,
        };
    }

    public async saveMetrics(metrics: BenchmarkMetrics): Promise<void> {
        await this.fs.writeJson(this.benchFilePath, metrics, { spaces: 2 });
    }
}
