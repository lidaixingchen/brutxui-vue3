import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { AuditLogStorage } from '../../src/lib/storage/audit-storage.js';

describe('AuditLogStorage (Deep Module on VFS)', () => {
    let vfs: MemoryFileSystemAdapter;
    let audit: AuditLogStorage;
    const cwd = '/workspace/project';

    beforeEach(() => {
        vfs = new MemoryFileSystemAdapter();
        audit = new AuditLogStorage({
            fs: vfs,
            cwd,
        });
    });

    describe('审计日志追加与状态检测', () => {
        it('初始状态下日志应不存在且计数为 0', async () => {
            expect(await audit.exists()).toBe(false);
            expect(await audit.count()).toBe(0);
        });

        it('能够成功追加审计条目并更新计数', async () => {
            await audit.append({
                command: 'add',
                components: ['button', 'dialog'],
                cwd,
                success: true,
                dryRun: false,
                version: '0.10.2',
            });

            expect(await audit.exists()).toBe(true);
            expect(await audit.count()).toBe(1);

            const entries = await audit.query();
            expect(entries).toHaveLength(1);
            expect(entries[0].command).toBe('add');
            expect(entries[0].components).toEqual(['button', 'dialog']);
            expect(entries[0].timestamp).toBeDefined();
        });
    });

    describe('高阶修饰器 withAudit', () => {
        it('成功执行时自动记录 success=true', async () => {
            const result = await audit.withAudit(
                {
                    command: 'init',
                    components: [],
                    cwd,
                    dryRun: false,
                },
                async () => {
                    return { initialized: true };
                },
            );

            expect(result).toEqual({ initialized: true });
            const entries = await audit.query();
            expect(entries).toHaveLength(1);
            expect(entries[0].success).toBe(true);
            expect(entries[0].command).toBe('init');
        });

        it('执行失败时记录 success=false 与错误信息，并重新抛出异常', async () => {
            await expect(
                audit.withAudit(
                    {
                        command: 'add',
                        components: ['bad-component'],
                        cwd,
                        dryRun: false,
                    },
                    async () => {
                        throw new Error('Component not found in registry');
                    },
                ),
            ).rejects.toThrow('Component not found in registry');

            const entries = await audit.query();
            expect(entries).toHaveLength(1);
            expect(entries[0].success).toBe(false);
            expect(entries[0].error).toContain('Component not found in registry');

            const failures = await audit.getRecentFailures();
            expect(failures).toHaveLength(1);
            expect(failures[0].components).toEqual(['bad-component']);
        });
    });

    describe('容错与损坏行恢复', () => {
        it('遇到损坏或非 JSON 行时应自动跳过且不崩溃', async () => {
            await audit.append({
                command: 'add',
                components: ['a'],
                cwd,
                success: true,
                dryRun: false,
            });

            // 人工在文件追加损坏行
            const logPath = '/workspace/project/.brutx/audit.log';
            const raw = await vfs.readFile(logPath);
            await vfs.writeFile(logPath, raw + 'broken json line...\n{"incomplete":\n');

            await audit.append({
                command: 'remove',
                components: ['b'],
                cwd,
                success: true,
                dryRun: false,
            });

            const entries = await audit.query();
            expect(entries).toHaveLength(2);
            expect(entries[0].command).toBe('add');
            expect(entries[1].command).toBe('remove');
        });
    });
});
