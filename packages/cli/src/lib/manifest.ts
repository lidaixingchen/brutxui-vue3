import fs from 'fs-extra';
import path from 'path';
import { computeRegistryIntegrity } from 'brutx-shared-vue';
import type { BrutxManifest, InstalledComponentManifest, RegistryItem } from './types.js';
import type { FileTransaction } from './file-transaction.js';

export const MANIFEST_RELATIVE_PATH = '.brutx/manifest.json';
const COMPONENT_CATEGORIES: Array<NonNullable<RegistryItem['category']>> = [
    'action',
    'data-display',
    'feedback',
    'form',
    'layout',
    'marketing',
    'navigation',
    'overlay',
    'utility',
    'visual-effect',
];

export interface InstalledManifestEntryInput {
    item: RegistryItem;
    registrySource: string;
    files: string[];
    installedContentHash?: string;
    version?: string;
}

interface ManifestWriteOptions {
    transaction?: FileTransaction;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertStringArray(value: unknown, field: string): asserts value is string[] {
    if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) {
        throw new Error(`Invalid manifest: "${field}" must be an array of strings.`);
    }
}

function assertCategory(value: unknown, componentName: string): asserts value is RegistryItem['category'] {
    if (value !== undefined && (typeof value !== 'string' || !COMPONENT_CATEGORIES.includes(value as NonNullable<RegistryItem['category']>))) {
        throw new Error(`Invalid manifest entry for "${componentName}": "category" must be one of: ${COMPONENT_CATEGORIES.join(', ')}.`);
    }
}

function validateManifestEntry(value: unknown, componentName: string): InstalledComponentManifest {
    if (!isRecord(value)) {
        throw new Error(`Invalid manifest entry for "${componentName}": expected an object.`);
    }

    if (value.name !== componentName) {
        throw new Error(`Invalid manifest entry for "${componentName}": name mismatch.`);
    }

    const registrySource = value.registrySource;
    if (typeof registrySource !== 'string' || registrySource.length === 0) {
        throw new Error(`Invalid manifest entry for "${componentName}": "registrySource" must be a non-empty string.`);
    }

    const integrity = value.integrity;
    if (typeof integrity !== 'string' || integrity.length === 0) {
        throw new Error(`Invalid manifest entry for "${componentName}": "integrity" must be a non-empty string.`);
    }

    const installedAt = value.installedAt;
    if (typeof installedAt !== 'string' || installedAt.length === 0) {
        throw new Error(`Invalid manifest entry for "${componentName}": "installedAt" must be a non-empty string.`);
    }

    assertStringArray(value.files, `${componentName}.files`);
    assertStringArray(value.dependencies, `${componentName}.dependencies`);
    assertStringArray(value.registryDependencies, `${componentName}.registryDependencies`);
    assertCategory(value.category, componentName);
    const examples = value.examples ?? [];
    assertStringArray(examples, `${componentName}.examples`);

    const status = value.status;
    if (status !== undefined && status !== 'stable' && status !== 'legacy' && status !== 'deprecated') {
        throw new Error(`Invalid manifest entry for "${componentName}": "status" must be one of: stable, legacy, deprecated.`);
    }

    const replacement = value.replacement;
    if (replacement !== undefined && (typeof replacement !== 'string' || replacement.length === 0)) {
        throw new Error(`Invalid manifest entry for "${componentName}": "replacement" must be a non-empty string when provided.`);
    }

    const installedContentHash = value.installedContentHash;
    if (installedContentHash !== undefined && (typeof installedContentHash !== 'string' || installedContentHash.length === 0)) {
        throw new Error(`Invalid manifest entry for "${componentName}": "installedContentHash" must be a non-empty string when provided.`);
    }

    const version = value.version;
    if (version !== undefined && (typeof version !== 'string' || version.length === 0)) {
        throw new Error(`Invalid manifest entry for "${componentName}": "version" must be a non-empty string when provided.`);
    }

    return {
        name: value.name,
        registrySource,
        integrity,
        installedContentHash,
        version,
        installedAt,
        files: value.files,
        dependencies: value.dependencies,
        registryDependencies: value.registryDependencies,
        category: value.category,
        examples,
        status,
        replacement,
    };
}

