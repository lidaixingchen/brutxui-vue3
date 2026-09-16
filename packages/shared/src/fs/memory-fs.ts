import path from 'node:path';
import {
    FileEntry,
    FileStat,
    FileSystemAdapter,
    FsRemoveOptions,
} from './types.js';

const MAX_SYMLINK_DEPTH = 32;

interface MemoryFileNode {
    type: 'file';
    rawPath: string;
    content: string | Uint8Array;
    mtimeMs: number;
    size: number;
}

interface MemoryDirNode {
    type: 'dir';
    rawPath: string;
    mtimeMs: number;
}

interface MemorySymlinkNode {
    type: 'symlink';
    rawPath: string;
    target: string;
    mtimeMs: number;
}

type MemoryNode = MemoryFileNode | MemoryDirNode | MemorySymlinkNode;

export interface MemoryFsOptions {
    readonly caseSensitive?: boolean;
    readonly platform?: NodeJS.Platform;
}

export class MemoryFileSystemAdapter implements FileSystemAdapter {
    private nodes: Map<string, MemoryNode> = new Map<string, MemoryNode>();
    private tempCounter: number = 0;
    readonly caseSensitive: boolean;
    readonly platform: NodeJS.Platform;

    constructor(initialFiles: Record<string, string> = {}, options: MemoryFsOptions = {}) {
        this.platform = options.platform ?? process.platform;
        this.caseSensitive = options.caseSensitive ?? (this.platform !== 'win32');

        for (const [filePath, content] of Object.entries(initialFiles)) {
            const normalized: string = this.normalizePath(filePath);
            this.ensureDirSync(this.getParentDir(normalized));
            this.nodes.set(normalized, {
                type: 'file',
                rawPath: this.resolveRawPath(filePath),
                content,
                mtimeMs: Date.now(),
                size: Buffer.byteLength(content),
            });
        }
    }

    private resolveRawPath(p: string): string {
        const isWin: boolean = this.platform === 'win32';
        const pathImpl = isWin ? path.win32 : path.posix;
        let resolved: string = pathImpl.resolve(p);
        if (isWin) {
            resolved = resolved.replace(/\\/g, '/');
        }
        return resolved;
    }

    private normalizePath(p: string): string {
        const isWin: boolean = this.platform === 'win32';
        const pathImpl = isWin ? path.win32 : path.posix;
        let resolved: string = pathImpl.resolve(p);
        if (isWin) {
            resolved = resolved.replace(/\\/g, '/');
            // Windows 盘符统一小写，消除大小写差异（如 C:/ vs c:/）
            if (/^[a-zA-Z]:\//.test(resolved)) {
                resolved = resolved[0].toLowerCase() + resolved.slice(1);
            }
        }
        return this.caseSensitive ? resolved : resolved.toLowerCase();
    }

    private getParentDir(p: string): string {
        const lastSlash: number = p.lastIndexOf('/');
        if (lastSlash === -1) return p;
        if (lastSlash === 0) return '/';
        if (/^[a-zA-Z]:$/.test(p.slice(0, lastSlash))) {
            return `${p.slice(0, lastSlash)}/`;
        }
        return p.slice(0, lastSlash);
    }

    private ensureDirSync(dirPath: string): void {
        const normalized: string = this.normalizePath(dirPath);
        if (this.nodes.has(normalized)) {
            const node: MemoryNode | undefined = this.nodes.get(normalized);
            if (node?.type === 'symlink') {
                const targetPath: string = path.isAbsolute(node.target)
                    ? this.normalizePath(node.target)
                    : this.normalizePath(path.join(this.getParentDir(normalized), node.target));
                this.ensureDirSync(targetPath);
                return;
            }
            if (node?.type !== 'dir') {
                throw new Error(`Path already exists and is not a directory: ${dirPath}`);
            }
            return;
        }

        const parent: string = this.getParentDir(normalized);
        if (parent !== normalized) {
            this.ensureDirSync(parent);
        }

        this.nodes.set(normalized, {
            type: 'dir',
            rawPath: this.resolveRawPath(dirPath),
            mtimeMs: Date.now(),
        });
    }

