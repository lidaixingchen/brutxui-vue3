import { DiskFileSystemAdapter, type FileSystemAdapter } from './fs/index.js';
import type { BrutalistConfig, InstalledComponentInfo } from './types.js';
import { ProjectContext } from './project-context.js';
import { ComponentScanner, scanComponentFiles, extractDependencies, mapWithConcurrency } from './component-scanner.js';

export { scanComponentFiles, extractDependencies, mapWithConcurrency, ComponentScanner };

const defaultDiskFs = new DiskFileSystemAdapter();

export async function getInstalledComponentNames(
    cwd: string,
    config: BrutalistConfig,
    fsAdapter: FileSystemAdapter = defaultDiskFs
): Promise<string[]> {
    const ctx = await ProjectContext.loadUninitialized(cwd, { configOverride: config, fs: fsAdapter });
    return ctx.getInstalledComponentNames();
}

export async function getInstalledComponentInfos(
    cwd: string,
    config: BrutalistConfig,
    fsAdapter: FileSystemAdapter = defaultDiskFs
): Promise<InstalledComponentInfo[]> {
    const ctx = await ProjectContext.loadUninitialized(cwd, { configOverride: config, fs: fsAdapter });
    return ctx.getInstalledComponentInfos();
}
