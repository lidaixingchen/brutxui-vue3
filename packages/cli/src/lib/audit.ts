import fs from 'fs-extra';
import path from 'path';

/**
 * CLI 操作审计日志（P1-8）
 *
 * 写入位置：`<cwd>/.brutx/audit.log`（JSONL，每行一条记录）
 * 记录 add/remove/update/diff 的操作类型、组件名、源、integrity、时间戳、是否成功。
 * doctor 可读审计日志辅助诊断（如"上次 update 失败"）。
 *
 * 设计原则：
 * - 追加写入，不修改已有记录（append-only）
 * - 写入失败不应影响主操作（捕获错误，仅 debug 日志）
 * - dry-run 模式下仍记录（标注 dryRun=true），便于审计
 * - 全局 dry-run（BRUTX_DRY_RUN=1）时不写入审计文件，但仍可通过 doctor 查看
 */

export const AUDIT_LOG_RELATIVE_PATH = '.brutx/audit.log';

export type AuditCommand = 'add' | 'remove' | 'update' | 'diff';

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

export function getAuditLogPath(cwd: string): string {
    return path.join(cwd, AUDIT_LOG_RELATIVE_PATH);
}

/**
 * 追加一条审计记录到 `<cwd>/.brutx/audit.log`。
 * 写入失败不抛错——审计是辅助功能，不应阻塞主操作。
 */
export async function appendAuditLog(cwd: string, entry: AuditEntry): Promise<void> {
    try {
        const logPath = getAuditLogPath(cwd);
        await fs.ensureDir(path.dirname(logPath));
        const line = JSON.stringify(entry) + '\n';
        await fs.appendFile(logPath, line, 'utf-8');
    } catch (error) {
        // 审计失败不阻塞主操作，仅 debug 日志
        const message = error instanceof Error ? error.message : String(error);
        // 动态导入避免循环依赖
        const { logger } = await import('./logger.js');
        logger.debug(`Failed to append audit log: ${message}`);
    }
}

/**
 * 读取审计日志，支持按命令/成功失败/时间/数量过滤。
 * 损坏的行跳过并 debug 日志（不抛错）。
 */
export async function readAuditLog(
    cwd: string,
    filter: AuditReadFilter = {},
): Promise<AuditEntry[]> {
    const logPath = getAuditLogPath(cwd);
    if (!(await fs.pathExists(logPath))) {
        return [];
    }

    let content: string;
    try {
        content = await fs.readFile(logPath, 'utf-8');
    } catch {
        return [];
    }

    const lines = content.split('\n').filter(line => line.length > 0);
    const entries: AuditEntry[] = [];
    const { logger } = await import('./logger.js');

    for (const line of lines) {
        try {
            const parsed = JSON.parse(line) as AuditEntry;
            if (!isValidAuditEntry(parsed)) {
                logger.debug(`Skipping malformed audit entry: ${line.slice(0, 200)}`);
                continue;
            }
            entries.push(parsed);
        } catch {
            logger.debug(`Skipping unparseable audit log line: ${line.slice(0, 200)}`);
        }
    }

    return applyFilter(entries, filter);
}

function isValidAuditEntry(value: unknown): value is AuditEntry {
    if (typeof value !== 'object' || value === null) return false;
    const entry = value as Partial<AuditEntry>;
    return typeof entry.timestamp === 'string'
        && typeof entry.command === 'string'
        && Array.isArray(entry.components)
        && typeof entry.success === 'boolean'
        && typeof entry.dryRun === 'boolean'
        && typeof entry.cwd === 'string';
}

function applyFilter(entries: AuditEntry[], filter: AuditReadFilter): AuditEntry[] {
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
        // 保留最后 N 条（按时间顺序）
        result = result.slice(-filter.limit);
    }

    return result;
}

/**
 * 获取最近的失败记录（供 doctor 诊断"上次 update 失败"等线索）。
 */
export async function getRecentFailures(
    cwd: string,
    limit = 5,
): Promise<AuditEntry[]> {
    return readAuditLog(cwd, { failureOnly: true, limit });
}

/**
 * 获取某命令的最近记录。
 */
export async function getRecentByCommand(
    cwd: string,
    command: AuditCommand,
    limit = 5,
): Promise<AuditEntry[]> {
    return readAuditLog(cwd, { command, limit });
}

/**
 * 构造审计条目的辅助函数。
 */
export function createAuditEntry(params: {
    command: AuditCommand;
    components: string[];
    cwd: string;
    success: boolean;
    dryRun: boolean;
    registrySource?: string;
    integrity?: string;
    version?: string;
    error?: string;
}): AuditEntry {
    return {
        timestamp: new Date().toISOString(),
        command: params.command,
        components: params.components,
        cwd: params.cwd,
        success: params.success,
        dryRun: params.dryRun,
        registrySource: params.registrySource,
        integrity: params.integrity,
        version: params.version,
        error: params.error,
    };
}

/**
 * 用 try/catch 包装命令执行，自动写入审计记录。
 * 成功/失败都会记录。失败时重新抛出原错误。
 */
export async function withAuditLog<T>(
    cwd: string,
    entry: Omit<AuditEntry, 'timestamp' | 'success' | 'error'>,
    action: () => Promise<T>,
): Promise<T> {
    try {
        const result = await action();
        await appendAuditLog(cwd, {
            ...entry,
            timestamp: new Date().toISOString(),
            success: true,
        } as AuditEntry);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await appendAuditLog(cwd, {
            ...entry,
            timestamp: new Date().toISOString(),
            success: false,
            error: errorMessage,
        } as AuditEntry);
        throw error;
    }
}

/**
 * 检测审计日志是否存在（供 doctor 报告用）。
 */
export async function auditLogExists(cwd: string): Promise<boolean> {
    const logPath = getAuditLogPath(cwd);
    return fs.pathExists(logPath);
}

/**
 * 统计审计日志条目数（供 doctor 报告用）。
 */
export async function countAuditEntries(cwd: string): Promise<number> {
    const entries = await readAuditLog(cwd);
    return entries.length;
}
