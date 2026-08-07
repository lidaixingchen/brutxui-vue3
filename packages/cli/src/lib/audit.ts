import fs from 'fs-extra';
import path from 'path';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { isGlobalDryRun } from './global-dry-run.js';

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

// 单一事实来源：AuditCommand 类型由 AUDIT_COMMANDS 推导，
// 新增命令类型只需改这一处，白名单与类型永不失步
export const AUDIT_COMMANDS = ['add', 'remove', 'update', 'diff'] as const;
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

export function getAuditLogPath(cwd: string): string {
    return path.join(cwd, AUDIT_LOG_RELATIVE_PATH);
}

/** 动态导入避免循环依赖；logger 不可用时静默（审计功能本身不应抛错） */
async function debugLog(message: string): Promise<void> {
    try {
        const { logger } = await import('./logger.js');
        logger.debug(message);
    } catch {
        // logger 不可用：静默丢弃
    }
}

/**
 * 追加一条审计记录到 `<cwd>/.brutx/audit.log`。
 * 写入失败不抛错——审计是辅助功能，不应阻塞主操作。
 */
export async function appendAuditLog(cwd: string, entry: AuditEntry): Promise<void> {
    // 全局 dry-run（BRUTX_DRY_RUN=1 / --dry-run）：所有写操作只打印不落盘，审计文件同样跳过
    if (isGlobalDryRun()) {
        return;
    }
    try {
        const logPath = getAuditLogPath(cwd);
        await fs.ensureDir(path.dirname(logPath));
        const line = JSON.stringify(entry) + '\n';
        await fs.appendFile(logPath, line, 'utf-8');
    } catch (error) {
        // 审计失败不阻塞主操作，仅 debug 日志
        const message = error instanceof Error ? error.message : String(error);
        await debugLog(`Failed to append audit log: ${message}`);
    }
}

/**
 * 读取审计日志，支持按命令/成功失败/时间/数量过滤。
 * 损坏的行跳过并 debug 日志（不抛错）。
 * 流式逐行读取：审计日志是 append-only 且无轮转，避免整体读入内存。
 */
export async function readAuditLog(
    cwd: string,
    filter: AuditReadFilter = {},
): Promise<AuditEntry[]> {
    const logPath = getAuditLogPath(cwd);
    if (!(await fs.pathExists(logPath))) {
        return [];
    }

    const entries: AuditEntry[] = [];

    try {
        const readline = createInterface({
            input: createReadStream(logPath),
            crlfDelay: Infinity,
        });

        for await (const line of readline) {
            if (line.length === 0) continue;
            try {
                const parsed = JSON.parse(line) as AuditEntry;
                if (!isValidAuditEntry(parsed)) {
                    await debugLog(`Skipping malformed audit entry: ${line.slice(0, 200)}`);
                    continue;
                }
                entries.push(parsed);
            } catch {
                await debugLog(`Skipping unparseable audit log line: ${line.slice(0, 200)}`);
            }
        }
    } catch (error) {
        // 读取失败（文件被并发删除等）：返回已解析部分，并记录失败原因便于定位
        const message = error instanceof Error ? error.message : String(error);
        await debugLog(`Failed to read audit log: ${message}`);
    }

    return applyFilter(entries, filter);
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
 * 注：appendAuditLog 自身保证不抛错（全局 dry-run 跳过 / 内部捕获），不会掩盖原错误。
 */
export async function withAuditLog<T>(
    cwd: string,
    entry: Omit<AuditEntry, 'timestamp' | 'success' | 'error'>,
    action: () => Promise<T>,
): Promise<T> {
    try {
        const result = await action();
        await appendAuditLog(cwd, createAuditEntry({
            ...entry,
            success: true,
        }));
        return result;
    } catch (error) {
        const errorMessage = sanitizeErrorMessage(error instanceof Error ? error.message : String(error));
        await appendAuditLog(cwd, createAuditEntry({
            ...entry,
            success: false,
            error: errorMessage,
        }));
        throw error;
    }
}

/** 审计日志持久保存：截断过长的错误消息，避免完整环境信息（路径/URL）长期留存 */
function sanitizeErrorMessage(message: string): string {
    const MAX_ERROR_LENGTH = 500;
    return message.length > MAX_ERROR_LENGTH
        ? `${message.slice(0, MAX_ERROR_LENGTH)}... (truncated)`
        : message;
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
 * 只按行计数（审计日志 append-only，非空行即一条记录），跳过 JSON 解析与校验。
 */
export async function countAuditEntries(cwd: string): Promise<number> {
    const logPath = getAuditLogPath(cwd);
    if (!(await fs.pathExists(logPath))) {
        return 0;
    }
    try {
        const readline = createInterface({
            input: createReadStream(logPath),
            crlfDelay: Infinity,
        });
        let count = 0;
        for await (const line of readline) {
            // 只计 JSON 对象行（'{\s*' 开头的行）：崩溃残留的半行/脏数据不计入，
            // 与 readAuditLog 的有效条目口径保持一致，避免 doctor 诊断总数虚高
            if (line.length > 0 && line.trimStart().startsWith('{')) count += 1;
        }
        return count;
    } catch {
        return 0;
    }
}
