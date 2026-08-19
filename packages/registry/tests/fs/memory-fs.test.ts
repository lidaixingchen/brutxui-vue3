import { describe, expect, it } from 'vitest';
import { MemoryFileSystemAdapter } from '../../src/fs/memory-fs.js';

describe('MemoryFileSystemAdapter', () => {
    it('initializes with pre-populated files and normalizes paths', async () => {
        const fs = new MemoryFileSystemAdapter({
            'C:\\projects\\ui\\Button.vue': '<template><button /></template>',
            '/root/src/index.ts': 'export * from "./lib";',
        });

        const normWin = fs.normalizePath('C:\\projects\\ui\\Button.vue');
        expect(await fs.pathExists(normWin)).toBe(true);
        expect(await fs.readFile(normWin)).toBe('<template><button /></template>');

        const normPosix = fs.normalizePath('/root/src/index.ts');
        expect(await fs.pathExists(normPosix)).toBe(true);
        expect(await fs.readFile(normPosix)).toBe('export * from "./lib";');
    });

    it('handles write and read json operations', async () => {
        const fs = new MemoryFileSystemAdapter();
        const data = { name: 'button', count: 42 };
        await fs.writeJson('/test/data.json', data);

        expect(await fs.pathExists('/test/data.json')).toBe(true);
        const readData = await fs.readJson<{ name: string; count: number }>('/test/data.json');
        expect(readData).toEqual(data);
    });

    it('lists directory contents with readdir and withFileTypes', async () => {
        const fs = new MemoryFileSystemAdapter({
            '/app/src/components/Button.vue': 'code',
            '/app/src/components/sub/Inner.vue': 'code',
            '/app/src/index.ts': 'code',
        });

        const dirList = await fs.readdir('/app/src');
        expect(dirList).toEqual(['components', 'index.ts']);

        const entries = await fs.readdir('/app/src', { withFileTypes: true });
        expect(entries.length).toBe(2);
        expect(entries[0]?.name).toBe('components');
        expect(entries[0]?.isDirectory()).toBe(true);
        expect(entries[1]?.name).toBe('index.ts');
        expect(entries[1]?.isFile()).toBe(true);
    });

    it('supports stat, remove and copy', async () => {
        const fs = new MemoryFileSystemAdapter({
            '/workspace/src/a.ts': 'hello',
        });

        const statA = await fs.stat('/workspace/src/a.ts');
        expect(statA.isFile()).toBe(true);
        expect(statA.size).toBe(5);

        await fs.copy('/workspace/src/a.ts', '/workspace/dist/a.ts');
        expect(await fs.readFile('/workspace/dist/a.ts')).toBe('hello');

        await fs.remove('/workspace/src');
        expect(await fs.pathExists('/workspace/src/a.ts')).toBe(false);
        expect(await fs.pathExists('/workspace/dist/a.ts')).toBe(true);
    });

    it('throws when accessing non-existent file', async () => {
        const fs = new MemoryFileSystemAdapter();
        await expect(fs.readFile('/non-existent.ts')).rejects.toThrow('ENOENT');
    });
});
