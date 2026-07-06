import fs from 'fs-extra';
import path from 'path';
import type { BrutalistConfig, BrutxManifest, RegistryItem } from '../types.js';
import { getItem } from '../registry.js';
import { FileTransaction } from '../file-transaction.js';
import { removeInstalledComponents } from '../manifest.js';
import { getInstalledComponentNames } from '../installed-components.js';
import { isSafePath, resolveAliasPath } from '../project.js';

const SCRIPT_EXTENSIONS = ['.ts', '.js', '.mts', '.mjs'] as const;

export interface RemovePreparation {
    installed: string[];
    toRemove: string[];
    notFound: string[];
    remaining: string[];
    dependents: Map<string, string[]>;
    orphanedFiles: string[];
}

export interface RemoveExecutionResult {
    totalRemoved: number;
    orphanedRemoved: number;
}

export interface RemoveExecutionOptions {
    removeOrphaned: boolean;
    onRemoveComponent?: (componentName: string, fileCount: number) => void;
}

function isInsideDirectory(filePath: string, directoryPath: string): boolean {
    const relative = path.relative(directoryPath, filePath);
    return relative === '' || (relative.length > 0 && !relative.startsWith('..') && !path.isAbsolute(relative));
}

async function findManifestKnownFiles(
    cwd: string,
    config: BrutalistConfig,
    manifest: BrutxManifest | null,
    removedComponents: string[],
    remainingComponents: string[]
): Promise<string[]> {
    if (!manifest) {
        return [];
    }

    const remainingFiles = new Set(
        remainingComponents.flatMap(component => manifest.components[component]?.files ?? [])
    );
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const removedComponentDirs = removedComponents.map(component => path.join(componentsPath, component));
    const knownFiles: string[] = [];

    for (const component of removedComponents) {
        const entry = manifest.components[component];
        if (!entry) continue;

        for (const manifestFile of entry.files) {
            if (remainingFiles.has(manifestFile)) continue;

            const absolutePath = path.resolve(cwd, manifestFile);
            if (!await isSafePath(absolutePath, cwd)) continue;
            if (removedComponentDirs.some(dir => isInsideDirectory(absolutePath, dir))) continue;
            if (!await fs.pathExists(absolutePath)) continue;

            knownFiles.push(absolutePath);
        }
    }

    return [...new Set(knownFiles)];
}

async function scanAllImports(componentsPath: string): Promise<Map<string, Set<string>>> {
    const importMap = new Map<string, Set<string>>();

    if (!await fs.pathExists(componentsPath)) {
        return importMap;
    }

    async function scanDir(dir: string, componentName: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await scanDir(fullPath, componentName);
                continue;
            }

            const ext = path.extname(entry.name);
            if (ext !== '.vue' && ext !== '.ts' && ext !== '.js') continue;

            const content = await fs.readFile(fullPath, 'utf-8');
            const importRegex = /from\s+['"]([^'"]+)['"]/g;
            let match: RegExpExecArray | null;

            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];
                if (!importMap.has(importPath)) {
                    importMap.set(importPath, new Set());
                }
                importMap.get(importPath)!.add(componentName);
            }
        }
    }

    const dirs = await fs.readdir(componentsPath, { withFileTypes: true });
    for (const dir of dirs) {
        if (!dir.isDirectory()) continue;
        await scanDir(path.join(componentsPath, dir.name), dir.name);
    }

    return importMap;
}

async function resolveScriptFile(baseDir: string, fileName: string): Promise<string | null> {
    for (const ext of SCRIPT_EXTENSIONS) {
        const candidate = path.join(baseDir, fileName + ext);
        if (await fs.pathExists(candidate)) {
            return candidate;
        }
    }
    const noExtCandidate = path.join(baseDir, fileName);
    if (await fs.pathExists(noExtCandidate)) {
        return noExtCandidate;
    }
    return null;
}

