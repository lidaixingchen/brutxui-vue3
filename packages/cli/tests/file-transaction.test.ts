import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import { FileTransaction } from '../src/lib/file-transaction.js';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';

describe('FileTransaction with MemoryFS', () => {
    let fs: MemoryFileSystemAdapter;
    const projectCwd = process.platform === 'win32' ? 'C:/workspace/my-app' : '/workspace/my-app';

    beforeEach(async () => {
        fs = new MemoryFileSystemAdapter();
        await fs.ensureDir(projectCwd);
    });

    it('restores overwritten files and removes created files on rollback', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const existingPath = path.join(projectCwd, 'src', 'existing.ts');
        const createdPath = path.join(projectCwd, 'src', 'created.ts');

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
        const transaction = new FileTransaction(fs, projectCwd);
        const targetDir = path.join(projectCwd, 'components', 'button');
        const targetFile = path.join(targetDir, 'Button.vue');

        await fs.ensureDir(targetDir);
        await fs.writeFile(targetFile, '<template>Button</template>', 'utf-8');

        await transaction.remove(targetDir);

        expect(await fs.pathExists(targetDir)).toBe(false);

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.readFile(targetFile, 'utf-8')).toBe('<template>Button</template>');
    });

    it('removes directories created through ensureDir on rollback', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const createdDir = path.join(projectCwd, 'src', 'components', 'ui');

        await transaction.ensureDir(createdDir);

        expect(await fs.pathExists(createdDir)).toBe(true);

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.pathExists(createdDir)).toBe(false);
    });

    it('keeps changes after commit and makes rollback a no-op', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const targetPath = path.join(projectCwd, 'components.json');

        await transaction.writeJson(targetPath, { style: 'brutalism' }, { spaces: 2 });
        await transaction.commit();

        await expect(transaction.rollback()).resolves.toEqual([]);

        expect(await fs.readJson(targetPath)).toEqual({ style: 'brutalism' });
    });

    it('forbids commit after a successful rollback', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const targetPath = path.join(projectCwd, 'components.json');

        await transaction.writeJson(targetPath, { style: 'brutalism' }, { spaces: 2 });
        await expect(transaction.rollback()).resolves.toEqual([]);

        await expect(transaction.commit()).rejects.toThrow(/not active/);
    });

    it('forbids commit after a partial rollback with failures', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const existingPath = path.join(projectCwd, 'src', 'a.ts');
        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'original', 'utf-8');

        await transaction.writeFile(existingPath, 'changed');

        const copySpy = vi.spyOn(fs, 'copy').mockRejectedValue(new Error('memory copy error'));
        const failures = await transaction.rollback();
        copySpy.mockRestore();
        expect(failures.length).toBeGreaterThan(0);

        await expect(transaction.commit()).rejects.toThrow(/not active/);
    });

    it('forbids further writes after a partial rollback with failures', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const existingPath = path.join(projectCwd, 'src', 'a.ts');
        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'original', 'utf-8');

        await transaction.writeFile(existingPath, 'changed');

        const copySpy = vi.spyOn(fs, 'copy').mockRejectedValue(new Error('memory copy error'));
        const failures = await transaction.rollback();
        copySpy.mockRestore();
        expect(failures.length).toBeGreaterThan(0);

        await expect(
            transaction.writeJson(path.join(projectCwd, 'other.json'), { a: 1 }),
        ).rejects.toThrow(/not active/);
    });

    it('retains prior backups when a later snapshot copy fails', async () => {
        const transaction = new FileTransaction(fs, projectCwd);
        const existingPath = path.join(projectCwd, 'src', 'a.ts');
        const secondPath = path.join(projectCwd, 'src', 'b.ts');
        await fs.ensureDir(path.dirname(existingPath));
        await fs.writeFile(existingPath, 'a', 'utf-8');
        await fs.writeFile(secondPath, 'b', 'utf-8');

        await transaction.writeFile(existingPath, 'a1');

        const copySpy = vi.spyOn(fs, 'copy').mockRejectedValue(new Error('disk error'));
        await expect(transaction.writeFile(secondPath, 'b1')).rejects.toThrow('disk error');
        copySpy.mockRestore();

        await expect(transaction.rollback()).resolves.toEqual([]);
        expect(await fs.readFile(existingPath, 'utf-8')).toBe('a');
    });
});
