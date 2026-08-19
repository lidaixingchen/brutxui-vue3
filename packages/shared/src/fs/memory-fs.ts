import path from 'node:path';
import type {
    FileEntry,
    FileStat,
    FileSystemAdapter,
    FsRemoveOptions,
} from './types.js';

interface MemoryFileNode {
    type: 'file';
    content: string | Uint8Array;
    mtimeMs: number;
    size: number;
}

interface MemoryDirNode {
    type: 'dir';
    mtimeMs: number;
}

interface MemorySymlinkNode {
    type: 'symlink';
    target: string;
    mtimeMs: number;
}

type MemoryNode = MemoryFileNode | MemoryDirNode | MemorySymlinkNode;

export class MemoryFileSystemAdapter implements FileSystemAdapter {
    private nodes = new Map<string, MemoryNode>();
    private tempCounter = 0;

    constructor(initialFiles: Record<string, string> = {}) {
        for (const [filePath, content] of Object.entries(initialFiles)) {
            const normalized = this.normalizePath(filePath);
            this.ensureDirSync(this.getParentDir(normalized));
            this.nodes.set(normalized, {
                type: 'file',
                content,
                mtimeMs: Date.now(),
                size: Buffer.byteLength(content),
            });
        }
    }

    private normalizePath(p: string): string {
        const resolved = path.resolve(p).replace(/\\/g, '/');
        // Windows 盘符统一小写，消除大小写差异（如 C:/ vs c:/）
        if (/^[a-zA-Z]:\//.test(resolved)) {
            return resolved[0].toLowerCase() + resolved.slice(1);
        }
        return resolved;
    }

    private getParentDir(p: string): string {
        const lastSlash = p.lastIndexOf('/');
        if (lastSlash === -1) return p;
        if (lastSlash === 0) return '/';
        if (/^[a-zA-Z]:$/.test(p.slice(0, lastSlash))) {
            return `${p.slice(0, lastSlash)}/`;
        }
        return p.slice(0, lastSlash);
    }

    private ensureDirSync(dirPath: string): void {
        const normalized = this.normalizePath(dirPath);
        if (this.nodes.has(normalized)) {
            const node = this.nodes.get(normalized);
            if (node?.type !== 'dir') {
                throw new Error(`Path already exists and is not a directory: ${dirPath}`);
            }
            return;
        }

        const parent = this.getParentDir(normalized);
        if (parent !== normalized) {
            this.ensureDirSync(parent);
        }

        this.nodes.set(normalized, {
            type: 'dir',
            mtimeMs: Date.now(),
        });
    }

    private async resolveSymlinkTarget(normalizedPath: string, depth = 0): Promise<string> {
        if (depth > 32) {
            throw new Error(`Too many symbolic links encountered: ${normalizedPath}`);
        }
        const node = this.nodes.get(normalizedPath);
        if (!node || node.type !== 'symlink') {
            return normalizedPath;
        }
        const nextTarget = path.isAbsolute(node.target)
            ? this.normalizePath(node.target)
            : this.normalizePath(path.join(this.getParentDir(normalizedPath), node.target));
        return this.resolveSymlinkTarget(nextTarget, depth + 1);
    }