async function findOrphanedFiles(
    cwd: string,
    config: BrutalistConfig,
    remainingComponents: string[],
    removedComponents: string[]
): Promise<string[]> {
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const importMap = await scanAllImports(componentsPath);

    const composablesPath = await resolveAliasPath(config.aliases.composables, cwd);
    const utilsAlias = config.aliases.utils;
    const utilsDir = path.dirname(utilsAlias);
    const utilsPath = await resolveAliasPath(utilsDir, cwd);
    const localesPath = path.join(path.dirname(composablesPath), 'locales');
    const directivesPath = path.join(path.dirname(composablesPath), 'directives');

    const orphaned: string[] = [];

    for (const [importPath, importers] of importMap) {
        const wasOnlyUsedByRemoved = [...importers].every(c => removedComponents.includes(c));
        if (!wasOnlyUsedByRemoved) continue;

        const isComposable = importPath.includes('/composables/');
        const isLocale = importPath.includes('/locales/');
        const isDirective = importPath.includes('/directives/');
        const isUtils = importPath.includes('/lib/') && !importPath.endsWith('/utils');

        if (!isComposable && !isLocale && !isDirective && !isUtils) continue;

        let resolvedPath: string | null = null;
        const fileName = importPath.split('/').pop() ?? '';

        if (isComposable && await fs.pathExists(composablesPath)) {
            resolvedPath = await resolveScriptFile(composablesPath, fileName);
        }

        if (!resolvedPath && isLocale && await fs.pathExists(localesPath)) {
            resolvedPath = await resolveScriptFile(localesPath, fileName);
        }

        if (!resolvedPath && isDirective && await fs.pathExists(directivesPath)) {
            resolvedPath = await resolveScriptFile(directivesPath, fileName);
        }

        if (!resolvedPath && isUtils && await fs.pathExists(utilsPath)) {
            resolvedPath = await resolveScriptFile(utilsPath, fileName);
        }

        if (resolvedPath) {
            orphaned.push(resolvedPath);
        }
    }

    return [...new Set(orphaned)];
}

async function getDependents(
    cwd: string,
    config: BrutalistConfig,
    componentsToRemove: string[],
    manifest: BrutxManifest | null
): Promise<Map<string, string[]>> {
    const dependents = new Map<string, string[]>();
    const installed = await getInstalledComponentNames(cwd, config);
    const remaining = installed.filter(c => !componentsToRemove.includes(c));

    for (const name of componentsToRemove) {
        for (const other of remaining) {
            try {
                const otherItem: RegistryItem = await getItem(other, manifest?.components[other]?.registrySource);
                if (otherItem.registryDependencies?.includes(name)) {
                    if (!dependents.has(name)) {
                        dependents.set(name, []);
                    }
                    dependents.get(name)!.push(other);
                }
            } catch {
                // skip if registry item not found
            }
        }
    }

    return dependents;
}

export async function countComponentFiles(
    cwd: string,
    config: BrutalistConfig,
    componentName: string
): Promise<number | null> {
    const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
    const componentPath = path.join(componentsPath, componentName);

    if (!await fs.pathExists(componentPath)) {
        return null;
    }

    const entries = await fs.readdir(componentPath, { withFileTypes: true });
    return entries.filter(e => e.isFile()).length;
}

export async function prepareRemoveComponents(
    cwd: string,
    config: BrutalistConfig,
    components: string[],
    manifest: BrutxManifest | null
): Promise<RemovePreparation> {
    const installed = await getInstalledComponentNames(cwd, config);
    const toRemove = components.filter(c => installed.includes(c));
    const notFound = components.filter(c => !installed.includes(c));
    const remaining = installed.filter(c => !toRemove.includes(c));
    const dependents = toRemove.length > 0
        ? await getDependents(cwd, config, toRemove, manifest)
        : new Map<string, string[]>();
    const orphanedFiles = toRemove.length > 0
        ? [
            ...new Set([
                ...await findOrphanedFiles(cwd, config, remaining, toRemove),
                ...await findManifestKnownFiles(cwd, config, manifest, toRemove, remaining),
            ]),
        ]
        : [];

    return {
        installed,
        toRemove,
        notFound,
        remaining,
        dependents,
        orphanedFiles,
    };
}

export async function removeComponents(
    cwd: string,
    config: BrutalistConfig,
    componentsToRemove: string[],
    orphanedFiles: string[],
    options: RemoveExecutionOptions
): Promise<RemoveExecutionResult> {
    const transaction = new FileTransaction();
    let totalRemoved = 0;
    let orphanedRemoved = 0;

    try {
        for (const comp of componentsToRemove) {
            const componentsPath = await resolveAliasPath(config.aliases.components, cwd);
            const componentPath = path.join(componentsPath, comp);

            if (await fs.pathExists(componentPath)) {
                const files = await fs.readdir(componentPath);
                options.onRemoveComponent?.(comp, files.length);
                await transaction.remove(componentPath);
                totalRemoved += files.length;
            }
        }

        if (options.removeOrphaned) {
            for (const f of orphanedFiles) {
                if (await fs.pathExists(f)) {
                    await transaction.remove(f);
                    orphanedRemoved++;
                }
            }
        }

        await removeInstalledComponents(cwd, componentsToRemove, { transaction });
        await transaction.commit();
    } catch (error) {
        const rollbackFailures = await transaction.rollback();
        return Promise.reject(Object.assign(error instanceof Error ? error : new Error(String(error)), {
            rollbackFailures,
        }));
    }

    return {
        totalRemoved,
        orphanedRemoved,
    };
}
