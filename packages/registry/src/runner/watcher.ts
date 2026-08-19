import fs from 'node:fs';
import path from 'node:path';
import type { CompilerPaths } from '../compiler/types.js';

export const WATCH_DEBOUNCE_MS = 100;
export const WATCHED_EXTENSIONS = new Set(['.vue', '.ts', '.tsx', '.json', '.css']);

export interface WatcherOptions {
    debounceMs?: number;
    onRebuild: () => Promise<void>;
}

export class RegistryWatcher {
    private watchers: fs.FSWatcher[] = [];
    private debounceTimer: NodeJS.Timeout | null = null;
    private isBuilding = false;
    private pendingChange = false;
    private debounceMs: number;
    private sigintHandler: (() => void) | null = null;

    constructor(
        private paths: CompilerPaths,
        private options: WatcherOptions
    ) {
        this.debounceMs = options.debounceMs ?? WATCH_DEBOUNCE_MS;
    }

    public start(): void {
        const dirsToWatch = [
            this.paths.componentsDir,
            this.paths.composablesDir,
            this.paths.localesDir,
            this.paths.libDir,
            this.paths.directivesDir,
        ];

        for (const dir of dirsToWatch) {
            if (!fs.existsSync(dir)) continue;
            try {
                const watcher = fs.watch(dir, { recursive: true }, (_eventType, filename) => {
                    if (!filename) return;
                    this.handleFileChange(filename.toString());
                });
                this.watchers.push(watcher);
                console.log(`  Watching ${path.relative(process.cwd(), dir)}/`);
            } catch (error) {
                console.warn(`  Failed to watch ${dir}: ${error instanceof Error ? error.message : error}`);
            }
        }

        console.log(`\n👀 Watching for changes (debounce ${this.debounceMs}ms). Press Ctrl+C to stop.\n`);

        this.sigintHandler = () => {
            this.stop();
            process.exit(0);
        };
        process.on('SIGINT', this.sigintHandler);
    }

    public stop(): void {
        if (this.sigintHandler) {
            process.off('SIGINT', this.sigintHandler);
            this.sigintHandler = null;
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        for (const watcher of this.watchers) {
            watcher.close();
        }
        this.watchers = [];
    }

    private handleFileChange(filename: string): void {
        const ext = path.extname(filename);
        if (!WATCHED_EXTENSIONS.has(ext)) return;
        if (/\.(test|spec)\.(ts|tsx)$/.test(filename)) return;

        this.pendingChange = true;

        if (this.isBuilding) return;

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            if (!this.pendingChange) return;
            this.pendingChange = false;
            void this.triggerRebuild();
        }, this.debounceMs);
    }

    private async triggerRebuild(): Promise<void> {
        if (this.isBuilding) return;
        this.isBuilding = true;

        const startTime = Date.now();
        try {
            console.log('\n🔄 Change detected, rebuilding...');
            await this.options.onRebuild();
            const elapsed = Date.now() - startTime;
            console.log(`✅ Rebuild complete in ${elapsed}ms. Watching for more changes...`);
        } catch (error) {
            console.error('❌ Rebuild failed:', error instanceof Error ? error.message : error);
            console.log('  (watch mode continues, fix the error and save again)');
        } finally {
            this.isBuilding = false;
            if (this.pendingChange) {
                this.pendingChange = false;
                if (this.debounceTimer) {
                    clearTimeout(this.debounceTimer);
                }
                this.debounceTimer = setTimeout(() => {
                    this.debounceTimer = null;
                    void this.triggerRebuild();
                }, this.debounceMs);
            }
        }
    }
}
