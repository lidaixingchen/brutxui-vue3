import crypto from 'node:crypto';
import path from 'path';
import { DiskFileSystemAdapter, type FileSystemAdapter } from './fs/index.js';
import { MANIFEST_VERSION } from './types.js';
import type { BrutxManifest, InstalledComponentManifest, RegistryItem } from './types.js';
import { FileTransaction } from './file-transaction.js';

const defaultDiskFs = new DiskFileSystemAdapter();

export const MANIFEST_RELATIVE_PATH = '.brutx/manifest.json';
export const BASELINES_DIR_RELATIVE_PATH = '.brutx/baselines';
export const GITATTRIBUTES_RELATIVE_PATH = '.brutx/.gitattributes';

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
    'marketing',
];

export interface InstalledManifestEntryInput {
    item: RegistryItem;
    registrySource: string;
    registryBaseSource?: string;
    files: string[];
    installedContentHash?: string;
    version?: string;
    baselines?: Record<string, string>;
}

type InstalledRegistrySelection = Pick<InstalledManifestEntryInput, 'item' | 'registrySource' | 'registryBaseSource' | 'version'>;
export type RegistrySelectionUpdate = InstalledRegistrySelection & Pick<InstalledComponentManifest, 'installedAt'>;

export type InstalledComponentIdentity = Pick<
    InstalledComponentManifest, 'installedAt' | 'version' | 'registrySource' | 'registryBaseSource'
>;

export function getInstalledComponentIdentity(entry?: InstalledComponentManifest): InstalledComponentIdentity | null {
    if (!entry) return null;
    const { installedAt, version, registrySource, registryBaseSource } = entry;
    return { installedAt, version, registrySource, registryBaseSource };
}

export function assertInstalledComponentIdentity(
    manifest: BrutxManifest | null,
    componentName: string,
    expected: InstalledComponentIdentity | null,
): void {
    const current = manifest?.components[componentName];
    const matches = expected
        ? current?.installedAt === expected.installedAt
            && current.version === expected.version
            && current.registrySource === expected.registrySource
            && current.registryBaseSource === expected.registryBaseSource
        : current === undefined;
    if (!matches) {
        throw new Error(`Installed component "${componentName}" changed during merge planning. Run the merge again.`);
    }
}

export interface BaselineRecovery {
    componentName: string;
    installedAt: string;
    identity?: InstalledComponentIdentity;
    files: readonly { relativePath: string; content: string }[];
}

interface ManifestWriteOptions {
    transaction?: FileTransaction;
    registrySelections?: readonly RegistrySelectionUpdate[];
    baselineRecoveries?: readonly BaselineRecovery[];
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

