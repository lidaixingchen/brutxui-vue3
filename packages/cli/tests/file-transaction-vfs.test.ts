import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { FileTransaction } from '../src/lib/file-transaction.js';

describe('FileTransaction with VFS and Built-in Security', () => {
    let fs: MemoryFileSystemAdapter;
    const projectCwd = process.platform === 'win32' ? 'C:/workspace/my-app' : '/workspace/my-app';

    beforeEach(async () => {
        fs = new MemoryFileSystemAdapter();
        await fs.ensureDir(projectCwd);
    });

    it('should write files and commit successfully in memory', async () => {
        const tx = new FileTransaction(fs, projectCwd);
        const fileA = path.join(projectCwd, 'src', 'a.ts');
        const fileB = path.join(projectCwd, 'src', 'b.json');

        await tx.writeFile(fileA, 'export const a = 1;');
        await tx.writeJson(fileB, { ok: true });

        expect(await fs.readFile(fileA)).toBe('export const a = 1;');
        expect(await fs.readJson(fileB)).toEqual({ ok: true });

        await tx.commit();

        // 提交后文件保留
        expect(await fs.pathExists(fileA)).toBe(true);
        expect(await fs.pathExists(fileB)).toBe(true);
    });

    it('should rollback added files and newly created ancestor directories on failure', async () => {
        const tx = new FileTransaction(fs, projectCwd);
        const deepFile = path.join(projectCwd, 'src', 'deep', 'nested', 'file.txt');

        await tx.writeFile(deepFile, 'temporary');
        expect(await fs.pathExists(deepFile)).toBe(true);

        const failures = await tx.rollback();
        expect(failures).toEqual([]);

        // 回滚后文件与新建目录被清理
        expect(await fs.pathExists(deepFile)).toBe(false);
        expect(await fs.pathExists(path.join(projectCwd, 'src', 'deep', 'nested'))).toBe(false);
    });

    it('should rollback overwritten files to original content', async () => {
        const target = path.join(projectCwd, 'src', 'config.json');
        await fs.writeJson(target, { version: '1.0.0' });

        const tx = new FileTransaction(fs, projectCwd);
        await tx.writeJson(target, { version: '2.0.0' });

        expect(await fs.readJson(target)).toEqual({ version: '2.0.0' });

        const failures = await tx.rollback();
        expect(failures).toEqual([]);

        expect(await fs.readJson(target)).toEqual({ version: '1.0.0' });
    });

    it('should intercept path traversal before writing (built-in assertSafePath)', async () => {
        const tx = new FileTransaction(fs, projectCwd);
        const unsafePath = path.join(projectCwd, '..', 'outside.txt');

        await expect(tx.writeFile(unsafePath, 'malicious')).rejects.toThrow(/Security Error.*outside the project/);
        expect(await fs.pathExists(unsafePath)).toBe(false);
    });

    it('should intercept symlink directory escape before write', async () => {
        const outsideDir = process.platform === 'win32' ? 'C:/workspace/other' : '/workspace/other';
        await fs.ensureDir(outsideDir);

        const symlinkDir = path.join(projectCwd, 'src', 'symlink-dir');
        await fs.symlink(outsideDir, symlinkDir);

        const tx = new FileTransaction(fs, projectCwd);
        const hijackedFile = path.join(symlinkDir, 'attack.txt');

        await expect(tx.writeFile(hijackedFile, 'payload')).rejects.toThrow(/Security Error.*outside the project/);
        expect(await fs.pathExists(path.join(outsideDir, 'attack.txt'))).toBe(false);
    });
});
