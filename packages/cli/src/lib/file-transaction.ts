import fs from 'fs-extra';
import os from 'os';
import path from 'path';

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

    async ensureDir(dirPath: string): Promise<void> {
        this.assertActive();
        await this.snapshotMissingAncestors(dirPath);
        await fs.ensureDir(dirPath);
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        this.assertActive();
        const parentDir = path.dirname(filePath);
        await this.snapshotMissingAncestors(parentDir);
        await this.snapshot(filePath);
        await fs.ensureDir(parentDir);
        await fs.writeFile(filePath, content, 'utf-8');
    }

    async writeJson(filePath: string, data: unknown, options: { spaces?: number } = {}): Promise<void> {
        this.assertActive();
        const parentDir = path.dirname(filePath);
        await this.snapshotMissingAncestors(parentDir);
        await this.snapshot(filePath);
        await fs.ensureDir(parentDir);
        await fs.writeJson(filePath, data, options);
    }

    async remove(targetPath: string): Promise<void> {
        this.assertActive();
        await this.snapshot(targetPath);
        await fs.remove(targetPath);
    }

    async commit(): Promise<void> {
        this.assertActive();
        this.committed = true;
        this.finished = true;
        await this.cleanup();
    }

    async rollback(): Promise<string[]> {
        if (this.committed) {
            return [];
        }

        const failures: string[] = [];
        const entries = Array.from(this.snapshots.entries()).reverse();

        for (const [targetPath, snapshot] of entries) {
            try {
                if (snapshot.existed && snapshot.backupPath) {
                    // 先移除目标再复制备份：fs.copy 是合并语义，直接复制会残留事务期间新增的文件
                    await fs.remove(targetPath);
                    await fs.copy(snapshot.backupPath, targetPath);
                } else {
                    await fs.remove(targetPath);
                }
            } catch {
                failures.push(targetPath);
            }
        }

        // 全部回滚成功才清理备份并标记完成；存在失败时保留临时备份，便于调用方基于残留数据重试恢复
        if (failures.length === 0) {
            await this.cleanup();
            this.finished = true;
        }
        return failures;
    }

    private async snapshot(targetPath: string): Promise<void> {
        const resolvedPath = path.resolve(targetPath);
        if (this.snapshots.has(resolvedPath)) {
            return;
        }

        const existed = await fs.pathExists(resolvedPath);
        if (!existed) {
            this.snapshots.set(resolvedPath, { existed: false });
            return;
        }

        const tempDir = await this.getTempDir();
        const backupPath = path.join(tempDir, String(this.snapshots.size));
        try {
            await fs.copy(resolvedPath, backupPath);
        } catch (error) {
            // 复制备份失败时清理已创建的临时目录，避免孤儿临时文件残留
            await this.cleanup();
            throw error;
        }
        this.snapshots.set(resolvedPath, { existed: true, backupPath });
    }

    /**
     * 对 dirPath 及其缺失的祖先目录逐一快照，保证回滚时整条新建目录链可清理。
     * 已存在的目录无需整体备份（文件级变更已由目标路径自身快照覆盖）。
     */
    private async snapshotMissingAncestors(dirPath: string): Promise<void> {
        const resolvedDir = path.resolve(dirPath);
        const missingAncestors: string[] = [];
        let current = resolvedDir;
        while (current !== path.parse(current).root && !(await fs.pathExists(current))) {
            missingAncestors.unshift(current);
            current = path.dirname(current);
        }
        for (const dir of missingAncestors) {
            await this.snapshot(dir);
        }
    }

    private assertActive(): void {
        if (this.finished) {
            throw new Error('FileTransaction has been finished (committed or rolled back); further mutations are not allowed');
        }
    }

    private async getTempDir(): Promise<string> {
        if (!this.tempDir) {
            this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-tx-'));
        }
        return this.tempDir;
    }

    private async cleanup(): Promise<void> {
        if (this.tempDir) {
            await fs.remove(this.tempDir).catch(() => {});
            this.tempDir = null;
        }
        this.snapshots.clear();
    }
}
