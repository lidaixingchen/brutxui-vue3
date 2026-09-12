import {
    RegistryClient,
    isComponentNotFoundError,
    isRegistrySecurityError,
    REGISTRY_ERROR_CODES,
} from 'brutx-vue';
import type {
    RegistryClientOptions,
    ResolvedComponentPlan,
    FileSystemAdapter,
    RegistryItem,
    FileEntry,
    FileStat,
    FsRemoveOptions,
    RegistryErrorCode,
    BufferEncoding,
} from 'brutx-vue';

class CustomFs implements FileSystemAdapter {
    async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
        return filePath + encoding;
    }
    async writeFile(filePath: string, content: string | Uint8Array, encoding: BufferEncoding = 'utf-8'): Promise<void> {
        void filePath; void content; void encoding;
    }
    async readJson<T = unknown>(filePath: string): Promise<T> {
        void filePath;
        return {} as T;
    }
    async writeJson(filePath: string, data: unknown, options?: { spaces?: number }): Promise<void> {
        void filePath; void data; void options;
    }
    async pathExists(filePath: string): Promise<boolean> {
        return filePath.length > 0;
    }
    async ensureDir(dirPath: string): Promise<void> {
        void dirPath;
    }
    async remove(targetPath: string, options?: FsRemoveOptions): Promise<void> {
        void targetPath; void options;
    }
    async copy(src: string, dest: string): Promise<void> {
        void src; void dest;
    }
    async stat(filePath: string): Promise<FileStat> {
        void filePath;
        return {
            isDirectory: () => false,
            isFile: () => true,
            isSymbolicLink: () => false,
            mtimeMs: 12345,
            size: 100,
        };
    }
    async lstat(filePath: string): Promise<FileStat> {
        return this.stat(filePath);
    }
    readdir(dirPath: string, options: { withFileTypes: true }): Promise<FileEntry[]>;
    readdir(dirPath: string, options?: { withFileTypes?: false }): Promise<string[]>;
    readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]>;
    async readdir(dirPath: string, options?: { withFileTypes?: boolean }): Promise<FileEntry[] | string[]> {
        void dirPath;
        if (options?.withFileTypes) {
            return [{
                name: 'button.vue',
                isDirectory: () => false,
                isFile: () => true,
                isSymbolicLink: () => false,
            }];
        }
        return ['button.vue'];
    }
    async realpath(filePath: string): Promise<string> {
        return filePath;
    }
    async mkdtemp(prefix: string): Promise<string> {
        return prefix + '-temp';
    }
    async rename(oldPath: string, newPath: string): Promise<void> {
        void oldPath; void newPath;
    }
}

const customFs = new CustomFs();
const options: RegistryClientOptions = {
    fsAdapter: customFs,
    offline: false,
};

const client = new RegistryClient(options);
const clientFs: FileSystemAdapter = client.fs;
void clientFs;

const notFound: boolean = isComponentNotFoundError(new Error('not found'));
const isSec: boolean = isRegistrySecurityError(new Error('security'));
const code: RegistryErrorCode = REGISTRY_ERROR_CODES[0];
void notFound; void isSec; void code;

const item: RegistryItem = {
    name: 'button',
    type: 'registry:ui',
    title: 'Button',
    description: 'Neo-Brutalist button',
    dependencies: [],
    devDependencies: [],
    registryDependencies: [],
    files: [
        {
            path: 'button.vue',
            content: '<template><button><slot /></button></template>',
            type: 'registry:ui',
        },
    ],
    tailwind: {},
    cssVars: {},
    integrity: 'sha256-test',
};

const plan: ResolvedComponentPlan = {
    items: [item],
    hitSources: new Map(),
    npmDependencies: [],
    npmDevDependencies: [],
    registryDependencies: [],
};
void plan;
