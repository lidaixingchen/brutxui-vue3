import { describe, it, expect, afterEach } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import { promises as fs } from 'node:fs';
import { DiskFileSystemAdapter } from '../../src/fs/disk-fs.js';

describe('DiskFileSystemAdapter', () => {
    const diskFs = new DiskFileSystemAdapter();
    let tempDir: string | null = null;

    afterEach(async () => {
        if (tempDir) {
            await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
            tempDir = null;
        }
    });

    it('能够创建临时目录、读写文件与递归确保目录', async () => {
        tempDir = await diskFs.mkdtemp(path.join(os.tmpdir(), 'brutx-disk-test-'));
        expect(await diskFs.pathExists(tempDir)).toBe(true);

        const filePath = path.join(tempDir, 'sub', 'test.json');
        const data = { hello: 'world', ts: 123 };
        await diskFs.writeJson(filePath, data);

        expect(await diskFs.pathExists(filePath)).toBe(true);
        const readData = await diskFs.readJson(filePath);
        expect(readData).toEqual(data);
    });

    it('支持 lstat 与 stat 查询', async () => {
        tempDir = await diskFs.mkdtemp(path.join(os.tmpdir(), 'brutx-disk-test-'));
        const filePath = path.join(tempDir, 'file.txt');
        await diskFs.writeFile(filePath, 'plain text');

        const fileStat = await diskFs.stat(filePath);
        expect(fileStat.isFile()).toBe(true);
        expect(fileStat.size).toBeGreaterThan(0);

        const fileLstat = await diskFs.lstat(filePath);
        expect(fileLstat.isFile()).toBe(true);
        expect(fileLstat.isSymbolicLink()).toBe(false);
    });

    it('支持 readdir 与 withFileTypes', async () => {
        tempDir = await diskFs.mkdtemp(path.join(os.tmpdir(), 'brutx-disk-test-'));
        await diskFs.writeFile(path.join(tempDir, 'a.txt'), 'a');
        await diskFs.ensureDir(path.join(tempDir, 'sub'));

        const names = await diskFs.readdir(tempDir);
        expect(names.sort()).toEqual(['a.txt', 'sub'].sort());

        const entries = await diskFs.readdir(tempDir, { withFileTypes: true });
        const aEntry = entries.find(e => e.name === 'a.txt');
        const subEntry = entries.find(e => e.name === 'sub');

        expect(aEntry?.isFile()).toBe(true);
        expect(subEntry?.isDirectory()).toBe(true);
    });

    it('支持 copy、remove 与 realpath', async () => {
        tempDir = await diskFs.mkdtemp(path.join(os.tmpdir(), 'brutx-disk-test-'));
        const src = path.join(tempDir, 'source.txt');
        const dest = path.join(tempDir, 'dest.txt');
        await diskFs.writeFile(src, 'content');

        await diskFs.copy(src, dest);
        expect(await diskFs.readFile(dest)).toBe('content');

        const real = await diskFs.realpath(dest);
        expect(real).toBeDefined();

        await diskFs.remove(dest);
        expect(await diskFs.pathExists(dest)).toBe(false);
    });
});
