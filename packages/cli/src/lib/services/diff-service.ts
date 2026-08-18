import fs from 'fs-extra';
import path from 'path';
import { diffLines } from 'diff';
import type {
    BrutalistConfig,
    DiffComponentStatus,
    DiffIntegrityStatus,
    DiffResult,
    FileDiff,
    InstalledComponentManifest,
    RegistryItem,
} from '../types.js';
import { getItemFromSources } from '../registry.js';
import { resolveRegistrySources } from '../registry-source.js';
import { getInstalledComponentNames } from '../installed-components.js';
import { REGISTRY_PATH_PREFIXES } from '../constants.js';
import { isSafePath, resolveAliasPath, resolveImportAlias } from '../project.js';

function normalizeLineEndings(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function matchFileByPath(registryPath: string, localRelativePath: string, componentName: string): boolean {
    const normalizedRegistry = registryPath.replace(/\\/g, '/');
    const normalizedLocal = localRelativePath.replace(/\\/g, '/');

    // 标准布局：components/ui/<componentName>/<rest>，local 侧相对组件目录的路径与 <rest> 对齐
    const dirPrefix = `${REGISTRY_PATH_PREFIXES.components}ui/${componentName}/`;
    if (normalizedRegistry.startsWith(dirPrefix)) {
        return normalizedRegistry.slice(dirPrefix.length) === normalizedLocal;
    }

    // 单文件组件：components/ui/<componentName>.<ext>（如 components/ui/button.ts），
    // local 组件目录下对应同名文件；按文件名比较，避免单文件被误判为 added/removed
    const filePrefix = `${REGISTRY_PATH_PREFIXES.components}ui/${componentName}.`;
    if (normalizedRegistry.startsWith(filePrefix)) {
        return path.basename(normalizedRegistry) === normalizedLocal;
    }

    // 兜底：registry 侧直接以文件名注册（无 components/ui/ 前缀）时与 local 相对路径逐字比较
    return normalizedRegistry === normalizedLocal;
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

import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import { ProjectContext } from '../project-context.js';

export async function getInstalledComponents(
    cwdOrContext: string | ProjectContext,
    config?: BrutalistConfig,
    fsAdapter?: FileSystemAdapter
): Promise<string[]> {
    if (cwdOrContext instanceof ProjectContext) {
        return getInstalledComponentNames(cwdOrContext.cwd, cwdOrContext.requireConfig(), cwdOrContext.fs);
    }
    const context = await ProjectContext.loadUninitialized(cwdOrContext, { configOverride: config, fs: fsAdapter });
    return getInstalledComponentNames(context.cwd, context.requireConfig(), context.fs);
}

async function getLocalComponentFiles(
    context: ProjectContext,
    componentName: string
): Promise<Array<{ relativePath: string; absolutePath: string }>> {
    const componentPath = await context.resolveComponentDir(componentName);

    if (!await context.fs.pathExists(componentPath)) {
        return [];
    }

    const files: Array<{ relativePath: string; absolutePath: string }> = [];

    async function walkDir(dir: string, relativeBase: string): Promise<void> {
        const entries = await context.fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(relativeBase, entry.name);

            if (entry.isDirectory()) {
                await walkDir(fullPath, relativePath);
            } else {
                files.push({ relativePath, absolutePath: fullPath });
            }
        }
    }

    await walkDir(componentPath, '');
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
    if (typeof installedIntegrity === 'string' && installedIntegrity.length > 0
        && typeof latestIntegrity === 'string' && latestIntegrity.length > 0) {
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
    cwdOrContext: string | ProjectContext,
    configOrComponentName: BrutalistConfig | string,
    componentNameOrRegistryOverride?: string,
    registryOverrideOrManifest?: string | InstalledComponentManifest,
    manifestEntryOrCache?: InstalledComponentManifest | boolean,
    useCache: boolean = true
): Promise<DiffResult> {
    let context: ProjectContext;
    let componentName: string;
    let registryOverride: string | undefined;
    let manifestEntry: InstalledComponentManifest | undefined;
    let shouldCache = useCache;

    if (cwdOrContext instanceof ProjectContext) {
        context = cwdOrContext;
        componentName = configOrComponentName as string;
        registryOverride = componentNameOrRegistryOverride;
        manifestEntry = registryOverrideOrManifest as InstalledComponentManifest | undefined;
        shouldCache = typeof manifestEntryOrCache === 'boolean' ? manifestEntryOrCache : useCache;
    } else {
        const cwd = cwdOrContext;
        const config = configOrComponentName as BrutalistConfig;
        context = await ProjectContext.loadUninitialized(cwd, { configOverride: config });
        componentName = componentNameOrRegistryOverride as string;
        registryOverride = registryOverrideOrManifest as string | undefined;
        manifestEntry = manifestEntryOrCache as InstalledComponentManifest | undefined;
    }

    const config = context.requireConfig();
    let registryItem: RegistryItem | null;
    let registryError: Error | null = null;

    const sources = resolveRegistrySources(config, registryOverride);
    try {
        const { item } = await getItemFromSources(componentName, sources, shouldCache);
        registryItem = item;
    } catch (error) {
        registryItem = null;
        registryError = error instanceof Error ? error : new Error(String(error));
    }

    if (!registryItem) {
        const localFiles = await getLocalComponentFiles(context, componentName);
        let status: DiffComponentStatus;
        if (registryError) {
            status = 'registry-unreachable';
        } else if (localFiles.length > 0) {
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

    const localFiles = await getLocalComponentFiles(context, componentName);
    const fileDiffs: FileDiff[] = [];

    for (const registryFile of registryItem.files) {
        const localFile = localFiles.find((f) => matchFileByPath(registryFile.path, f.relativePath, componentName));

        if (!localFile) {
            fileDiffs.push({
                path: registryFile.path,
                status: 'added',
            });
            continue;
        }

        let localContent: string;
        try {
            localContent = await context.fs.readFile(localFile.absolutePath, 'utf-8');
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
                fileDiffs.push({
                    path: registryFile.path,
                    status: 'added',
                });
                continue;
            }
            throw error;
        }
        const normalizedRegistryContent = context.resolveImportAlias(registryFile.content);

        if (normalizeLineEndings(localContent) === normalizeLineEndings(normalizedRegistryContent)) {
            fileDiffs.push({
                path: registryFile.path,
                status: 'unchanged',
            });
        } else {
            fileDiffs.push({
                path: registryFile.path,
                status: 'modified',
                patch: generateUnifiedDiff(
                    registryFile.path,
                    normalizedRegistryContent,
                    localContent
                ),
            });
        }
    }

    for (const localFile of localFiles) {
        const isInRegistry = registryItem.files.some((f) => matchFileByPath(f.path, localFile.relativePath, componentName));

        if (!isInRegistry) {
            fileDiffs.push({
                path: localFile.relativePath,
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
    cwdOrContext: string | ProjectContext,
    configOrComponentNames: BrutalistConfig | string[],
    componentNamesOrGetRegistry?: string[] | ((componentName: string) => string | undefined),
    getRegistrySourceOrGetManifest?: ((componentName: string) => string | undefined) | ((componentName: string) => InstalledComponentManifest | undefined),
    getManifestEntryOrCache?: ((componentName: string) => InstalledComponentManifest | undefined) | boolean,
    useCache: boolean = true
): Promise<DiffResult[]> {
    if (cwdOrContext instanceof ProjectContext) {
        const context = cwdOrContext;
        const componentNames = configOrComponentNames as string[];
        const getRegistrySource = componentNamesOrGetRegistry as (componentName: string) => string | undefined;
        const getManifestEntry = getRegistrySourceOrGetManifest as (componentName: string) => InstalledComponentManifest | undefined;
        const shouldCache = typeof getManifestEntryOrCache === 'boolean' ? getManifestEntryOrCache : useCache;
        return Promise.all(
            componentNames.map(component => diffComponent(
                context,
                component,
                getRegistrySource(component),
                getManifestEntry(component),
                shouldCache
            ))
        );
    }

    const cwd = cwdOrContext;
    const config = configOrComponentNames as BrutalistConfig;
    const componentNames = componentNamesOrGetRegistry as string[];
    const getRegistrySource = getRegistrySourceOrGetManifest as (componentName: string) => string | undefined;
    const getManifestEntry = getManifestEntryOrCache as (componentName: string) => InstalledComponentManifest | undefined;

    return Promise.all(
        componentNames.map(component => diffComponent(
            cwd,
            config,
            component,
            getRegistrySource(component),
            getManifestEntry(component),
            useCache,
        ))
    );
}
