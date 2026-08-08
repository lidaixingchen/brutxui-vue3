import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { FileTransaction } from '../src/lib/file-transaction.js';

describe('FileTransaction', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-file-transaction-'));
    });

    afterEach(async () => {
        await fs.remove(tmpDir);
        vi.restoreAllMocks();
    });

    it('restores overwritten files and removes created files on rollback', async () => {
        const transaction = new FileTransaction();
        const existingPath = path.join(tmpDir, 'src', 'existing.ts');
        const createdPath = path.join(tmpDir, 'src', 'created.ts');

        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'original', 'utf-8');

        await transaction.writeFile(existingPath, 'changed');
        await transaction.writeFile(createdPath, 'created');

        expect(await fs.readFile(existingPath, 'utf-8')).toBe('changed');
        expect(await fs.pathExists(createdPath)).toBe(true);

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.readFile(existingPath, 'utf-8')).toBe('original');
        expect(await fs.pathExists(createdPath)).toBe(false);
    });

    it('restores removed directories on rollback', async () => {
        const transaction = new FileTransaction();
        const targetDir = path.join(tmpDir, 'components', 'button');
        const targetFile = path.join(targetDir, 'Button.vue');

        await fs.ensureDir(targetDir);
        await fs.writeFile(targetFile, '<template>Button</template>', 'utf-8');

        await transaction.remove(targetDir);

        expect(await fs.pathExists(targetDir)).toBe(false);

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.readFile(targetFile, 'utf-8')).toBe('<template>Button</template>');
    });

    it('removes directories created through ensureDir on rollback', async () => {
        const transaction = new FileTransaction();
        const createdDir = path.join(tmpDir, 'src', 'components', 'ui');

        await transaction.ensureDir(createdDir);

        expect(await fs.pathExists(createdDir)).toBe(true);

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.pathExists(createdDir)).toBe(false);
    });

    it('keeps changes after commit and makes rollback a no-op', async () => {
        const transaction = new FileTransaction();
        const targetPath = path.join(tmpDir, 'components.json');

        await transaction.writeJson(targetPath, { style: 'brutalism' }, { spaces: 2 });
        await transaction.commit();

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.readJson(targetPath)).toEqual({ style: 'brutalism' });
    });

    it('forbids commit after a successful rollback', async () => {
        const transaction = new FileTransaction();
        const targetPath = path.join(tmpDir, 'components.json');

        await transaction.writeJson(targetPath, { style: 'brutalism' }, { spaces: 2 });
        await expect(transaction.rollback()).resolves.toEqual([]);

        await expect(transaction.commit()).rejects.toThrow(/not active/);
    });

    it('forbids commit after a partial rollback with failures', async () => {
        const transaction = new FileTransaction();
        const existingPath = path.join(tmpDir, 'src', 'a.ts');
        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'original', 'utf-8');

        // 快照已存在文件（复制备份成功），回滚恢复时才走 fs.copy
        await transaction.writeFile(existingPath, 'changed');

        // 让回滚恢复备份的 fs.copy 失败，制造部分回滚
        const copySpy = vi.spyOn(fs, 'copy').mockRejectedValue(new Error('disk error'));
        const failures = await transaction.rollback();
        copySpy.mockRestore();
        expect(failures.length).toBeGreaterThan(0);

        // 部分回滚后 commit 应抛错，防止固化未回滚完成的变更
        await expect(transaction.commit()).rejects.toThrow(/not active/);
    });

    it('forbids further writes after a partial rollback with failures', async () => {
        const transaction = new FileTransaction();
        const existingPath = path.join(tmpDir, 'src', 'a.ts');
        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'original', 'utf-8');

        await transaction.writeFile(existingPath, 'changed');

        const copySpy = vi.spyOn(fs, 'copy').mockRejectedValue(new Error('disk error'));
        const failures = await transaction.rollback();
        copySpy.mockRestore();
        expect(failures.length).toBeGreaterThan(0);

        await expect(
            transaction.writeJson(path.join(tmpDir, 'other.json'), { a: 1 }),
        ).rejects.toThrow(/not active/);
    });

    it('retains prior backups when a later snapshot copy fails', async () => {
        const transaction = new FileTransaction();
        const existingPath = path.join(tmpDir, 'src', 'a.ts');
        const secondPath = path.join(tmpDir, 'src', 'b.ts');
        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'a', 'utf-8');
        await fs.writeFile(secondPath, 'b', 'utf-8');

        await transaction.writeFile(existingPath, 'a1'); // 快照 a.ts（复制备份成功）

        // 第二个文件快照的备份复制失败，不应清掉已成功登记的快照
        const copySpy = vi.spyOn(fs, 'copy').mockRejectedValue(new Error('disk error'));
        await expect(transaction.writeFile(secondPath, 'b1')).rejects.toThrow('disk error');
        copySpy.mockRestore();

        await expect(transaction.rollback()).resolves.toEqual([]);
        expect(await fs.readFile(existingPath, 'utf-8')).toBe('a');
    });
});
