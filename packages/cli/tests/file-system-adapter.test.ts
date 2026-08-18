import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { DiskFileSystemAdapter } from '../src/lib/fs/disk-fs.js';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import type { FileSystemAdapter } from '../src/lib/fs/file-system-adapter.js';

describe('FileSystemAdapter Contract (DiskFS & MemoryFS)', () => {
    const runTestSuite = (name: string, createAdapter: () => Promise<{ adapter: FileSystemAdapter; cleanup?: () => Promise<void>; rootDir: string }>) => {
        describe(name, () => {
            let adapter: FileSystemAdapter;
            let cleanup: (() => Promise<void>) | undefined;
            let rootDir: string;

            beforeEach(async () => {
                const setup = await createAdapter();
                adapter = setup.adapter;
                cleanup = setup.cleanup;
                rootDir = setup.rootDir;

                return async () => {
                    if (cleanup) await cleanup();
                };
            });

            it('should read and write text files correctly', async () => {
                const filePath = path.join(rootDir, 'test.txt');
                expect(await adapter.pathExists(filePath)).toBe(false);

                await adapter.writeFile(filePath, 'hello world');
                expect(await adapter.pathExists(filePath)).toBe(true);

                const content = await adapter.readFile(filePath);
                expect(content).toBe('hello world');
            });

            it('should read and write json files correctly', async () => {
                const jsonPath = path.join(rootDir, 'config.json');
                const data = { name: 'brutx', version: '0.1.0', items: [1, 2, 3] };

                await adapter.writeJson(jsonPath, data, { spaces: 2 });
                expect(await adapter.pathExists(jsonPath)).toBe(true);

                const readData = await adapter.readJson<typeof data>(jsonPath);
                expect(readData).toEqual(data);
            });

            it('should create directories recursively with ensureDir', async () => {
                const deepDir = path.join(rootDir, 'a', 'b', 'c');
                expect(await adapter.pathExists(deepDir)).toBe(false);

                await adapter.ensureDir(deepDir);
                expect(await adapter.pathExists(deepDir)).toBe(true);

                const stat = await adapter.stat(deepDir);
                expect(stat.isDirectory()).toBe(true);
                expect(stat.isFile()).toBe(false);
            });

            it('should list directory entries with and without file types', async () => {
                const subDir = path.join(rootDir, 'sub');
                await adapter.ensureDir(subDir);
                await adapter.writeFile(path.join(subDir, 'file1.txt'), 'content1');
                await adapter.writeFile(path.join(subDir, 'file2.txt'), 'content2');
                await adapter.ensureDir(path.join(subDir, 'nested-dir'));

                // string[] overload
                const entries = await adapter.readdir(subDir);
                expect(entries.sort()).toEqual(['file1.txt', 'file2.txt', 'nested-dir'].sort());

                // FileEntry[] overload
                const detailedEntries = await adapter.readdir(subDir, { withFileTypes: true });
                expect(detailedEntries.length).toBe(3);

                const file1 = detailedEntries.find((e) => e.name === 'file1.txt');
                expect(file1).toBeDefined();
                expect(file1?.isFile()).toBe(true);
                expect(file1?.isDirectory()).toBe(false);

                const nested = detailedEntries.find((e) => e.name === 'nested-dir');
                expect(nested).toBeDefined();
                expect(nested?.isDirectory()).toBe(true);
                expect(nested?.isFile()).toBe(false);
            });

            it('should remove files and directories', async () => {
                const filePath = path.join(rootDir, 'to-remove.txt');
                await adapter.writeFile(filePath, 'delete me');
                expect(await adapter.pathExists(filePath)).toBe(true);

                await adapter.remove(filePath);
                expect(await adapter.pathExists(filePath)).toBe(false);

                const dirPath = path.join(rootDir, 'dir-to-remove');
                await adapter.ensureDir(path.join(dirPath, 'child'));
                await adapter.writeFile(path.join(dirPath, 'child', 'file.txt'), 'abc');

                await adapter.remove(dirPath, { recursive: true });
                expect(await adapter.pathExists(dirPath)).toBe(false);
            });

            it('should copy files and directories', async () => {
                const srcFile = path.join(rootDir, 'src.txt');
                const destFile = path.join(rootDir, 'dest.txt');
                await adapter.writeFile(srcFile, 'copy content');

                await adapter.copy(srcFile, destFile);
                expect(await adapter.pathExists(destFile)).toBe(true);
                expect(await adapter.readFile(destFile)).toBe('copy content');

                const srcDir = path.join(rootDir, 'src-dir');
                const destDir = path.join(rootDir, 'dest-dir');
                await adapter.ensureDir(srcDir);
                await adapter.writeFile(path.join(srcDir, 'a.txt'), 'aaa');

                await adapter.copy(srcDir, destDir);
                expect(await adapter.pathExists(path.join(destDir, 'a.txt'))).toBe(true);
                expect(await adapter.readFile(path.join(destDir, 'a.txt'))).toBe('aaa');
            });

            it('should create unique temp directories with mkdtemp', async () => {
                const prefix = path.join(rootDir, 'temp-');
                const temp1 = await adapter.mkdtemp(prefix);
                const temp2 = await adapter.mkdtemp(prefix);

                expect(temp1).not.toBe(temp2);
                expect(await adapter.pathExists(temp1)).toBe(true);
                expect(await adapter.pathExists(temp2)).toBe(true);
            });

            it('should resolve realpath', async () => {
                const target = path.join(rootDir, 'real.txt');
                await adapter.writeFile(target, 'real');

                const real = await adapter.realpath(target);
                const normalize = (p: string): string => p.toLowerCase().replace(/\\/g, '/');
                const expectedReal = adapter instanceof DiskFileSystemAdapter
                    ? await fs.promises.realpath(target)
                    : target;
                expect(normalize(real)).toBe(normalize(expectedReal));
            });
        });
    };

    // 1. 测试 MemoryFileSystemAdapter
    runTestSuite('MemoryFileSystemAdapter', async () => {
        const rootDir = process.platform === 'win32' ? 'C:/virtual/project' : '/virtual/project';
        const adapter = new MemoryFileSystemAdapter();
        await adapter.ensureDir(rootDir);
        return {
            adapter,
            rootDir,
        };
    });

    // 2. 测试 DiskFileSystemAdapter
    runTestSuite('DiskFileSystemAdapter', async () => {
        const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-disk-fs-test-'));
        const adapter = new DiskFileSystemAdapter();
        return {
            adapter,
            rootDir: tempRoot,
            cleanup: async () => {
                await fs.remove(tempRoot).catch(() => {});
            },
        };
    });
});
