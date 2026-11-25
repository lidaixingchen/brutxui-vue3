import path from 'path';
import type { ProjectContext } from './project-context.js';
import type { BrutxManifest, RegistryItem } from './types.js';

export interface PlannedComponentSource {
    componentName: string;
    content: string;
}

export async function projectRegistryFiles(context: ProjectContext, files: RegistryItem['files']) {
    return Promise.all(files.map(async file => {
        const absolutePath = await context.resolveTargetPath(file.path.replace(/\\/g, '/'));
        return {
            registryPath: file.path,
            absolutePath,
            relativePath: context.toRelativePosixPath(absolutePath),
            content: context.resolveImportAlias(file.content),
        };
    }));
}

export function resolveInstalledFile(context: ProjectContext, filePath: string): string {
    return path.resolve(context.cwd, filePath.replace(/\\/g, '/'));
}

export function collectInstalledFilePaths(
    context: ProjectContext,
    manifest: BrutxManifest | null,
    excludedComponents: ReadonlySet<string>,
): Set<string> {
    const files = new Set<string>();
    for (const [name, entry] of Object.entries(manifest?.components ?? {})) {
        if (excludedComponents.has(name)) continue;
        for (const filePath of entry.files) files.add(resolveInstalledFile(context, filePath));
    }
    return files;
}
