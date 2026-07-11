import fs from 'fs-extra';
import path from 'path';
import { diffLines } from 'diff';
import type {
    BrutalistConfig,
    DiffResult,
    FileDiff,
    InstalledComponentManifest,
    RegistryItem,
} from '../types.js';
import { getItem } from '../registry.js';
import { getInstalledComponentNames } from '../installed-components.js';
import { resolveAliasPath, resolveImportAlias } from '../project.js';

function normalizeLineEndings(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function matchFileByPath(registryPath: string, localRelativePath: string, componentName: string): boolean {
    const normalizedRegistry = registryPath.replace(/\\/g, '/');
    const normalizedLocal = localRelativePath.replace(/\\/g, '/');

    const prefix = `components/ui/${componentName}/`;
    if (normalizedRegistry.startsWith(prefix)) {
        return normalizedRegistry.slice(prefix.length) === normalizedLocal;
    }

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

export async function getInstalledComponents(cwd: string, config: BrutalistConfig): Promise<string[]> {
    return getInstalledComponentNames(cwd, config);
}

async function getLocalComponentFiles(
    cwd: string,
    config: BrutalistConfig,
    componentName: string
): Promise<Array<{ relativePath: string; absolutePath: string }>> {
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const componentPath = path.join(componentsPath, componentName);

    if (!await fs.pathExists(componentPath)) {
        return [];
    }

    const files: Array<{ relativePath: string; absolutePath: string }> = [];

    async function walkDir(dir: string, relativeBase: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
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

    return {
        installedIntegrity,
        latestIntegrity,
        integrityStatus: installedIntegrity && latestIntegrity
            ? installedIntegrity === latestIntegrity ? 'current' : 'outdated'
            : 'unknown',
        registrySource: manifestEntry?.registrySource,
        installedAt: manifestEntry?.installedAt,
    };
}

export async function diffComponent(
    cwd: string,
    config: BrutalistConfig,
    componentName: string,
    registryOverride?: string,
    manifestEntry?: InstalledComponentManifest,
    useCache: boolean = true
): Promise<DiffResult> {
    let registryItem: RegistryItem | null = null;
    let registryError: Error | null = null;

    try {
        registryItem = await getItem(componentName, registryOverride, useCache);
    } catch (error) {
        registryItem = null;
        registryError = error instanceof Error ? error : new Error(String(error));
    }

    if (!registryItem) {
        const localFiles = await getLocalComponentFiles(cwd, config, componentName);
        return {
            component: componentName,
            status: registryError
                ? 'registry-unreachable'
                : (localFiles.length > 0 ? 'local-only' : 'not-installed'),
            files: [],
            registryError: registryError?.message,
            ...getIntegrityMetadata(registryItem, manifestEntry),
        };
    }

    const localFiles = await getLocalComponentFiles(cwd, config, componentName);
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

        if (!await fs.pathExists(localFile.absolutePath)) {
            fileDiffs.push({
                path: registryFile.path,
                status: 'added',
            });
            continue;
        }

        const localContent = await fs.readFile(localFile.absolutePath, 'utf-8');
        const normalizedRegistryContent = resolveImportAlias(registryFile.content, config);

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
    cwd: string,
    config: BrutalistConfig,
    componentNames: string[],
    getRegistrySource: (componentName: string) => string | undefined,
    getManifestEntry: (componentName: string) => InstalledComponentManifest | undefined,
    useCache: boolean = true
): Promise<DiffResult[]> {
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
