import path from 'node:path';
import type { FileSystemAdapter } from 'brutx-shared-vue/fs';
import { isGlobalDryRun } from '../global-dry-run.js';

export const AUDIT_LOG_RELATIVE_PATH = '.brutx/audit.log';
export const AUDIT_COMMANDS = ['add', 'remove', 'update', 'diff', 'init'] as const;
export type AuditCommand = (typeof AUDIT_COMMANDS)[number];

export interface AuditEntry {
    timestamp: string;
    command: AuditCommand;
    components: string[];
    registrySource?: string;
    integrity?: string;
    version?: string;
    success: boolean;
    dryRun: boolean;
    error?: string;
    cwd: string;
}

export interface AuditReadFilter {
    command?: AuditCommand;
    successOnly?: boolean;
    failureOnly?: boolean;
    since?: string;
    limit?: number;
}

export interface AuditLogStorageOptions {
    fs: FileSystemAdapter;
    cwd: string;
    relativePath?: string;
}

function sanitizeErrorMessage(message: string): string {
    const MAX_ERROR_LENGTH = 500;
    return message.length > MAX_ERROR_LENGTH
        ? `${message.slice(0, MAX_ERROR_LENGTH)}... (truncated)`
        : message;
}

function isValidAuditEntry(value: unknown): value is AuditEntry {
    if (typeof value !== 'object' || value === null) return false;
    const entry = value as Partial<AuditEntry>;
    return typeof entry.timestamp === 'string'
        && typeof entry.command === 'string'
        && (AUDIT_COMMANDS as readonly string[]).includes(entry.command)
        && Array.isArray(entry.components)
        && entry.components.every(c => typeof c === 'string')
        && typeof entry.success === 'boolean'
        && typeof entry.dryRun === 'boolean'
        && typeof entry.cwd === 'string';
}

export class AuditLogStorage {
    private readonly fs: FileSystemAdapter;
    private readonly cwd: string;
    private readonly relativePath: string;

    constructor(options: AuditLogStorageOptions) {
        this.fs = options.fs;
        this.cwd = options.cwd;
        this.relativePath = options.relativePath ?? AUDIT_LOG_RELATIVE_PATH;
    }

    public get logPath(): string {
        return path.join(this.cwd, this.relativePath);
    }

    public async append(entry: Omit<AuditEntry, 'timestamp'> & { timestamp?: string }): Promise<void> {
        if (isGlobalDryRun()) {
            return;
        }

        try {
            const logPath = this.logPath;
            await this.fs.ensureDir(path.dirname(logPath));

            const fullEntry: AuditEntry = {
                ...entry,
                timestamp: entry.timestamp ?? new Date().toISOString(),
            };

            const line = JSON.stringify(fullEntry) + '\n';
            let existingContent = '';
            if (await this.fs.pathExists(logPath)) {
                existingContent = await this.fs.readFile(logPath, 'utf-8');
            }
            await this.fs.writeFile(logPath, existingContent + line, 'utf-8');
        } catch {
            // 审计追加失败静默丢弃，不阻塞主流程
        }
    }

    public async withAudit<T>(
        entry: Omit<AuditEntry, 'timestamp' | 'success' | 'error'>,
        action: () => Promise<T>,
    ): Promise<T> {
        try {
            const result = await action();
            await this.append({
                ...entry,
                success: true,
            });
            return result;
        } catch (error) {
            const errorMessage = sanitizeErrorMessage(error instanceof Error ? error.message : String(error));
            await this.append({
                ...entry,
                success: false,
                error: errorMessage,
            });
            throw error;
        }
    }

    public async query(filter: AuditReadFilter = {}): Promise<AuditEntry[]> {
        const logPath = this.logPath;
        if (!(await this.fs.pathExists(logPath))) {
            return [];
        }

        const entries: AuditEntry[] = [];
        try {
            const content = await this.fs.readFile(logPath, 'utf-8');
            const lines = content.split(/\r?\n/);

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.length === 0) continue;
                try {
                    const parsed = JSON.parse(trimmed) as AuditEntry;
                    if (isValidAuditEntry(parsed)) {
                        entries.push(parsed);
                    }
                } catch {
                    // 损坏行跳过
                }
            }
        } catch {
            return [];
        }

        let result = entries;
        if (filter.command) {
            result = result.filter(e => e.command === filter.command);
        }
        if (filter.successOnly) {
            result = result.filter(e => e.success);
        }
        if (filter.failureOnly) {
            result = result.filter(e => !e.success);
        }
        if (filter.since) {
            result = result.filter(e => e.timestamp >= filter.since!);
        }
        if (filter.limit !== undefined && filter.limit > 0) {
            result = result.slice(-filter.limit);
        }

        return result;
    }

    public async getRecentFailures(limit = 5): Promise<AuditEntry[]> {
        return this.query({ failureOnly: true, limit });
    }

    public async count(): Promise<number> {
        const logPath = this.logPath;
        if (!(await this.fs.pathExists(logPath))) {
            return 0;
        }

        try {
            const content = await this.fs.readFile(logPath, 'utf-8');
            const lines = content.split(/\r?\n/);
            let count = 0;
            for (const line of lines) {
                if (line.trimStart().startsWith('{')) {
                    count += 1;
                }
            }
            return count;
        } catch {
            return 0;
        }
    }

    public async exists(): Promise<boolean> {
        return this.fs.pathExists(this.logPath);
    }
}
