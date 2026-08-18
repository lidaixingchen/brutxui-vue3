import fs from 'fs-extra';
import path from 'path';
import type {
    FileEntry,
    FileStat,
    FileSystemAdapter,
    RemoveOptions,
} from './file-system-adapter.js';

export class DiskFileSystemAdapter implements FileSystemAdapter {
    async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
        return fs.readFile(filePath, encoding);
    }

    async writeFile(filePath: string, content: string | Uint8Array, encoding: BufferEncoding = 'utf-8'): Promise<void> {
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, content, encoding);
    }

    async readJson<T = unknown>(filePath: string): Promise<T> {
        return fs.readJson(filePath) as Promise<T>;
    }

    async writeJson(filePath: string, data: unknown, options: { spaces?: number } = {}): Promise<void> {
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeJson(filePath, data, options);
    }

    async pathExists(filePath: string): Promise<boolean> {
        return fs.pathExists(filePath);
    }

    async ensureDir(dirPath: string): Promise<void> {
        await fs.ensureDir(dirPath);
    }

    async remove(targetPath: string, options: RemoveOptions = {}): Promise<void> {
        if (options.recursive === false) {
            await fs.promises.rm(targetPath, { recursive: false, force: options.force ?? false });
        } else {
            await fs.remove(targetPath);
        }
    }

    async copy(src: string, dest: string): Promise<void> {
        await fs.copy(src, dest);
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
            return dirents.map((d) => ({
                name: d.name,
                isDirectory: () => d.isDirectory(),
                isFile: () => d.isFile(),
                isSymbolicLink: () => d.isSymbolicLink(),
            }));
        }
        return fs.readdir(dirPath);
    }

    async realpath(filePath: string): Promise<string> {
        return fs.promises.realpath(filePath);
    }

    async mkdtemp(prefix: string): Promise<string> {
        await fs.ensureDir(path.dirname(prefix));
        return fs.promises.mkdtemp(prefix);
    }
}
