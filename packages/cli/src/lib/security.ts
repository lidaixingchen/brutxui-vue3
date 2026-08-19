import path from 'node:path';
import { DiskFileSystemAdapter, type FileSystemAdapter } from 'brutx-shared-vue/fs';
import { CliError } from './error.js';

const defaultDiskFs = new DiskFileSystemAdapter();

export async function isSafePath(
    targetPath: string,
    cwd: string,
    fsAdapter: FileSystemAdapter = defaultDiskFs
): Promise<boolean> {
    const normalize = process.platform === 'win32'
        ? (s: string) => s.toLowerCase().replace(/\\/g, '/')
        : (s: string) => s.replace(/\\/g, '/');

    const resolveRealPath = async (p: string): Promise<string> => {
        const absPath = path.resolve(p);
        try {
            return await fsAdapter.realpath(absPath);
        } catch {
            let current = absPath;
            const root = path.parse(current).root;
            while (current !== root) {
                const parent = path.dirname(current);
                try {
                    const realParent = await fsAdapter.realpath(parent);
                    const relative = path.relative(parent, absPath);
                    return path.join(realParent, relative);
                } catch {
                    current = parent;
                }
            }
            return absPath;
        }
    };

    const resolvedCwd = normalize(await resolveRealPath(cwd));
    const parsedRoot = normalize(path.parse(path.resolve(cwd)).root);

    if (resolvedCwd === parsedRoot || resolvedCwd === '') {
        return false;
    }

    const resolvedTarget = normalize(await resolveRealPath(targetPath));
    const isInside = resolvedTarget.startsWith(resolvedCwd + '/') || resolvedTarget === resolvedCwd;
    return isInside;
}

export async function assertSafePath(
    targetPath: string,
    cwd: string,
    fsAdapter?: FileSystemAdapter
): Promise<void> {
    if (!(await isSafePath(targetPath, cwd, fsAdapter))) {
        throw new CliError(`Security Error: Resolved path "${targetPath}" is outside the project directory.`, {
            code: 'PATH_UNSAFE',
            exitCode: 1,
        });
    }
}

export async function verifyWrittenPath(
    filePath: string,
    cwd: string,
    fsAdapter: FileSystemAdapter = defaultDiskFs
): Promise<void> {
    const isSafe = await isSafePath(filePath, cwd, fsAdapter);
    if (!isSafe) {
        await fsAdapter.remove(filePath).catch(() => {});
        throw new CliError(`Security Error: Resolved path "${filePath}" is outside the project directory.`, {
            code: 'PATH_UNSAFE',
            exitCode: 1,
        });
    }
}

export function sanitizeComponentName(name: string): string {
    const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized.length === 0 || sanitized.length > 100) {
        throw new CliError(`Invalid component name: "${name}"`, {
            code: 'INVALID_COMPONENT_NAME',
            exitCode: 1,
        });
    }
    return sanitized;
}

export function sanitizeFileName(name: string): string {
    if (name.includes('..') || name.startsWith('/') || name.startsWith('\\')) {
        throw new CliError(`Invalid file path: "${name}"`, {
            code: 'PATH_UNSAFE',
            exitCode: 1,
        });
    }
    return name;
}
