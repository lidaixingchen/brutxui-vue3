export interface FileEntry {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
    isSymbolicLink(): boolean;
}

export interface FileStat {
    isDirectory(): boolean;
    isFile(): boolean;
    isSymbolicLink(): boolean;
    mtimeMs: number;
    size: number;
}

export interface RemoveOptions {
    recursive?: boolean;
    force?: boolean;
}

export interface FileSystemAdapter {
    readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
    writeFile(filePath: string, content: string | Uint8Array, encoding?: BufferEncoding): Promise<void>;
    readJson<T = unknown>(filePath: string): Promise<T>;
    writeJson(filePath: string, data: unknown, options?: { spaces?: number }): Promise<void>;
    pathExists(filePath: string): Promise<boolean>;
    ensureDir(dirPath: string): Promise<void>;
    remove(targetPath: string, options?: RemoveOptions): Promise<void>;
    copy(src: string, dest: string): Promise<void>;
    stat(filePath: string): Promise<FileStat>;
    lstat?(filePath: string): Promise<FileStat>;

    readdir(dirPath: string, options: { withFileTypes: true }): Promise<FileEntry[]>;
    readdir(dirPath: string, options?: { withFileTypes?: false }): Promise<string[]>;
    readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]>;

    realpath(filePath: string): Promise<string>;
    mkdtemp(prefix: string): Promise<string>;
}
