import path from 'path';
import { parseComponentSpecifier } from '../registry-client.js';
import { diffLines } from 'diff';
import type {
    DiffComponentStatus,
    DiffIntegrityStatus,
    DiffResult,
    FileDiff,
    InstalledComponentManifest,
    RegistryItem,
    RegistryItemSnapshot,
} from '../types.js';
import { resolveRegistrySources } from '../registry-source.js';
import { REGISTRY_PATH_PREFIXES } from '../constants.js';
import { ProjectContext } from '../project-context.js';
import { projectRegistryFiles, resolveInstalledFile } from '../component-files.js';

function normalizeLineEndings(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function legacyComponentFilePath(registryPath: string, componentName: string, managed: boolean): string | undefined {
    const normalizedRegistry = registryPath.replace(/\\/g, '/');
    const prefix = `${REGISTRY_PATH_PREFIXES.components}ui/${componentName}`;
    if (normalizedRegistry.startsWith(`${prefix}/`)) return normalizedRegistry.slice(prefix.length + 1);
    if (normalizedRegistry.startsWith(`${prefix}.`)) return path.posix.basename(normalizedRegistry);
    if (!managed) return normalizedRegistry;
    return undefined;
}

function generateUnifiedDiff(
    filePath: string,
    oldContent: string,
    newContent: string
): string {
    const normalizedOld = normalizeLineEndings(oldContent);
    const normalizedNew = normalizeLineEndings(newContent);

    const changes = diffLines(normalizedOld, normalizedNew);
    const diffLines_: string[] = [];
    diffLines_.push(`--- registry/${filePath}`);
    diffLines_.push(`+++ local/${filePath}`);

    for (const part of changes) {
        const lines = part.value.split('\n').filter((line, i, arr) => !(i === arr.length - 1 && line === ''));
        for (const line of lines) {
            if (part.added) {
                diffLines_.push(`+${line}`);
            } else if (part.removed) {
                diffLines_.push(`-${line}`);
            } else {
                diffLines_.push(` ${line}`);
            }
        }
    }

    return diffLines_.join('\n');
}

export async function getInstalledComponents(
    context: ProjectContext
): Promise<string[]> {
    return context.getInstalledComponentNames();
}

async function getLocalComponentFiles(
    context: ProjectContext,
    componentPath: string,
    manifestEntry?: InstalledComponentManifest,
): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    async function walkDir(dir: string, relativeBase: string): Promise<void> {
        const entries = await context.fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(relativeBase, entry.name);

            if (entry.isDirectory()) {
                await walkDir(fullPath, relativePath);
            } else {
                files.set(fullPath, relativePath.split(path.sep).join('/'));
            }
        }
    }

    if (await context.fs.pathExists(componentPath)) {
        await walkDir(componentPath, '');
    }
    for (const recordedPath of manifestEntry?.files ?? []) {
        const absolutePath = resolveInstalledFile(context, recordedPath);
        if (await context.isSafePath(absolutePath) && await context.fs.pathExists(absolutePath)) {
            files.set(absolutePath, context.toRelativePosixPath(absolutePath));
        }
    }
    return files;
}

function getIntegrityMetadata(
    registryItem: RegistryItem | null,
    manifestEntry?: InstalledComponentManifest
): Pick<DiffResult, 'installedIntegrity' | 'latestIntegrity' | 'integrityStatus' | 'registrySource' | 'installedAt'> {
    const installedIntegrity = manifestEntry?.integrity;
    const latestIntegrity = typeof registryItem?.integrity === 'string'
        ? registryItem.integrity
        : undefined;

    let integrityStatus: DiffIntegrityStatus = 'unknown';
    if (installedIntegrity && latestIntegrity) {
        integrityStatus = installedIntegrity === latestIntegrity ? 'current' : 'outdated';
    }

    return {
        installedIntegrity,
        latestIntegrity,
        integrityStatus,
        registrySource: manifestEntry?.registrySource,
        installedAt: manifestEntry?.installedAt,
    };
}

