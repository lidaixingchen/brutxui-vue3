import os from 'os';
import path from 'path';
import type { FileSystemAdapter, RemoveOptions } from './fs/file-system-adapter.js';
import { DiskFileSystemAdapter } from './fs/disk-fs.js';
import { assertSafePath, verifyWrittenPath } from './security.js';

interface Snapshot {
    existed: boolean;
    backupPath?: string;
}

export class FileTransaction {
    private snapshots = new Map<string, Snapshot>();
    private tempDir: string | null = null;
    private committed = false;
    /** commit/rollback 完成后置真，之后的一切写操作抛错，避免产生"半提交"变更 */
    private finished = false;
    /** rollback 存在失败项时置真，禁止 commit/写操作固化未回滚完成的变更 */
    private rollbackFailed = false;

    constructor(
        private readonly fs: FileSystemAdapter = new DiskFileSystemAdapter(),
        private readonly projectCwd: string = process.cwd()
    ) {}

    async ensureDir(dirPath: string): Promise<void> {
        this.assertActive();
        await this.snapshotMissingAncestors(dirPath);
        await this.fs.ensureDir(dirPath);
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        this.assertActive();
        await assertSafePath(filePath, this.projectCwd, this.fs);

        const parentDir = path.dirname(filePath);
        await this.snapshotMissingAncestors(parentDir);
        await this.snapshot(filePath);
        await this.fs.ensureDir(parentDir);
        await this.fs.writeFile(filePath, content, 'utf-8');
        await verifyWrittenPath(filePath, this.projectCwd, this.fs);
    }

    async writeJson(filePath: string, data: unknown, options: { spaces?: number } = {}): Promise<void> {
        this.assertActive();
        await assertSafePath(filePath, this.projectCwd, this.fs);

        const parentDir = path.dirname(filePath);
        await this.snapshotMissingAncestors(parentDir);
        await this.snapshot(filePath);
        await this.fs.ensureDir(parentDir);
        await this.fs.writeJson(filePath, data, options);
        await verifyWrittenPath(filePath, this.projectCwd, this.fs);
    }

    async remove(targetPath: string, options: RemoveOptions = {}): Promise<void> {
        this.assertActive();
        await this.snapshot(targetPath);
        await this.fs.remove(targetPath, options);
    }

    async commit(): Promise<void> {
        this.assertActive();
        this.committed = true;
        this.finished = true;
        await this.cleanup();
    }

    async rollback(): Promise<string[]> {
        if (this.committed || this.finished) {
            return [];
        }

        const failures: string[] = [];
        const entries = Array.from(this.snapshots.entries()).reverse();

        for (const [targetPath, snapshot] of entries) {
            try {
                if (snapshot.existed && snapshot.backupPath) {
                    // 先移除目标再复制备份：fs.copy 是合并语义，直接复制会残留事务期间新增的文件
                    await this.fs.remove(targetPath);
                    await this.fs.copy(snapshot.backupPath, targetPath);
                } else {
                    await this.fs.remove(targetPath);
                }
            } catch {
                failures.push(targetPath);
            }
        }

        // 全部回滚成功才清理备份并标记完成；存在失败时保留临时备份便于重试
        if (failures.length === 0) {
            await this.cleanup();
            this.finished = true;
            this.rollbackFailed = false;
        } else {
            this.rollbackFailed = true;
        }
        return failures;
    }

    private async snapshot(targetPath: string): Promise<void> {
        const resolvedPath = path.resolve(targetPath);
        if (this.snapshots.has(resolvedPath)) {
            return;
        }

        const existed = await this.fs.pathExists(resolvedPath);
        if (!existed) {
            this.snapshots.set(resolvedPath, { existed: false });
            return;
        }

        const tempDir = await this.getTempDir();
        const backupPath = path.join(tempDir, String(this.snapshots.size));
        try {
            await this.fs.copy(resolvedPath, backupPath);
        } catch (error) {
            if (Array.from(this.snapshots.values()).every((snap) => !snap.backupPath)) {
                try {
                    await this.fs.remove(tempDir);
                    this.tempDir = null;
                } catch {
                    // 移除失败时保留 tempDir 引用
                }
            }
            throw error;
        }
        this.snapshots.set(resolvedPath, { existed: true, backupPath });
    }

    /**
     * 对 dirPath 及其缺失的祖先目录逐一快照，保证回滚时整条新建目录链可清理。
     */
    private async snapshotMissingAncestors(dirPath: string): Promise<void> {
        const resolvedDir = path.resolve(dirPath);
        const missingAncestors: string[] = [];
        let current = resolvedDir;
        const root = path.parse(current).root;

        while (current !== root && !(await this.fs.pathExists(current))) {
            missingAncestors.unshift(current);
            current = path.dirname(current);
        }
        for (const dir of missingAncestors) {
            await this.snapshot(dir);
        }
    }

    private assertActive(): void {
        if (this.finished || this.rollbackFailed) {
            throw new Error('FileTransaction is not active (committed, rolled back, or failed to roll back); further mutations are not allowed');
        }
    }

    private async getTempDir(): Promise<string> {
        if (!this.tempDir) {
            this.tempDir = await this.fs.mkdtemp(path.join(os.tmpdir(), 'brutx-tx-'));
        }
        return this.tempDir;
    }

    private async cleanup(): Promise<void> {
        if (this.tempDir) {
            await this.fs.remove(this.tempDir).catch(() => {});
            this.tempDir = null;
        }
        this.snapshots.clear();
    }
}