    const registryBaseSource = value.registryBaseSource;
    if (registryBaseSource !== undefined && (typeof registryBaseSource !== 'string' || registryBaseSource.length === 0)) {
        throw new Error(`Invalid manifest entry for "${componentName}": "registryBaseSource" must be a non-empty string when provided.`);
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

    const baselines = value.baselines;
    if (baselines !== undefined && (!isRecord(baselines) || Object.values(baselines).some(v => typeof v !== 'string'))) {
        throw new Error(`Invalid manifest entry for "${componentName}": "baselines" must be an object with string values.`);
    }

    return {
        name: value.name,
        registrySource,
        registryBaseSource,
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
        baselines: baselines as Record<string, string> | undefined,
    };
}

function validateManifest(value: unknown): BrutxManifest {
    if (!isRecord(value)) {
        throw new Error('Invalid manifest: expected an object.');
    }

    if (value.version !== MANIFEST_VERSION) {
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
        version: MANIFEST_VERSION,
        components,
    };
}

function createEmptyManifest(): BrutxManifest {
    return {
        version: MANIFEST_VERSION,
        components: {},
    };
}

function toPortableRelativePath(cwd: string, filePath: string): string {
    // 防御性校验：相对路径会基于 process.cwd() 解析，写入 manifest 后 doctor 重算路径
    // 会定位错误文件或误报漂移，故在此直接拦截
    if (!path.isAbsolute(filePath)) {
        throw new Error(`Expected an absolute file path, got: ${filePath}`);
    }
    return path.relative(cwd, filePath).split(path.sep).join('/');
}

export function getManifestPath(cwd: string): string {
    return path.join(cwd, MANIFEST_RELATIVE_PATH);
}

/**
 * 按给定绝对路径顺序读取磁盘文件内容，计算已安装内容的漂移检测哈希。
 * 顺序敏感：files 数组顺序必须与安装时写入磁盘的顺序一致（即 registry item.files 顺序）。
 * 此 hash 用于 doctor 漂移检测——规避 resolveImportAlias 改写磁盘内容导致
 * 磁盘 hash ≠ registry integrity 的问题。
 *
 * 注意：这是与 registry item 完整性哈希（computeRegistryIntegrity，覆盖 path/type/content）
 * 相互独立的契约——漂移检测只需按内容哈希即可发现文件被修改，path/type 由 manifest
 * 的 files 列表锁定。独立实现也保证 registry item 哈希算法演进时不会破坏既有安装项目。
 *
 * 采用长度前缀自描述拼接（`${len}:${content}`），消除内容含特殊字节时的边界歧义。
 */
export async function computeInstalledContentHash(files: string[], fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<string> {
    const contents = await Promise.all(files.map(async (filePath: string) => {
        try {
            return await fsAdapter.readFile(filePath, 'utf-8');
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to read file for integrity check: ${filePath} (${detail})`, { cause: error });
        }
    }));
    const allContent = contents.map((content: string) => `${content.length}:${content}`).join('');
    return 'sha256-' + crypto.createHash('sha256').update(allContent).digest('hex');
}

export async function readManifest(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<BrutxManifest | null> {
    const manifestPath = getManifestPath(cwd);
    const exists = await fsAdapter.pathExists(manifestPath);

    if (!exists) {
        return null;
    }

    try {
        const data = await fsAdapter.readJson(manifestPath);
        return validateManifest(data);
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        const wrapped = new Error(`Failed to read manifest at ${manifestPath}: ${detail}`);
        if (error instanceof Error && 'code' in error) {
            (wrapped as Error & { code?: unknown }).code = (error as Error & { code?: unknown }).code;
        }
        (wrapped as Error & { cause?: unknown }).cause = error;
        throw wrapped;
    }
}

async function writeManifest(
    cwd: string,
    manifest: BrutxManifest,
    transaction: FileTransaction,
): Promise<void> {
    await transaction.writeJson(getManifestPath(cwd), manifest, { spaces: 4 });
}

function registryManifestFields({ item, registrySource, registryBaseSource, version }: InstalledRegistrySelection) {
    return {
        registrySource,
        registryBaseSource,
        version,
        dependencies: [...item.dependencies].sort(),
        registryDependencies: [...item.registryDependencies].sort(),
        category: item.category,
        examples: [...(item.examples ?? [])].sort(),
        status: item.status,
        replacement: item.replacement,
    };
}

export async function updateInstalledComponents(
    cwd: string,
    entries: InstalledManifestEntryInput[],
    options: ManifestWriteOptions = {},
    fsAdapter: FileSystemAdapter = defaultDiskFs
): Promise<void> {
    if (entries.length === 0 && !options.registrySelections?.length && !options.baselineRecoveries?.length) {
        return;
    }

    await withManifestTransaction(cwd, options, fsAdapter, transaction =>
        applyInstalledComponents(cwd, entries, options, fsAdapter, transaction)
    );
}

async function applyInstalledComponents(
    cwd: string,
    entries: InstalledManifestEntryInput[],
    options: ManifestWriteOptions,
    fsAdapter: FileSystemAdapter,
    transaction: FileTransaction,
): Promise<void> {
    const manifest = await readManifest(cwd, fsAdapter) ?? createEmptyManifest();
    for (const recovery of options.baselineRecoveries ?? []) {
        if (recovery.identity) assertInstalledComponentIdentity(manifest, recovery.componentName, recovery.identity);
        const entry = manifest.components[recovery.componentName];
        if (entry?.installedAt !== recovery.installedAt) {
            throw new Error(`Installed component "${recovery.componentName}" changed during merge planning. Run the merge again.`);
        }
        const baselines = { ...entry.baselines };
        for (const { relativePath, content } of recovery.files) {
            const baselinePath = getBaselineRelativePath(recovery.componentName, relativePath);
            await transaction.writeFile(path.resolve(cwd, baselinePath), content);
            baselines[relativePath] = baselinePath;
        }
        entry.baselines = baselines;
    }
    for (const selection of options.registrySelections ?? []) {
        const entry = manifest.components[selection.item.name];
        if (entry?.installedAt !== selection.installedAt) {
            throw new Error(`Installed component "${selection.item.name}" changed during update planning. Run the update again.`);
        }
        Object.assign(entry, registryManifestFields(selection));
    }
    const installationTime = Date.now();
    for (const entry of entries) {
        const previousInstallationTime = Date.parse(manifest.components[entry.item.name]?.installedAt ?? '');
        const installedAt = new Date(Number.isFinite(previousInstallationTime)
            ? Math.max(installationTime, previousInstallationTime + 1)
            : installationTime).toISOString();
        manifest.components[entry.item.name] = {
            name: entry.item.name,
            ...registryManifestFields(entry),
            integrity: entry.item.integrity,
            installedContentHash: entry.installedContentHash,
            installedAt,
            files: entry.files.map(file => toPortableRelativePath(cwd, file)),
            baselines: entry.baselines,
        };
    }

    await writeManifest(cwd, manifest, transaction);
}

export function getBaselinesDir(cwd: string): string {
    return path.join(cwd, BASELINES_DIR_RELATIVE_PATH);
}

export function getBaselineRelativePath(componentName: string, relativePath: string): string {
    return path.posix.join(BASELINES_DIR_RELATIVE_PATH, componentName, relativePath);
}
export function getGitattributesPath(cwd: string): string {
    return path.join(cwd, GITATTRIBUTES_RELATIVE_PATH);
}

export async function ensureGitattributes(
    cwd: string,
    fsAdapter: FileSystemAdapter = defaultDiskFs,
    transaction?: FileTransaction,
): Promise<void> {
    const gitattributesPath = getGitattributesPath(cwd);
    const rule = 'baselines/** -text\n';

    if (transaction) {
        const exists = await fsAdapter.pathExists(gitattributesPath);
        if (!exists) {
            await transaction.writeFile(gitattributesPath, rule);
        } else {
            const current = await fsAdapter.readFile(gitattributesPath, 'utf-8');
            if (!current.includes('baselines/** -text')) {
                await transaction.writeFile(gitattributesPath, current.endsWith('\n') ? current + rule : current + '\n' + rule);
            }
        }
        return;
    }

    const exists = await fsAdapter.pathExists(gitattributesPath);
    if (!exists) {
        await fsAdapter.ensureDir(path.dirname(gitattributesPath));
        await fsAdapter.writeFile(gitattributesPath, rule);
    } else {
        const current = await fsAdapter.readFile(gitattributesPath, 'utf-8');
        if (!current.includes('baselines/** -text')) {
            await fsAdapter.writeFile(gitattributesPath, current.endsWith('\n') ? current + rule : current + '\n' + rule);
        }
    }
}

export async function removeInstalledComponents(
    cwd: string,
    componentNames: string[],
    options: ManifestWriteOptions = {},
    fsAdapter: FileSystemAdapter = defaultDiskFs
): Promise<void> {
    if (componentNames.length === 0) {
        return;
    }

    await withManifestTransaction(cwd, options, fsAdapter, async transaction => {
        const manifest = await readManifest(cwd, fsAdapter);
        if (!manifest) return;

        let changed = false;
        for (const componentName of componentNames) {
            if (manifest.components[componentName]) {
                delete manifest.components[componentName];
                changed = true;
            }
        }
        if (changed) {
            await writeManifest(cwd, manifest, transaction);
        }
    });
}

async function withManifestTransaction(
    cwd: string,
    options: ManifestWriteOptions,
    fsAdapter: FileSystemAdapter,
    write: (transaction: FileTransaction) => Promise<void>,
): Promise<void> {
    const transaction = options.transaction ?? new FileTransaction(fsAdapter, cwd);
    await transaction.lockProjectWrites();
    try {
        await write(transaction);
    } catch (error) {
        if (options.transaction) throw error;
        const failures = await transaction.rollback();
        if (!failures.length) throw error;
        throw new Error(`Manifest rollback failed for: ${failures.join(', ')}`, { cause: error });
    }
    if (!options.transaction) await transaction.commit();
}
