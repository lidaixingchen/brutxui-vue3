import fs from 'fs-extra';
import path from 'path';
import type { BrutxManifest, InstalledComponentManifest, RegistryItem } from './types.js';
import type { FileTransaction } from './file-transaction.js';

export const MANIFEST_RELATIVE_PATH = '.brutx/manifest.json';

export interface InstalledManifestEntryInput {
    item: RegistryItem;
    registrySource: string;
    files: string[];
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

    return {
        name: value.name,
        registrySource,
        integrity,
        installedAt,
        files: value.files,
        dependencies: value.dependencies,
        registryDependencies: value.registryDependencies,
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
            installedAt,
            files: entry.files.map(file => toPortableRelativePath(cwd, file)).sort(),
            dependencies: [...entry.item.dependencies].sort(),
            registryDependencies: [...entry.item.registryDependencies].sort(),
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
