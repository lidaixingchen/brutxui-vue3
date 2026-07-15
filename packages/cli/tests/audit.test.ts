import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';

const {
    appendAuditLog,
    readAuditLog,
    getRecentFailures,
    getRecentByCommand,
    createAuditEntry,
    withAuditLog,
    auditLogExists,
    countAuditEntries,
    getAuditLogPath,
    AUDIT_LOG_RELATIVE_PATH,
} = await import('../src/lib/audit.js');

let tmpDir: string;

describe('audit log (P1-8)', () => {
    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-audit-test-'));
    });

    afterEach(async () => {
        await fs.remove(tmpDir);
    });

    describe('appendAuditLog', () => {
        it('appends a JSONL entry to .brutx/audit.log', async () => {
            const entry = createAuditEntry({
                command: 'add',
                components: ['button'],
                cwd: tmpDir,
                success: true,
                dryRun: false,
                registrySource: 'https://reg.test',
            });

            await appendAuditLog(tmpDir, entry);

            const logPath = getAuditLogPath(tmpDir);
            expect(await fs.pathExists(logPath)).toBe(true);

            const content = await fs.readFile(logPath, 'utf-8');
            const lines = content.trim().split('\n');
            expect(lines.length).toBe(1);

            const parsed = JSON.parse(lines[0]);
            expect(parsed.command).toBe('add');
            expect(parsed.components).toEqual(['button']);
            expect(parsed.success).toBe(true);
            expect(parsed.dryRun).toBe(false);
            expect(parsed.timestamp).toBeDefined();
        });

        it('appends multiple entries as separate JSONL lines', async () => {
            for (let i = 0; i < 3; i++) {
                await appendAuditLog(tmpDir, createAuditEntry({
                    command: 'add',
                    components: [`comp${i}`],
                    cwd: tmpDir,
                    success: true,
                    dryRun: false,
                }));
            }

            const content = await fs.readFile(getAuditLogPath(tmpDir), 'utf-8');
            const lines = content.trim().split('\n');
            expect(lines.length).toBe(3);
        });

        it('does not throw on write failure (audit is non-blocking)', async () => {
            // 指向一个不可能写入的路径（文件作为目录）
            const filePath = path.join(tmpDir, 'blocking-file');
            await fs.writeFile(filePath, 'block', 'utf-8');

            await expect(appendAuditLog(filePath, createAuditEntry({
                command: 'add',
                components: ['button'],
                cwd: filePath,
                success: true,
                dryRun: false,
            }))).resolves.toBeUndefined();
        });
    });

    describe('readAuditLog', () => {
        it('returns empty array when audit log does not exist', async () => {
            const entries = await readAuditLog(tmpDir);
            expect(entries).toEqual([]);
        });

        it('reads and parses all entries', async () => {
            await appendAuditLog(tmpDir, createAuditEntry({
                command: 'add',
                components: ['button'],
                cwd: tmpDir,
                success: true,
                dryRun: false,
            }));
            await appendAuditLog(tmpDir, createAuditEntry({
                command: 'remove',
                components: ['badge'],
                cwd: tmpDir,
                success: false,
                dryRun: false,
                error: 'test error',
            }));

            const entries = await readAuditLog(tmpDir);
            expect(entries.length).toBe(2);
            expect(entries[0].command).toBe('add');
            expect(entries[1].command).toBe('remove');
            expect(entries[1].success).toBe(false);
            expect(entries[1].error).toBe('test error');
        });

        it('filters by command', async () => {
            await appendAuditLog(tmpDir, createAuditEntry({
                command: 'add',
                components: ['button'],
                cwd: tmpDir,
                success: true,
                dryRun: false,
            }));
            await appendAuditLog(tmpDir, createAuditEntry({
                command: 'remove',
                components: ['badge'],
                cwd: tmpDir,
                success: true,
                dryRun: false,
            }));

            const addEntries = await readAuditLog(tmpDir, { command: 'add' });
            expect(addEntries.length).toBe(1);
            expect(addEntries[0].command).toBe('add');
        });

        it('filters by success/failure', async () => {
            await appendAuditLog(tmpDir, createAuditEntry({
                command: 'add',
                components: ['ok'],
                cwd: tmpDir,
                success: true,
                dryRun: false,
            }));
            await appendAuditLog(tmpDir, createAuditEntry({
                command: 'add',
                components: ['fail'],
                cwd: tmpDir,
                success: false,
                dryRun: false,
            }));

            const successes = await readAuditLog(tmpDir, { successOnly: true });
            const failures = await readAuditLog(tmpDir, { failureOnly: true });
            expect(successes.length).toBe(1);
            expect(successes[0].components).toEqual(['ok']);
            expect(failures.length).toBe(1);
            expect(failures[0].components).toEqual(['fail']);
        });

        it('respects limit filter (keeps last N)', async () => {
            for (let i = 0; i < 5; i++) {
                await appendAuditLog(tmpDir, createAuditEntry({
                    command: 'add',
                    components: [`comp${i}`],
                    cwd: tmpDir,
                    success: true,
                    dryRun: false,
                }));
            }

            const last2 = await readAuditLog(tmpDir, { limit: 2 });
            expect(last2.length).toBe(2);
            expect(last2[0].components).toEqual(['comp3']);
            expect(last2[1].components).toEqual(['comp4']);
        });

        it('skips malformed lines without throwing', async () => {
            const logPath = getAuditLogPath(tmpDir);
            await fs.ensureDir(path.dirname(logPath));
            await fs.writeFile(logPath, '{"valid":true}\nnot-json\n{"command":"add","components":["ok"],"cwd":"' + tmpDir.replace(/\\/g, '\\\\') + '","success":true,"dryRun":false,"timestamp":"2026-01-01T00:00:00Z"}\n', 'utf-8');

            const entries = await readAuditLog(tmpDir);
            // 第一行缺少必要字段，第三行有效；第二行不是 JSON
            expect(entries.length).toBe(1);
            expect(entries[0].command).toBe('add');
        });
    });

    describe('getRecentFailures', () => {
        it('returns only failure entries limited to N', async () => {
            await appendAuditLog(tmpDir, createAuditEntry({
                command: 'add',
                components: ['ok'],
                cwd: tmpDir,
                success: true,
                dryRun: false,
            }));
            for (let i = 0; i < 3; i++) {
                await appendAuditLog(tmpDir, createAuditEntry({
                    command: 'update',
                    components: [`fail${i}`],
                    cwd: tmpDir,
                    success: false,
                    dryRun: false,
                    error: `err${i}`,
                }));
            }

            const failures = await getRecentFailures(tmpDir, 2);
            expect(failures.length).toBe(2);
            expect(failures[0].components).toEqual(['fail1']);
            expect(failures[1].components).toEqual(['fail2']);
        });
    });

    describe('getRecentByCommand', () => {
        it('returns entries filtered by command type', async () => {
            await appendAuditLog(tmpDir, createAuditEntry({
                command: 'add',
                components: ['button'],
                cwd: tmpDir,
                success: true,
                dryRun: false,
            }));
            await appendAuditLog(tmpDir, createAuditEntry({
                command: 'diff',
                components: ['button'],
                cwd: tmpDir,
                success: true,
                dryRun: false,
            }));

            const diffs = await getRecentByCommand(tmpDir, 'diff', 5);
            expect(diffs.length).toBe(1);
            expect(diffs[0].command).toBe('diff');
        });
    });

    describe('withAuditLog', () => {
        it('records success entry when action succeeds', async () => {
            const result = await withAuditLog(
                tmpDir,
                {
                    command: 'add',
                    components: ['button'],
                    cwd: tmpDir,
                    dryRun: false,
                },
                async () => 'success-result',
            );

            expect(result).toBe('success-result');

            const entries = await readAuditLog(tmpDir);
            expect(entries.length).toBe(1);
            expect(entries[0].success).toBe(true);
            expect(entries[0].error).toBeUndefined();
        });

        it('records failure entry and rethrows when action throws', async () => {
            await expect(withAuditLog(
                tmpDir,
                {
                    command: 'remove',
                    components: ['button'],
                    cwd: tmpDir,
                    dryRun: false,
                },
                async () => { throw new Error('action failed'); },
            )).rejects.toThrow('action failed');

            const entries = await readAuditLog(tmpDir);
            expect(entries.length).toBe(1);
            expect(entries[0].success).toBe(false);
            expect(entries[0].error).toBe('action failed');
        });
    });

    describe('auditLogExists and countAuditEntries', () => {
        it('returns false when no audit log exists', async () => {
            expect(await auditLogExists(tmpDir)).toBe(false);
            expect(await countAuditEntries(tmpDir)).toBe(0);
        });

        it('returns true and counts entries after writes', async () => {
            await appendAuditLog(tmpDir, createAuditEntry({
                command: 'add',
                components: ['button'],
                cwd: tmpDir,
                success: true,
                dryRun: false,
            }));
            await appendAuditLog(tmpDir, createAuditEntry({
                command: 'add',
                components: ['badge'],
                cwd: tmpDir,
                success: true,
                dryRun: false,
            }));

            expect(await auditLogExists(tmpDir)).toBe(true);
            expect(await countAuditEntries(tmpDir)).toBe(2);
        });
    });

    describe('constants', () => {
        it('AUDIT_LOG_RELATIVE_PATH points to .brutx/audit.log', () => {
            expect(AUDIT_LOG_RELATIVE_PATH).toBe('.brutx/audit.log');
        });

        it('getAuditLogPath joins cwd with relative path', () => {
            const logPath = getAuditLogPath('/fake/cwd');
            expect(logPath).toBe(path.join('/fake/cwd', '.brutx', 'audit.log'));
        });
    });
});