export async function diffComponent(
    context: ProjectContext,
    componentSpecifier: string,
    registryOverride?: string,
    manifestEntry?: InstalledComponentManifest,
    shouldCache = true,
    onRegistryItem?: (snapshot: RegistryItemSnapshot) => void,
): Promise<DiffResult> {
    const { name: componentName } = parseComponentSpecifier(componentSpecifier);
    const config = context.requireConfig();
    let registryItem: RegistryItem | null;
    let registryError: Error | null = null;

    const client = registryOverride
        ? context.getRegistryClient({ sources: resolveRegistrySources(config, registryOverride) })
        : context.getRegistryClient();
    let snapshot: RegistryItemSnapshot | undefined;
    try {
        snapshot = await client.fetchItemWithMeta(componentSpecifier, { useCache: shouldCache });
        registryItem = snapshot.item;
    } catch (error) {
        registryItem = null;
        registryError = error instanceof Error ? error : new Error(String(error));
    }

    if (snapshot) onRegistryItem?.(snapshot);

    const componentPath = await context.resolveComponentDir(componentName);
    const localFiles = await getLocalComponentFiles(context, componentPath, manifestEntry);

    if (!registryItem) {
        let status: DiffComponentStatus;
        if (registryError) {
            status = 'registry-unreachable';
        } else if (localFiles.size > 0) {
            status = 'local-only';
        } else {
            status = 'not-installed';
        }
        return {
            component: componentName,
            status,
            files: [],
            registryError: registryError?.message,
            ...getIntegrityMetadata(registryItem, manifestEntry),
        };
    }

    const fileDiffs: FileDiff[] = [];

    const matchedPaths = new Set<string>();
    const recordedPaths = manifestEntry && new Set(manifestEntry.files.map(file => resolveInstalledFile(context, file)));
    for (const { registryPath, absolutePath, relativePath, content } of await projectRegistryFiles(context, registryItem.files)) {
        const addedPath = recordedPaths ? relativePath : registryPath;
        let localPath = absolutePath;
        if (!await context.fs.pathExists(absolutePath)) {
            const legacyPath = legacyComponentFilePath(registryPath, componentName, recordedPaths !== undefined);
            const legacyAbsolutePath = legacyPath && path.resolve(componentPath, legacyPath);
            if (legacyAbsolutePath && localFiles.has(legacyAbsolutePath)
                && (!recordedPaths || recordedPaths.has(legacyAbsolutePath))) {
                localPath = legacyAbsolutePath;
            } else {
                fileDiffs.push({ path: addedPath, status: 'added' });
                continue;
            }
        }
        matchedPaths.add(localPath);

        let localContent: string;
        try {
            localContent = await context.fs.readFile(localPath, 'utf-8');
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
                fileDiffs.push({
                    path: addedPath,
                    status: 'added',
                });
                continue;
            }
            throw error;
        }
        if (normalizeLineEndings(localContent) === normalizeLineEndings(content)) {
            fileDiffs.push({
                path: registryPath,
                status: 'unchanged',
            });
        } else {
            fileDiffs.push({
                path: registryPath,
                status: 'modified',
                patch: generateUnifiedDiff(
                    registryPath,
                    content,
                    localContent
                ),
            });
        }
    }

    for (const [absolutePath, relativePath] of localFiles) {
        if (!matchedPaths.has(absolutePath)) {
            fileDiffs.push({
                path: relativePath,
                status: 'removed',
            });
        }
    }

    const hasChanges = fileDiffs.some((f) => f.status !== 'unchanged');

    return {
        component: componentName,
        status: hasChanges ? 'modified' : 'up-to-date',
        files: fileDiffs,
        ...getIntegrityMetadata(registryItem, manifestEntry),
    };
}

export async function diffComponents(
    context: ProjectContext,
    componentNames: string[],
    getRegistrySource: (componentName: string) => string | undefined,
    getManifestEntry: (componentName: string) => InstalledComponentManifest | undefined,
    useCache: boolean = true
): Promise<DiffResult[]> {
    return Promise.all(
        componentNames.map(component => diffComponent(
            context,
            component,
            getRegistrySource(component),
            getManifestEntry(component),
            useCache
        ))
    );
}

export const diffAllComponents = diffComponents;
