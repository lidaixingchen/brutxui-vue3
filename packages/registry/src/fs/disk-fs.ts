import fs from 'node:fs/promises';
import path from 'node:path';
import type {
    FileEntry,
    FileStat,
    FileSystemAdapter,
    FsRemoveOptions,
} from './file-system-adapter.js';

export class DiskFileSystemAdapter implements FileSystemAdapter {
    public async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
        return fs.readFile(filePath, { encoding });
    }

    public async writeFile(filePath: string, content: string | Uint8Array, encoding: BufferEncoding = 'utf-8'): Promise<void> {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, { encoding });
    }

    public async readJson<T = unknown>(filePath: string): Promise<T> {
        const raw = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(raw) as T;
    }

    public async writeJson(filePath: string, data: unknown, options: { spaces?: number } = {}): Promise<void> {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const indent = options.spaces ?? 2;
        const serialized = `${JSON.stringify(data, null, indent)}\n`;
        await fs.writeFile(filePath, serialized, 'utf-8');
    }

    public async pathExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    public async ensureDir(dirPath: string): Promise<void> {
        await fs.mkdir(dirPath, { recursive: true });
    }

    public async remove(targetPath: string, options: FsRemoveOptions = {}): Promise<void> {
        await fs.rm(targetPath, {
            recursive: options.recursive ?? true,
            force: options.force ?? true,
        });
    }

    public async copy(src: string, dest: string): Promise<void> {
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.cp(src, dest, { recursive: true });
    }

    public async stat(filePath: string): Promise<FileStat> {
        const s = await fs.stat(filePath);
        return {
            isDirectory: () => s.isDirectory(),
            isFile: () => s.isFile(),
            isSymbolicLink: () => s.isSymbolicLink(),
            mtimeMs: s.mtimeMs,
            size: s.size,
        };
    }

    public async lstat(filePath: string): Promise<FileStat> {
        const s = await fs.lstat(filePath);
        return {
            isDirectory: () => s.isDirectory(),
            isFile: () => s.isFile(),
            isSymbolicLink: () => s.isSymbolicLink(),
            mtimeMs: s.mtimeMs,
            size: s.size,
        };
    }

    public readdir(dirPath: string, options: { withFileTypes: true }): Promise<FileEntry[]>;
    public readdir(dirPath: string, options?: { withFileTypes?: false }): Promise<string[]>;
    public readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]>;
    public async readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]> {
        if (options?.withFileTypes) {
            const dirents = await fs.readdir(dirPath, { withFileTypes: true });
            return dirents.map(d => ({
                name: d.name,
                isDirectory: () => d.isDirectory(),
                isFile: () => d.isFile(),
                isSymbolicLink: () => d.isSymbolicLink(),
            }));
        }
        return fs.readdir(dirPath);
    }

    public async realpath(filePath: string): Promise<string> {
        return fs.realpath(filePath);
    }
}
