import path from 'node:path';
import { DiskFileSystemAdapter, type FileSystemAdapter } from 'brutx-shared-vue/fs';
import {
    AuditLogStorage,
    AUDIT_LOG_RELATIVE_PATH,
    AUDIT_COMMANDS,
    type AuditCommand,
    type AuditEntry,
    type AuditReadFilter,
} from './storage/audit-storage.js';

export {
    AuditLogStorage,
    AUDIT_LOG_RELATIVE_PATH,
    AUDIT_COMMANDS,
    type AuditCommand,
    type AuditEntry,
    type AuditReadFilter,
};

const defaultDiskFs = new DiskFileSystemAdapter();

function getStorage(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): AuditLogStorage {
    return new AuditLogStorage({ fs: fsAdapter, cwd });
}

export function getAuditLogPath(cwd: string): string {
    return path.join(cwd, AUDIT_LOG_RELATIVE_PATH);
}

export async function appendAuditLog(cwd: string, entry: AuditEntry): Promise<void> {
    await getStorage(cwd).append(entry);
}

export async function readAuditLog(
    cwd: string,
    filter: AuditReadFilter = {},
): Promise<AuditEntry[]> {
    return getStorage(cwd).query(filter);
}

export async function getRecentFailures(
    cwd: string,
    limit = 5,
): Promise<AuditEntry[]> {
    return getStorage(cwd).getRecentFailures(limit);
}

export async function getRecentByCommand(
    cwd: string,
    command: AuditCommand,
    limit = 5,
): Promise<AuditEntry[]> {
    return getStorage(cwd).query({ command, limit });
}

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

export async function withAuditLog<T>(
    cwd: string,
    entry: Omit<AuditEntry, 'timestamp' | 'success' | 'error'>,
    action: () => Promise<T>,
): Promise<T> {
    return getStorage(cwd).withAudit(entry, action);
}

export async function auditLogExists(cwd: string): Promise<boolean> {
    return getStorage(cwd).exists();
}

export async function countAuditEntries(cwd: string): Promise<number> {
    return getStorage(cwd).count();
}