    async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
        const normalized = await this.resolveSymlinkTarget(this.normalizePath(filePath));
        const node = this.nodes.get(normalized);
        if (!node) {
            throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
        }
        if (node.type !== 'file') {
            if (node.type === 'dir') {
                throw new Error(`EISDIR: illegal operation on a directory, read '${filePath}'`);
            }
            throw new Error(`EINVAL: invalid file node for reading: '${filePath}'`);
        }
        if (typeof node.content === 'string') {
            return node.content;
        }
        return Buffer.from(node.content).toString(encoding);
    }

    async writeFile(filePath: string, content: string | Uint8Array, encoding: BufferEncoding = 'utf-8'): Promise<void> {
        const normalized = this.normalizePath(filePath);
        this.ensureDirSync(this.getParentDir(normalized));

        const byteSize = typeof content === 'string'
            ? Buffer.byteLength(content, encoding)
            : content.byteLength;

        this.nodes.set(normalized, {
            type: 'file',
            content,
            mtimeMs: Date.now(),
            size: byteSize,
        });
    }

    async readJson<T = unknown>(filePath: string): Promise<T> {
        const raw = await this.readFile(filePath, 'utf-8');
        return JSON.parse(raw) as T;
    }

    async writeJson(filePath: string, data: unknown, options: { spaces?: number } = {}): Promise<void> {
        const spaces = options.spaces ?? 2;
        const serialized = JSON.stringify(data, null, spaces);
        await this.writeFile(filePath, serialized, 'utf-8');
    }

    async pathExists(filePath: string): Promise<boolean> {
        const normalized = this.normalizePath(filePath);
        return this.nodes.has(normalized);
    }

    async ensureDir(dirPath: string): Promise<void> {
        this.ensureDirSync(dirPath);
    }

    async remove(targetPath: string, options: FsRemoveOptions = {}): Promise<void> {
        const normalized = this.normalizePath(targetPath);
        const node = this.nodes.get(normalized);
        if (!node && !options.force) {
            return;
        }

        if (node?.type === 'dir') {
            const prefix = `${normalized}/`;
            const keysToDelete: string[] = [normalized];
            for (const key of this.nodes.keys()) {
                if (key.startsWith(prefix)) {
                    keysToDelete.push(key);
                }
            }
            for (const key of keysToDelete) {
                this.nodes.delete(key);
            }
            return;
        }

        this.nodes.delete(normalized);
    }

    async copy(src: string, dest: string): Promise<void> {
        const normalizedSrc = await this.resolveSymlinkTarget(this.normalizePath(src));
        const normalizedDest = this.normalizePath(dest);
        const node = this.nodes.get(normalizedSrc);
        if (!node) {
            throw new Error(`ENOENT: no such file or directory, copy '${src}' -> '${dest}'`);
        }

        if (node.type === 'file') {
            this.ensureDirSync(this.getParentDir(normalizedDest));
            this.nodes.set(normalizedDest, {
                type: 'file',
                content: node.content,
                mtimeMs: Date.now(),
                size: node.size,
            });
            return;
        }

        if (node.type === 'dir') {
            this.ensureDirSync(normalizedDest);
            const prefix = `${normalizedSrc}/`;
            for (const [key, childNode] of this.nodes.entries()) {
                if (key.startsWith(prefix)) {
                    const relative = key.slice(prefix.length);
                    const childDest = `${normalizedDest}/${relative}`;
                    if (childNode.type === 'dir') {
                        this.ensureDirSync(childDest);
                    } else if (childNode.type === 'file') {
                        this.ensureDirSync(this.getParentDir(childDest));
                        this.nodes.set(childDest, {
                            type: 'file',
                            content: childNode.content,
                            mtimeMs: Date.now(),
                            size: childNode.size,
                        });
                    }
                }
            }
        }
    }

    async stat(filePath: string): Promise<FileStat> {
        const normalized = await this.resolveSymlinkTarget(this.normalizePath(filePath));
        const node = this.nodes.get(normalized);
        if (!node) {
            throw new Error(`ENOENT: no such file or directory, stat '${filePath}'`);
        }

        return {
            isDirectory: () => node.type === 'dir',
            isFile: () => node.type === 'file',
            isSymbolicLink: () => false,
            mtimeMs: node.mtimeMs,
            size: node.type === 'file' ? node.size : 0,
        };
    }

    async lstat(filePath: string): Promise<FileStat> {
        const normalized = this.normalizePath(filePath);
        const node = this.nodes.get(normalized);
        if (!node) {
            throw new Error(`ENOENT: no such file or directory, lstat '${filePath}'`);
        }

        return {
            isDirectory: () => node.type === 'dir',
            isFile: () => node.type === 'file',
            isSymbolicLink: () => node.type === 'symlink',
            mtimeMs: node.mtimeMs,
            size: node.type === 'file' ? node.size : 0,
        };
    }

    readdir(dirPath: string, options: { withFileTypes: true }): Promise<FileEntry[]>;
    readdir(dirPath: string, options?: { withFileTypes?: false }): Promise<string[]>;
    readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]>;
    async readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]> {
        const normalized = this.normalizePath(dirPath);
        const prefix = `${normalized}/`;
        const directChildren = new Map<string, FileEntry>();

        for (const [key, node] of this.nodes.entries()) {
            if (key.startsWith(prefix) && key !== normalized) {
                const subPath = key.slice(prefix.length);
                const firstSegment = subPath.split('/')[0];
                if (!directChildren.has(firstSegment)) {
                    const isSubDir = subPath.includes('/') || node.type === 'dir';
                    directChildren.set(firstSegment, {
                        name: firstSegment,
                        isDirectory: () => isSubDir,
                        isFile: () => !isSubDir && node.type === 'file',
                        isSymbolicLink: () => !isSubDir && node.type === 'symlink',
                    });
                }
            }
        }

        if (options?.withFileTypes) {
            return Array.from(directChildren.values());
        }
        return Array.from(directChildren.keys());
    }

    async realpath(filePath: string): Promise<string> {
        const resolved = await this.resolveSymlinkTarget(this.normalizePath(filePath));
        return process.platform === 'win32' ? path.win32.normalize(resolved) : path.posix.normalize(resolved);
    }

    async mkdtemp(prefix: string): Promise<string> {
        const normalizedPrefix = this.normalizePath(prefix);
        this.ensureDirSync(this.getParentDir(normalizedPrefix));
        const tempPath = `${normalizedPrefix}${Date.now()}-${this.tempCounter++}`;
        this.ensureDirSync(tempPath);
        return tempPath;
    }

    /** 测试辅助：手动创建符号链接 */
    async symlink(target: string, linkPath: string): Promise<void> {
        const normalizedLink = this.normalizePath(linkPath);
        this.ensureDirSync(this.getParentDir(normalizedLink));
        this.nodes.set(normalizedLink, {
            type: 'symlink',
            target,
            mtimeMs: Date.now(),
        });
    }

    /** 测试辅助：导出现有内存树为对象快照 */
    dump(): Record<string, string> {
        const result: Record<string, string> = {};
        for (const [key, node] of this.nodes.entries()) {
            if (node.type === 'file') {
                result[key] = typeof node.content === 'string' ? node.content : Buffer.from(node.content).toString('utf-8');
            }
        }
        return result;
    }
}
