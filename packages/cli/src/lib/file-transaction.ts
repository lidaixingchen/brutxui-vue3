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

    async ensureDir(dirPath: string): Promise<void> {
        await this.snapshot(dirPath);
        await fs.ensureDir(dirPath);
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        await this.snapshot(path.dirname(filePath));
        await this.snapshot(filePath);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, content, 'utf-8');
    }

    async writeJson(filePath: string, data: unknown, options: { spaces?: number } = {}): Promise<void> {
        await this.snapshot(path.dirname(filePath));
        await this.snapshot(filePath);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeJson(filePath, data, options);
    }

    async remove(targetPath: string): Promise<void> {
        await this.snapshot(targetPath);
        await fs.remove(targetPath);
    }

    async commit(): Promise<void> {
        this.committed = true;
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
                    await fs.copy(snapshot.backupPath, targetPath);
                } else {
                    await fs.remove(targetPath);
                }
            } catch {
                failures.push(targetPath);
            }
        }

        await this.cleanup();
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
        await fs.copy(resolvedPath, backupPath);
        this.snapshots.set(resolvedPath, { existed: true, backupPath });
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