    private async resolveSymlinkTarget(normalizedPath: string, depth: number = 0): Promise<string> {
        if (depth > MAX_SYMLINK_DEPTH) {
            throw new Error(`Too many symbolic links encountered: ${normalizedPath}`);
        }
        const node = this.nodes.get(normalizedPath);
        if (!node) {
            const parent = this.getParentDir(normalizedPath);
            if (parent !== normalizedPath) {
                const resolvedParent = await this.resolveSymlinkTarget(parent, depth + 1);
                if (resolvedParent !== parent) {
                    const relative = path.posix.relative(parent, normalizedPath);
                    const reconstructed = this.normalizePath(path.posix.join(resolvedParent, relative));
                    return this.resolveSymlinkTarget(reconstructed, depth + 1);
                }
            }
            return normalizedPath;
        }
        if (node.type !== 'symlink') {
            return normalizedPath;
        }
        const nextTarget = path.isAbsolute(node.target)
            ? this.normalizePath(node.target)
            : this.normalizePath(path.posix.join(this.getParentDir(normalizedPath), node.target));
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
        const storedContent = typeof content === 'string'
            ? content
            : new Uint8Array(content);

        this.nodes.set(normalized, {
            type: 'file',
            rawPath: this.resolveRawPath(filePath),
            content: storedContent,
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
        const resolved = await this.resolveSymlinkTarget(normalized);
        return this.nodes.has(resolved);
    }

    async ensureDir(dirPath: string): Promise<void> {
        const normalized = this.normalizePath(dirPath);
        this.ensureDirSync(normalized);
    }

    async remove(targetPath: string, options: FsRemoveOptions = {}): Promise<void> {
        const normalized = this.normalizePath(targetPath);

        // 遵循标准 rm 语义：如果目标本身是符号链接，直接删除该链接节点，不解引用目标
        const directNode = this.nodes.get(normalized);
        if (directNode?.type === 'symlink') {
            this.nodes.delete(normalized);
            return;
        }

        const resolved = await this.resolveSymlinkTarget(normalized);

        const node = this.nodes.get(resolved);
        if (!node && options.force === false) {
            throw new Error(`ENOENT: no such file or directory, rm '${targetPath}'`);
        }

        if (options.recursive === false && node?.type === 'dir') {
            const prefix = `${resolved}/`;
            for (const key of this.nodes.keys()) {
                if (key.startsWith(prefix) && key !== resolved) {
                    throw new Error(`ENOTEMPTY: directory not empty, rm '${targetPath}'`);
                }
            }
        }

        const prefix = `${resolved}/`;
        for (const key of Array.from(this.nodes.keys())) {
            if (key === resolved || key.startsWith(prefix)) {
                this.nodes.delete(key);
            }
        }
    }

    async copy(src: string, dest: string): Promise<void> {
        const normalizedSrc = this.normalizePath(src);
        const normalizedDest = this.normalizePath(dest);

        const resolvedSrc = await this.resolveSymlinkTarget(normalizedSrc);
        const node = this.nodes.get(resolvedSrc);
        if (!node) {
            throw new Error(`ENOENT: no such file or directory, cp '${src}' -> '${dest}'`);
        }

        if (node.type === 'file') {
            this.ensureDirSync(this.getParentDir(normalizedDest));
            this.nodes.set(normalizedDest, {
                type: 'file',
                rawPath: this.resolveRawPath(dest),
                content: typeof node.content === 'string' ? node.content : new Uint8Array(node.content),
                mtimeMs: Date.now(),
                size: node.size,
            });
        } else if (node.type === 'dir') {
            this.ensureDirSync(normalizedDest);
            const prefix: string = `${resolvedSrc}/`;
            for (const [key, n] of this.nodes.entries()) {
                if (key.startsWith(prefix)) {
                    const relative: string = key.slice(prefix.length);
                    const destPath: string = `${normalizedDest}/${relative}`;
                    if (n.type === 'dir') {
                        this.ensureDirSync(destPath);
                    } else if (n.type === 'file') {
                        this.ensureDirSync(this.getParentDir(destPath));
                        this.nodes.set(destPath, {
                            type: 'file',
                            rawPath: this.resolveRawPath(destPath),
                            content: typeof n.content === 'string' ? n.content : new Uint8Array(n.content),
                            mtimeMs: Date.now(),
                            size: n.size,
                        });
                    }
                }
            }
        }
    }

    async stat(filePath: string): Promise<FileStat> {
        const normalized = this.normalizePath(filePath);
        const resolved = await this.resolveSymlinkTarget(normalized);
        const node = this.nodes.get(resolved);
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

    private async resolvePathForLstat(p: string): Promise<string> {
        const normalized: string = this.normalizePath(p);
        const parent: string = this.getParentDir(normalized);
        if (parent && parent !== normalized) {
            const resolvedParent: string = await this.resolveSymlinkTarget(parent);
            const baseName: string = path.posix.basename(normalized);
            return path.posix.join(resolvedParent, baseName);
        }
        return normalized;
    }

    async lstat(filePath: string): Promise<FileStat> {
        const target: string = await this.resolvePathForLstat(filePath);
        const node: MemoryNode | undefined = this.nodes.get(target);
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
        const normalized: string = await this.resolveSymlinkTarget(this.normalizePath(dirPath));
        const node: MemoryNode | undefined = this.nodes.get(normalized);
        if (!node) {
            throw new Error(`ENOENT: no such file or directory, scandir '${dirPath}'`);
        }
        if (node.type !== 'dir') {
            throw new Error(`ENOTDIR: not a directory, scandir '${dirPath}'`);
        }

        const prefix: string = `${normalized}/`;
        const directChildren: Map<string, FileEntry> = new Map<string, FileEntry>();

        for (const [key, n] of this.nodes.entries()) {
            if (key.startsWith(prefix) && key !== normalized) {
                const subPath: string = key.slice(prefix.length);
                const isDirectChild: boolean = !subPath.includes('/');
                const isSubDir: boolean = subPath.includes('/') || n.type === 'dir';
                const segmentName: string = isDirectChild
                    ? path.posix.basename(n.rawPath)
                    : subPath.split('/')[0];

                if (!directChildren.has(segmentName) || isDirectChild) {
                    directChildren.set(segmentName, {
                        name: segmentName,
                        isDirectory: () => isSubDir,
                        isFile: () => !isSubDir && n.type === 'file',
                        isSymbolicLink: () => !isSubDir && n.type === 'symlink',
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
        const normalized: string = this.normalizePath(filePath);
        const resolved: string = await this.resolveSymlinkTarget(normalized);
        const node: MemoryNode | undefined = this.nodes.get(resolved);
        if (!node) {
            throw new Error(`ENOENT: no such file or directory, realpath '${filePath}'`);
        }
        return this.platform === 'win32' ? path.win32.normalize(node.rawPath) : path.posix.normalize(node.rawPath);
    }

    async mkdtemp(prefix: string): Promise<string> {
        const normalizedPrefix = this.normalizePath(prefix);
        this.ensureDirSync(this.getParentDir(normalizedPrefix));
        const tempPath = `${normalizedPrefix}${Date.now()}-${this.tempCounter++}`;
        this.ensureDirSync(tempPath);
        return tempPath;
    }

    async rename(oldPath: string, newPath: string): Promise<void> {
        const normalizedOld: string = this.normalizePath(oldPath);
        const normalizedNew: string = this.normalizePath(newPath);

        if (normalizedOld === normalizedNew) return;

        const node: MemoryNode | undefined = this.nodes.get(normalizedOld);
        if (!node) {
            throw new Error(`ENOENT: no such file or directory, rename '${oldPath}' -> '${newPath}'`);
        }

        const existingDest: MemoryNode | undefined = this.nodes.get(normalizedNew);

        if (node.type === 'dir') {
            if (existingDest && existingDest.type !== 'dir') {
                throw new Error(`ENOTDIR: not a directory, rename '${oldPath}' -> '${newPath}'`);
            }
            if (existingDest && existingDest.type === 'dir') {
                const destPrefix: string = `${normalizedNew}/`;
                for (const key of this.nodes.keys()) {
                    if (key.startsWith(destPrefix) && key !== normalizedNew) {
                        throw new Error(`ENOTEMPTY: directory not empty, rename '${oldPath}' -> '${newPath}'`);
                    }
                }
                this.nodes.delete(normalizedNew);
            }

            this.ensureDirSync(this.getParentDir(normalizedNew));

            const oldPrefix: string = `${normalizedOld}/`;
            const newPrefix: string = `${normalizedNew}/`;
            const keysToMove: Array<[string, MemoryNode]> = [];

            for (const [key, n] of this.nodes.entries()) {
                if (key.startsWith(oldPrefix)) {
                    keysToMove.push([key, n]);
                }
            }

            for (const [key] of keysToMove) {
                this.nodes.delete(key);
            }

            this.nodes.delete(normalizedOld);
            node.rawPath = this.resolveRawPath(newPath);
            this.nodes.set(normalizedNew, node);

            const oldRawBase: string = this.resolveRawPath(oldPath);
            const newRawBase: string = this.resolveRawPath(newPath);
            const oldRawPrefix: string = `${oldRawBase}/`;
            const newRawPrefix: string = `${newRawBase}/`;

            for (const [key, n] of keysToMove) {
                const subPath: string = key.slice(oldPrefix.length);
                if (n.rawPath.startsWith(oldRawPrefix)) {
                    n.rawPath = `${newRawPrefix}${n.rawPath.slice(oldRawPrefix.length)}`;
                } else {
                    n.rawPath = `${newRawBase}/${subPath}`;
                }
                this.nodes.set(`${newPrefix}${subPath}`, n);
            }
        } else {
            if (existingDest && existingDest.type === 'dir') {
                throw new Error(`EISDIR: illegal operation on a directory, rename '${oldPath}' -> '${newPath}'`);
            }

            this.ensureDirSync(this.getParentDir(normalizedNew));
            this.nodes.delete(normalizedOld);
            node.rawPath = this.resolveRawPath(newPath);
            this.nodes.set(normalizedNew, node);
        }
    }

    /** 测试辅助：手动创建符号链接 */
    async symlink(target: string, linkPath: string): Promise<void> {
        const normalizedLink: string = this.normalizePath(linkPath);
        this.ensureDirSync(this.getParentDir(normalizedLink));
        this.nodes.set(normalizedLink, {
            type: 'symlink',
            rawPath: this.resolveRawPath(linkPath),
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
