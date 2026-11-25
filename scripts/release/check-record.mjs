import { randomUUID } from 'node:crypto';
import { closeSync, ftruncateSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync, writeSync } from 'node:fs';
import path from 'node:path';

const RECORD_FILE = 'release-check.json';
const STAGING_DIR = path.join('.cache', 'release-check');
const WINDOWS_RENAME_RETRY_MS = 10;
const WINDOWS_RENAME_TIMEOUT_MS = 1000;
const WINDOWS_RENAME_BUSY = new Set(['EACCES', 'EBUSY', 'EPERM']);

function readRecord(file) {
    try {
        return JSON.parse(readFileSync(file, 'utf-8'));
    } catch {
        return undefined;
    }
}

function serialize(record) {
    return JSON.stringify({ ...record, timestamp: new Date().toISOString() }, null, 2) + '\n';
}

function replaceRecord(pendingPath, currentPath) {
    const startedAt = performance.now();
    const pause = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    for (;;) {
        try {
            renameSync(pendingPath, currentPath);
            return;
        } catch (error) {
            // Windows 上读取或提交终态期间打开的文件句柄可能短暂阻塞替换。
            if (process.platform !== 'win32' || !WINDOWS_RENAME_BUSY.has(error.code)
                || performance.now() - startedAt >= WINDOWS_RENAME_TIMEOUT_MS) throw error;
            Atomics.wait(pause, 0, 0, WINDOWS_RENAME_RETRY_MS);
        }
    }
}

function finishReleaseCheck(currentPath, runId, commit, status) {
    const descriptor = openSync(currentPath, 'r+');
    try {
        // 用同一描述符确认归属并写入，避免覆盖检查期间替换到当前路径的新记录。
        if (readRecord(descriptor)?.runId !== runId) return;
        const data = Buffer.from(serialize({ runId, commit, status }));
        ftruncateSync(descriptor, 0);
        let offset = 0;
        while (offset < data.length) {
            offset += writeSync(descriptor, data, offset, data.length - offset, offset);
        }
    } finally {
        closeSync(descriptor);
    }
}

export function beginReleaseCheck(repoRoot) {
    const tmpDir = path.join(repoRoot, 'tmp');
    const stagingDir = path.join(tmpDir, STAGING_DIR);
    const currentPath = path.join(tmpDir, RECORD_FILE);
    const runId = randomUUID();
    const pendingPath = path.join(stagingDir, `${runId}.tmp`);
    mkdirSync(stagingDir, { recursive: true });
    try {
        writeFileSync(pendingPath, serialize({ runId, status: 'running' }), { flag: 'wx' });
        replaceRecord(pendingPath, currentPath);
    } finally {
        rmSync(pendingPath, { force: true });
    }
    return (commit, status) => finishReleaseCheck(currentPath, runId, commit, status);
}

export function readPassedReleaseCheck(repoRoot, commit) {
    const currentPath = path.join(repoRoot, 'tmp', RECORD_FILE);
    const result = readRecord(currentPath);
    // 旧记录只记成功，无法判断同一提交之后是否有失败或中断的检查。
    if (!result?.runId || result.commit !== commit || result.status !== 'passed') return undefined;
    if (readRecord(currentPath)?.runId === result.runId) return result;
}
