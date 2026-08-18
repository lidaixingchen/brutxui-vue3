import path from 'path';
import fs from 'fs-extra';
import { CliError } from './error.js';
import type { FileSystemAdapter } from './fs/file-system-adapter.js';

export async function isSafePath(
    targetPath: string,
    cwd: string,
    fsAdapter?: FileSystemAdapter
): Promise<boolean> {
    const normalize = process.platform === 'win32'
        ? (s: string) => s.toLowerCase().replace(/\\/g, '/')
        : (s: string) => s.replace(/\\/g, '/');

    const resolveRealPath = async (p: string): Promise<string> => {
        const absPath = path.resolve(p);
        try {
            if (fsAdapter) {
                return await fsAdapter.realpath(absPath);
            }
            return await fs.promises.realpath(absPath);
        } catch {
            let current = absPath;
            const root = path.parse(current).root;
            while (current !== root) {
                const parent = path.dirname(current);
                try {
                    const realParent = fsAdapter
                        ? await fsAdapter.realpath(parent)
                        : await fs.promises.realpath(parent);
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
            exitCode: 2,
        });
    }
}

export async function verifyWrittenPath(
    targetPath: string,
    cwd: string,
    fsAdapter?: FileSystemAdapter
): Promise<void> {
    const safe = await isSafePath(targetPath, cwd, fsAdapter);
    if (!safe) {
        try {
            if (fsAdapter) {
                await fsAdapter.remove(targetPath, { force: true });
            } else {
                await fs.promises.rm(targetPath, { force: true });
            }
        } catch {
            // best effort cleanup
        }
        throw new Error(
            `Security Error: Written path "${targetPath}" resolved outside project directory after write. ` +
            `This may indicate a symlink attack. The file has been removed.`
        );
    }
}
