import fs from 'node:fs';
import path from 'node:path';
import type { CompilerPaths } from '../compiler/types.js';

export const WATCH_DEBOUNCE_MS = 100;
export const WATCHED_EXTENSIONS = new Set([
    '.vue', '.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css',
]);

interface WatchInputs {
    directories: string[];
    files: string[];
}

function watchRoot(input: string): string {
    let directory = path.dirname(input);
    while (!fs.existsSync(directory)) {
        const parent = path.dirname(directory);
        if (parent === directory) break;
        directory = parent;
    }
    return directory;
}

function containsPath(directory: string, candidate: string): boolean {
    const relative = path.relative(directory, candidate);
    return !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`);
}

export interface WatcherOptions {
    debounceMs?: number;
    onRebuild: () => Promise<void>;
    additionalInputs?: WatchInputs;
}

export class RegistryWatcher {
    private watchers: fs.FSWatcher[] = [];
    private debounceTimer: NodeJS.Timeout | null = null;
    private started = false;
    private isBuilding = false;
    private pendingChange = false;
    private debounceMs: number;

    constructor(
        private paths: CompilerPaths,
        private options: WatcherOptions
    ) {
        this.debounceMs = options.debounceMs ?? WATCH_DEBOUNCE_MS;
    }

    public async start({ buildInitially = false } = {}): Promise<void> {
        if (this.started) return;
        this.started = true;

        const directories = [
            this.paths.componentsDir,
            this.paths.composablesDir,
            this.paths.localesDir,
            this.paths.libDir,
            this.paths.directivesDir,
            this.paths.typesDir,
            ...(this.options.additionalInputs?.directories ?? []),
        ];
        const files = [
            this.paths.manifestPath,
            this.paths.apiContractPath,
            path.resolve(path.dirname(this.paths.manifestPath), 'package.json'),
            ...(this.options.additionalInputs?.files ?? []),
        ];

        // 监听输入的祖先，目录或文件被替换时可继续收到新路径上的事件。
        const inputsByRoot = new Map<string, WatchInputs>();
        for (const [kind, inputs] of [['directories', directories], ['files', files]] as const) {
            for (const input of inputs) {
                if (!input) continue;
                const target = path.resolve(input);
                const root = watchRoot(target);
                const targets = inputsByRoot.get(root) ?? { directories: [], files: [] };
                targets[kind].push(target);
                inputsByRoot.set(root, targets);
            }
        }
        for (const [root, targets] of inputsByRoot) {
            const recursive = targets.directories.length > 0
                || targets.files.some(file => path.dirname(file) !== root);
            this.watch(root, recursive, (eventType, filename) => {
                const changed = path.resolve(root, filename);
                if (targets.files.some(file => changed === file
                    || (eventType === 'rename' && containsPath(changed, file)))) return true;
                return targets.directories.some(directory => {
                    if (eventType === 'rename' && containsPath(changed, directory)) return true;
                    if (!containsPath(directory, changed) || /\.(test|spec)\.[^.]+$/u.test(changed)) return false;
                    const extension = path.extname(changed);
                    return WATCHED_EXTENSIONS.has(extension) || (eventType === 'rename' && !extension);
                });
            });
        }

        process.on('SIGINT', this.stop);
        process.on('SIGTERM', this.stop);
        if (buildInitially) await this.triggerRebuild(true);
        if (this.started) {
            console.log(`\n👀 Watching for changes (debounce ${this.debounceMs}ms). Press Ctrl+C to stop.\n`);
        }
    }

    public stop = (): void => {
        this.started = false;
        this.pendingChange = false;
        process.off('SIGINT', this.stop);
        process.off('SIGTERM', this.stop);
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
        for (const watcher of this.watchers) {
            watcher.close();
        }
        this.watchers = [];
    };

    private watch(
        directory: string,
        recursive: boolean,
        matches: (eventType: string, filename: string) => boolean,
    ): void {
        const reportError = (error: unknown) => {
            console.warn(`  Failed to watch ${directory}: ${error instanceof Error ? error.message : error}`);
        };
        try {
            const watcher = fs.watch(directory, { recursive }, (eventType, filename) => {
                if (filename && matches(eventType, filename)) this.handleFileChange();
            });
            watcher.on('error', reportError);
            this.watchers.push(watcher);
            console.log(`  Watching ${path.relative(process.cwd(), directory) || '.'}/`);
        } catch (error) {
            reportError(error);
        }
    }

    private handleFileChange(): void {
        if (!this.started) return;
        this.pendingChange = true;
        this.scheduleRebuild();
    }

    private scheduleRebuild(): void {
        if (!this.started || this.isBuilding || !this.pendingChange) return;
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            void this.triggerRebuild();
        }, this.debounceMs);
    }

    private async triggerRebuild(initial = false): Promise<void> {
        if (this.isBuilding) return;
        this.pendingChange = false;
        this.isBuilding = true;

        const startTime = Date.now();
        try {
            if (!initial) console.log('\n🔄 Change detected, rebuilding...');
            await this.options.onRebuild();
            if (this.started && !initial) {
                const elapsed = Date.now() - startTime;
                console.log(`✅ Rebuild complete in ${elapsed}ms. Watching for more changes...`);
            }
        } catch (error) {
            if (this.started) {
                console.error(initial ? '❌ Initial build failed:' : '❌ Rebuild failed:', error instanceof Error ? error.message : error);
                console.log('  (watch mode continues, fix the error and save again)');
            }
        } finally {
            this.isBuilding = false;
            this.scheduleRebuild();
        }
    }
}
