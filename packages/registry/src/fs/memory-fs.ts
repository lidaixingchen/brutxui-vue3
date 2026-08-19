import path from 'node:path';
import type {
    FileEntry,
    FileStat,
    FileSystemAdapter,
    FsRemoveOptions,
} from './file-system-adapter.js';

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
    private nodes: Map<string, MemoryNode> = new Map();

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

    public normalizePath(p: string): string {
        const resolved = path.resolve(p).replace(/\\/g, '/');
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
        if (this.nodes.has(normalized)) return;

        const parent = this.getParentDir(normalized);
        if (parent !== normalized && parent.length > 0) {
            this.ensureDirSync(parent);
        }

        this.nodes.set(normalized, {
            type: 'dir',
            mtimeMs: Date.now(),
        });
    }

    public async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
        const normalized = this.normalizePath(filePath);
        const node = this.nodes.get(normalized);
        if (!node) {
            throw new Error(`ENOENT: no such file or directory, open '${normalized}'`);
        }
        if (node.type !== 'file') {
            throw new Error(`EISDIR: illegal operation on a directory, read '${normalized}'`);
        }
        if (typeof node.content === 'string') {
            return node.content;
        }
        return Buffer.from(node.content).toString(encoding);
    }

    public async writeFile(filePath: string, content: string | Uint8Array, encoding: BufferEncoding = 'utf-8'): Promise<void> {
        const normalized = this.normalizePath(filePath);
        const parent = this.getParentDir(normalized);
        this.ensureDirSync(parent);

        const size = typeof content === 'string'
            ? Buffer.byteLength(content, encoding)
            : content.byteLength;

        this.nodes.set(normalized, {
            type: 'file',
            content,
            mtimeMs: Date.now(),
            size,
        });
    }

    public async readJson<T = unknown>(filePath: string): Promise<T> {
        const raw = await this.readFile(filePath, 'utf-8');
        return JSON.parse(raw) as T;
    }

    public async writeJson(filePath: string, data: unknown, options: { spaces?: number } = {}): Promise<void> {
        const indent = options.spaces ?? 2;
        const serialized = `${JSON.stringify(data, null, indent)}\n`;
        await this.writeFile(filePath, serialized, 'utf-8');
    }

    public async pathExists(filePath: string): Promise<boolean> {
        const normalized = this.normalizePath(filePath);
        return this.nodes.has(normalized);
    }

    public async ensureDir(dirPath: string): Promise<void> {
        this.ensureDirSync(dirPath);
    }

    public async remove(targetPath: string, options: FsRemoveOptions = {}): Promise<void> {
        const normalized = this.normalizePath(targetPath);
        const node = this.nodes.get(normalized);
        if (!node) return;

        if (node.type === 'dir') {
            const prefix = normalized.endsWith('/') ? normalized : `${normalized}/`;
            if (options.recursive === false) {
                const hasChildren = Array.from(this.nodes.keys()).some(k => k !== normalized && k.startsWith(prefix));
                if (hasChildren) {
                    throw new Error(`ENOTEMPTY: directory not empty, rmdir '${normalized}'`);
                }
            } else {
                for (const key of Array.from(this.nodes.keys())) {
                    if (key === normalized || key.startsWith(prefix)) {
                        this.nodes.delete(key);
                    }
                }
                return;
            }
        }

        this.nodes.delete(normalized);
    }

    public async copy(src: string, dest: string): Promise<void> {
        const normSrc = this.normalizePath(src);
        const normDest = this.normalizePath(dest);
        const node = this.nodes.get(normSrc);
        if (!node) {
            throw new Error(`ENOENT: no such file or directory, copy '${normSrc}' -> '${normDest}'`);
        }

        if (node.type === 'file') {
            await this.writeFile(normDest, node.content);
            return;
        }

        if (node.type === 'symlink') {
            await this.copy(node.target, normDest);
            return;
        }

        if (node.type === 'dir') {
            this.ensureDirSync(normDest);
            const prefix = normSrc.endsWith('/') ? normSrc : `${normSrc}/`;
            for (const [key, val] of this.nodes.entries()) {
                if (key.startsWith(prefix)) {
                    const relative = key.slice(prefix.length);
                    const destKey = `${normDest}/${relative}`;
                    if (val.type === 'file') {
                        await this.writeFile(destKey, val.content);
                    } else if (val.type === 'dir') {
                        this.ensureDirSync(destKey);
                    } else if (val.type === 'symlink') {
                        this.ensureDirSync(path.posix.dirname(destKey));
                        this.nodes.set(destKey, {
                            type: 'symlink',
                            target: val.target,
                            mtimeMs: Date.now(),
                        });
                    }
                }
            }
        }
    }

    public async stat(filePath: string): Promise<FileStat> {
        const normalized = this.normalizePath(filePath);
        const node = this.nodes.get(normalized);
        if (!node) {
            throw new Error(`ENOENT: no such file or directory, stat '${normalized}'`);
        }
        return {
            isDirectory: () => node.type === 'dir',
            isFile: () => node.type === 'file',
            isSymbolicLink: () => node.type === 'symlink',
            mtimeMs: node.mtimeMs,
            size: node.type === 'file' ? node.size : 0,
        };
    }

    public async lstat(filePath: string): Promise<FileStat> {
        return this.stat(filePath);
    }

    public readdir(dirPath: string, options: { withFileTypes: true }): Promise<FileEntry[]>;
    public readdir(dirPath: string, options?: { withFileTypes?: false }): Promise<string[]>;
    public readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]>;
    public async readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]> {
        const normalized = this.normalizePath(dirPath);
        const prefix = normalized === '/' ? '/' : `${normalized}/`;
        const directChildren = new Map<string, FileEntry>();

        for (const [key, node] of this.nodes.entries()) {
            if (key !== normalized && key.startsWith(prefix)) {
                const rest = key.slice(prefix.length);
                const firstSegment = rest.split('/')[0];
                if (!firstSegment) continue;

                if (!directChildren.has(firstSegment)) {
                    const isDirectFile = !rest.includes('/') && node.type === 'file';
                    directChildren.set(firstSegment, {
                        name: firstSegment,
                        isDirectory: () => !isDirectFile,
                        isFile: () => isDirectFile,
                        isSymbolicLink: () => false,
                    });
                }
            }
        }

        const sortedEntries = Array.from(directChildren.values()).sort((a, b) => a.name.localeCompare(b.name));
        if (options?.withFileTypes) {
            return sortedEntries;
        }
        return sortedEntries.map(e => e.name);
    }

    public async realpath(filePath: string): Promise<string> {
        return this.normalizePath(filePath);
    }
}
