import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
    FileEntry,
    FileStat,
    FileSystemAdapter,
    FsRemoveOptions,
} from './types.js';

export class DiskFileSystemAdapter implements FileSystemAdapter {
    async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
        return fs.readFile(filePath, encoding);
    }

    async writeFile(filePath: string, content: string | Uint8Array, encoding: BufferEncoding = 'utf-8'): Promise<void> {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, encoding);
    }

    async readJson<T = unknown>(filePath: string): Promise<T> {
        const raw = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(raw) as T;
    }

    async writeJson(filePath: string, data: unknown, options: { spaces?: number } = {}): Promise<void> {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const spaces = options.spaces ?? 2;
        const serialized = JSON.stringify(data, null, spaces);
        await fs.writeFile(filePath, serialized, 'utf-8');
    }

    async pathExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async ensureDir(dirPath: string): Promise<void> {
        await fs.mkdir(dirPath, { recursive: true });
    }

    async remove(targetPath: string, options: FsRemoveOptions = {}): Promise<void> {
        await fs.rm(targetPath, {
            recursive: options.recursive ?? true,
            force: options.force ?? true,
        });
    }

    async copy(src: string, dest: string): Promise<void> {
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.cp(src, dest, { recursive: true });
    }

    async stat(filePath: string): Promise<FileStat> {
        const s = await fs.stat(filePath);
        return {
            isDirectory: () => s.isDirectory(),
            isFile: () => s.isFile(),
            isSymbolicLink: () => s.isSymbolicLink(),
            mtimeMs: s.mtimeMs,
            size: s.size,
        };
    }

    async lstat(filePath: string): Promise<FileStat> {
        const s = await fs.lstat(filePath);
        return {
            isDirectory: () => s.isDirectory(),
            isFile: () => s.isFile(),
            isSymbolicLink: () => s.isSymbolicLink(),
            mtimeMs: s.mtimeMs,
            size: s.size,
        };
    }

    readdir(dirPath: string, options: { withFileTypes: true }): Promise<FileEntry[]>;
    readdir(dirPath: string, options?: { withFileTypes?: false }): Promise<string[]>;
    readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]>;
    async readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]> {
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

    async realpath(filePath: string): Promise<string> {
        return fs.realpath(filePath);
    }

    async mkdtemp(prefix: string): Promise<string> {
        await fs.mkdir(path.dirname(prefix), { recursive: true });
        return fs.mkdtemp(prefix);
    }

    async rename(oldPath: string, newPath: string): Promise<void> {
        await fs.mkdir(path.dirname(newPath), { recursive: true });
        await fs.rename(oldPath, newPath);
    }
}
