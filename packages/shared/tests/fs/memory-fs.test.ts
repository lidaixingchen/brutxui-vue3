import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryFileSystemAdapter } from '../../src/fs/memory-fs.js';

describe('MemoryFileSystemAdapter', () => {
    let vfs: MemoryFileSystemAdapter;

    beforeEach(() => {
        vfs = new MemoryFileSystemAdapter();
    });

    describe('基础读写与目录操作', () => {
        it('能够写入并读取文件内容', async () => {
            await vfs.writeFile('/test/hello.txt', 'Hello World');
            const content = await vfs.readFile('/test/hello.txt');
            expect(content).toBe('Hello World');
        });

        it('能够自动递归创建父级目录', async () => {
            await vfs.writeFile('/nested/deep/path/file.txt', 'nested content');
            expect(await vfs.pathExists('/nested/deep/path/file.txt')).toBe(true);
            expect(await vfs.pathExists('/nested/deep/path')).toBe(true);
            expect(await vfs.pathExists('/nested/deep')).toBe(true);
        });

        it('读取不存在的文件应抛出明确异常', async () => {
            await expect(vfs.readFile('/not-exist.txt')).rejects.toThrow();
        });

        it('能够读写 JSON 数据', async () => {
            const data = { name: 'brutx', version: '1.0.0', features: ['vfs', 'tokens'] };
            await vfs.writeJson('/config.json', data);
            const loaded = await vfs.readJson('/config.json');
            expect(loaded).toEqual(data);
        });
    });

    describe('文件元数据与状态查询 (stat / lstat)', () => {
        it('能够正确判断文件与目录状态', async () => {
            await vfs.writeFile('/a/b/file.ts', 'export const x = 1;');
            const fileStat = await vfs.stat('/a/b/file.ts');
            expect(fileStat.isFile()).toBe(true);
            expect(fileStat.isDirectory()).toBe(false);
            expect(fileStat.size).toBeGreaterThan(0);

            const dirStat = await vfs.stat('/a/b');
            expect(dirStat.isDirectory()).toBe(true);
            expect(dirStat.isFile()).toBe(false);
        });

        it('支持必选的 lstat 契约', async () => {
            await vfs.writeFile('/file.txt', 'content');
            const lstatResult = await vfs.lstat('/file.txt');
            expect(lstatResult.isFile()).toBe(true);
            expect(lstatResult.isSymbolicLink()).toBe(false);
        });
    });

    describe('目录遍历 (readdir)', () => {
        it('支持返回纯文件名列表', async () => {
            await vfs.writeFile('/root/a.txt', 'a');
            await vfs.writeFile('/root/b.txt', 'b');
            await vfs.writeFile('/root/sub/c.txt', 'c');

            const entries = await vfs.readdir('/root');
            expect(entries.sort()).toEqual(['a.txt', 'b.txt', 'sub'].sort());
        });

        it('支持 withFileTypes 返回 FileEntry 结构', async () => {
            await vfs.writeFile('/root/a.txt', 'a');
            await vfs.writeFile('/root/sub/c.txt', 'c');

            const entries = await vfs.readdir('/root', { withFileTypes: true });
            const fileEntry = entries.find(e => e.name === 'a.txt');
            const dirEntry = entries.find(e => e.name === 'sub');

            expect(fileEntry?.isFile()).toBe(true);
            expect(fileEntry?.isDirectory()).toBe(false);
            expect(dirEntry?.isDirectory()).toBe(true);
        });
    });

    describe('文件删除与拷贝 (remove / copy)', () => {
        it('能够删除单个文件', async () => {
            await vfs.writeFile('/temp.txt', 'temp');
            expect(await vfs.pathExists('/temp.txt')).toBe(true);
            await vfs.remove('/temp.txt');
            expect(await vfs.pathExists('/temp.txt')).toBe(false);
        });

        it('能够递归删除目录树', async () => {
            await vfs.writeFile('/dir/a.txt', 'a');
            await vfs.writeFile('/dir/b.txt', 'b');
            await vfs.writeFile('/dir/sub/c.txt', 'c');

            await vfs.remove('/dir', { recursive: true });
            expect(await vfs.pathExists('/dir')).toBe(false);
            expect(await vfs.pathExists('/dir/a.txt')).toBe(false);
            expect(await vfs.pathExists('/dir/sub/c.txt')).toBe(false);
        });

        it('能够拷贝文件到目标位置', async () => {
            await vfs.writeFile('/src/file.txt', 'original');
            await vfs.copy('/src/file.txt', '/dest/file.txt');
            expect(await vfs.readFile('/dest/file.txt')).toBe('original');
        });
    });

    describe('高级特性与测试沙箱支撑 (mkdtemp / symlink / dump)', () => {
        it('支持必选的 mkdtemp 契约创建唯一临时目录', async () => {
            const tempDir1 = await vfs.mkdtemp('/tmp/brutx-');
            const tempDir2 = await vfs.mkdtemp('/tmp/brutx-');

            expect(tempDir1).not.toBe(tempDir2);
            expect(tempDir1).toContain('/tmp/brutx-');
            expect(await vfs.pathExists(tempDir1)).toBe(true);
        });

        it('支持符号链接模拟与 realpath 解析', async () => {
            await vfs.writeFile('/real/target.txt', 'target content');
            await vfs.symlink('/real/target.txt', '/links/link.txt');

            const linkStat = await vfs.lstat('/links/link.txt');
            expect(linkStat.isSymbolicLink()).toBe(true);

            const realPath = await vfs.realpath('/links/link.txt');
            expect(realPath.replace(/\\/g, '/')).toContain('/real/target.txt');
        });

        it('支持构造预置文件与 dump 快照导出', async () => {
            const initial = {
                '/app/package.json': '{"name":"demo"}',
                '/app/src/index.ts': 'console.log(1)',
            };
            const customVfs = new MemoryFileSystemAdapter(initial);
            expect(await customVfs.readFile('/app/package.json')).toBe('{"name":"demo"}');

            const snapshot = customVfs.dump();
            const pkgKey = Object.keys(snapshot).find(k => k.endsWith('/app/package.json'));
            expect(pkgKey).toBeDefined();
            expect(snapshot[pkgKey!]).toBe('{"name":"demo"}');
        });

        it('写入 Uint8Array 后外部修改不会影响内部存储', async () => {
            const buffer = new Uint8Array([1, 2, 3]);
            await vfs.writeFile('/binary.dat', buffer);
            buffer[0] = 99; // 外部修改

            const readBack = await vfs.readFile('/binary.dat');
            expect(readBack).toBe('\x01\x02\x03');
        });

        it('readdir 访问不存在目录抛出 ENOENT，访问文件抛出 ENOTDIR', async () => {
            await expect(vfs.readdir('/non-existent-dir')).rejects.toThrow('ENOENT');

            await vfs.writeFile('/plain-file.txt', 'content');
            await expect(vfs.readdir('/plain-file.txt')).rejects.toThrow('ENOTDIR');
        });

        it('支持 rename 文件与目录并原子移动子树', async () => {
            await vfs.writeFile('/old-dir/sub/file.txt', 'hello');
            await vfs.rename('/old-dir', '/new-dir');

            expect(await vfs.pathExists('/old-dir')).toBe(false);
            expect(await vfs.pathExists('/old-dir/sub/file.txt')).toBe(false);
            expect(await vfs.pathExists('/new-dir/sub/file.txt')).toBe(true);
            expect(await vfs.readFile('/new-dir/sub/file.txt')).toBe('hello');
        });
    });
});