function validateManifest(value: unknown): BrutxManifest {
    if (!isRecord(value)) {
        throw new Error('Invalid manifest: expected an object.');
    }

    if (value.version !== 1) {
        throw new Error('Invalid manifest: unsupported version.');
    }

    if (!isRecord(value.components)) {
        throw new Error('Invalid manifest: "components" must be an object.');
    }

    const components: Record<string, InstalledComponentManifest> = {};
    for (const [componentName, entry] of Object.entries(value.components)) {
        components[componentName] = validateManifestEntry(entry, componentName);
    }

    return {
        version: 1,
        components,
    };
}

function createEmptyManifest(): BrutxManifest {
    return {
        version: 1,
        components: {},
    };
}

function toPortableRelativePath(cwd: string, filePath: string): string {
    return path.relative(cwd, filePath).split(path.sep).join('/');
}

export function getManifestPath(cwd: string): string {
    return path.join(cwd, MANIFEST_RELATIVE_PATH);
}

/**
 * 按给定绝对路径顺序读取磁盘文件内容，用 computeRegistryIntegrity 算 hash。
 * 顺序敏感：files 数组顺序必须与安装时写入磁盘的顺序一致（即 registry item.files 顺序）。
 * 此 hash 用于 doctor 漂移检测——规避 resolveImportAlias 改写磁盘内容导致
 * 磁盘 hash ≠ registry integrity 的问题。
 */
export async function computeInstalledContentHash(files: string[]): Promise<string> {
    const contents: string[] = [];
    for (const filePath of files) {
        const content = await fs.readFile(filePath, 'utf-8');
        contents.push(content);
    }
    return computeRegistryIntegrity(contents.map(content => ({ content })));
}

export async function readManifest(cwd: string): Promise<BrutxManifest | null> {
    const manifestPath = getManifestPath(cwd);

    if (!await fs.pathExists(manifestPath)) {
        return null;
    }

    return validateManifest(await fs.readJson(manifestPath));
}

async function writeManifest(
    cwd: string,
    manifest: BrutxManifest,
    options: ManifestWriteOptions = {}
): Promise<void> {
    const manifestPath = getManifestPath(cwd);

    if (options.transaction) {
        await options.transaction.writeJson(manifestPath, manifest, { spaces: 4 });
        return;
    }

    await fs.ensureDir(path.dirname(manifestPath));
    await fs.writeJson(manifestPath, manifest, { spaces: 4 });
}

export async function updateInstalledComponents(
    cwd: string,
    entries: InstalledManifestEntryInput[],
    options: ManifestWriteOptions = {}
): Promise<void> {
    if (entries.length === 0) {
        return;
    }

    const manifest = await readManifest(cwd) ?? createEmptyManifest();
    const installedAt = new Date().toISOString();

    for (const entry of entries) {
        manifest.components[entry.item.name] = {
            name: entry.item.name,
            registrySource: entry.registrySource,
            integrity: entry.item.integrity,
            installedContentHash: entry.installedContentHash,
            version: entry.version,
            installedAt,
            // files 顺序必须与 registry build 顺序一致（来自 add-service 的 filesByComponent，
            // 该顺序源于 item.files 数组顺序），不可 .sort()——否则 doctor 重算 computeRegistryIntegrity
            // 会因顺序不同而误报漂移（computeRegistryIntegrity 对数组顺序敏感）。
            files: entry.files.map(file => toPortableRelativePath(cwd, file)),
            // dependencies/registryDependencies/examples 不参与 integrity 计算，保留 .sort() 以稳定可读。
            dependencies: [...entry.item.dependencies].sort(),
            registryDependencies: [...entry.item.registryDependencies].sort(),
            category: entry.item.category,
            examples: [...(entry.item.examples ?? [])].sort(),
            status: entry.item.status,
            replacement: entry.item.replacement,
        };
    }

    await writeManifest(cwd, manifest, options);
}

export async function removeInstalledComponents(
    cwd: string,
    componentNames: string[],
    options: ManifestWriteOptions = {}
): Promise<void> {
    if (componentNames.length === 0) {
        return;
    }

    const manifest = await readManifest(cwd);
    if (!manifest) {
        return;
    }

    let changed = false;
    for (const componentName of componentNames) {
        if (manifest.components[componentName]) {
            delete manifest.components[componentName];
            changed = true;
        }
    }

    if (changed) {
        await writeManifest(cwd, manifest, options);
    }
}
