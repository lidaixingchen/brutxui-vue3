import path from 'node:path';
import { createRequire } from 'node:module';
import { parse as parseJsonc } from 'jsonc-parser';
import { DiskFileSystemAdapter, type FileSystemAdapter } from 'brutx-shared-vue/fs';
import type { ProjectType, TsConfig, AliasConfig, PackageManager } from './types.js';
import { CONFIG_FILES, CSS_LOCATIONS, DEFAULT_ALIASES } from './constants.js';
import { logger } from './logger.js';

const defaultDiskFs = new DiskFileSystemAdapter();

interface ProjectTypeCacheEntry {
    result: ProjectType;
    packageJsonMtimeMs: number | null;
}

const projectTypeCache = new Map<string, ProjectTypeCacheEntry>();

export function clearProjectTypeCache(): void {
    projectTypeCache.clear();
}

async function hasAnyFile(cwd: string, files: readonly string[], fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<boolean> {
    for (const file of files) {
        if (await fsAdapter.pathExists(path.join(cwd, file))) return true;
    }
    return false;
}

async function findFirstExisting(cwd: string, files: readonly string[], fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<string | null> {
    for (const file of files) {
        if (await fsAdapter.pathExists(path.join(cwd, file))) {
            return file;
        }
    }
    return null;
}

async function getPackageJsonMtimeMs(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<number | null> {
    try {
        const stat = await fsAdapter.stat(path.join(cwd, 'package.json'));
        return stat.mtimeMs;
    } catch {
        return null;
    }
}

async function hasVueDependency(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<boolean> {
    try {
        const packageJson: Record<string, Record<string, string> | undefined> = await fsAdapter.readJson(path.join(cwd, 'package.json'));
        return Boolean(
            packageJson.dependencies?.['vue'] ||
                packageJson.devDependencies?.['vue'] ||
                packageJson.dependencies?.['nuxt'] ||
                packageJson.devDependencies?.['nuxt']
        );
    } catch {
        return false;
    }
}

export async function detectProjectType(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<ProjectType> {
    const packageJsonMtimeMs = await getPackageJsonMtimeMs(cwd, fsAdapter);
    const cached = projectTypeCache.get(cwd);
    if (packageJsonMtimeMs !== null && cached && cached.packageJsonMtimeMs === packageJsonMtimeMs) {
        return cached.result;
    }

    const hasNuxt = await hasAnyFile(cwd, CONFIG_FILES.nuxt, fsAdapter);
    const hasSrc = await fsAdapter.pathExists(path.join(cwd, 'src'));

    let result: ProjectType;
    if (hasNuxt) result = 'nuxt';
    else if (await hasVueDependency(cwd, fsAdapter)) result = hasSrc ? 'vite-vue-src' : 'vite-vue';
    else result = 'unknown';

    projectTypeCache.set(cwd, { result, packageJsonMtimeMs });
    return result;
}

export async function detectWorkspaceRoot(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<string | null> {
    let current = path.resolve(cwd);

    while (true) {
        if (await fsAdapter.pathExists(path.join(current, 'pnpm-workspace.yaml'))) {
            return current;
        }

        if (await fsAdapter.pathExists(path.join(current, 'lerna.json'))) {
            return current;
        }

        if (await fsAdapter.pathExists(path.join(current, 'turbo.json'))) {
            return current;
        }

        const pkgPath = path.join(current, 'package.json');
        if (await fsAdapter.pathExists(pkgPath)) {
            try {
                const pkg = await fsAdapter.readJson<Record<string, unknown>>(pkgPath);
                if (pkg.workspaces) {
                    return current;
                }
            } catch { /* ignore malformed package.json */ }
        }

        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
    }

    return null;
}

export async function detectPackageManager(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<PackageManager> {
    const { lockfiles } = CONFIG_FILES;
    let current = path.resolve(cwd);

    while (true) {
        if (await fsAdapter.pathExists(path.join(current, lockfiles.pnpm))) return 'pnpm';
        if (await fsAdapter.pathExists(path.join(current, lockfiles.yarn))) return 'yarn';
        if (await fsAdapter.pathExists(path.join(current, lockfiles.bun))) return 'bun';

        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
    }

    return 'npm';
}

interface RawTsConfig extends TsConfig {
    extends?: string | string[];
}

export async function resolveTsConfigExtendsPath(extend: string, baseDir: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<string | null> {
    const candidates: string[] = [];

    if (path.isAbsolute(extend)) {
        candidates.push(extend);
    } else if (extend.startsWith('.')) {
        candidates.push(path.resolve(baseDir, extend));
    } else {
        candidates.push(path.resolve(baseDir, 'node_modules', extend));
        candidates.push(path.resolve(baseDir, 'node_modules', `${extend}.json`));
        try {
            const requireFromBase = createRequire(path.join(baseDir, 'package.json'));
            candidates.push(requireFromBase.resolve(extend));
        } catch {
            logger.warn(`Unable to resolve tsconfig extends package "${extend}" from "${baseDir}", falling back to relative path resolution.`);
            candidates.push(path.resolve(baseDir, extend));
        }
    }

    for (const candidate of candidates) {
        if (await fsAdapter.pathExists(candidate)) return candidate;
        if (!path.extname(candidate)) {
            const withJson = `${candidate}.json`;
            if (await fsAdapter.pathExists(withJson)) return withJson;
        }
    }

    return null;
}

export async function readTsConfigFile(configPath: string, visited: Set<string>, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<TsConfig | null> {
    let realPath: string;
    try {
        realPath = await fsAdapter.realpath(configPath);
    } catch {
        realPath = path.resolve(configPath);
    }
    if (visited.has(realPath)) return null;
    visited.add(realPath);

    let content: string;
    try {
        content = await fsAdapter.readFile(configPath, 'utf-8');
    } catch {
        return null;
    }
    const parsed = parseJsonc(content) as RawTsConfig | undefined;
    if (!parsed) return null;

    const mergedOptions: NonNullable<TsConfig['compilerOptions']> = {};

    const extendsValue = parsed.extends;
    let extendsList: string[] | undefined;
    if (typeof extendsValue === 'string') {
        extendsList = [extendsValue];
    } else if (Array.isArray(extendsValue)) {
        extendsList = extendsValue;
    }
    if (extendsList) {
        for (const extend of extendsList) {
            const extendPath = await resolveTsConfigExtendsPath(extend, path.dirname(configPath), fsAdapter);
            if (!extendPath) continue;
            const base = await readTsConfigFile(extendPath, visited, fsAdapter);
            if (base?.compilerOptions) {
                Object.assign(mergedOptions, base.compilerOptions);
            }
        }
    }

    Object.assign(mergedOptions, parsed.compilerOptions);
    return { compilerOptions: mergedOptions };
}

export async function readTsConfig(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<TsConfig | null> {
    for (const configFile of CONFIG_FILES.tsconfig) {
        const configPath = path.join(cwd, configFile);

        if (!await fsAdapter.pathExists(configPath)) continue;

        const parsed = await readTsConfigFile(configPath, new Set<string>(), fsAdapter);
        if (parsed) return parsed;
    }

    return null;
}

export async function findTailwindConfig(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<string | null> {
    return findFirstExisting(cwd, CONFIG_FILES.tailwind, fsAdapter);
}

export async function findCssFile(cwd: string, projectType: ProjectType, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<string | null> {
    const locations = CSS_LOCATIONS[projectType];
    return findFirstExisting(cwd, locations, fsAdapter);
}

const CONVENTIONAL_ALIAS_PREFIXES = ['@', '~', '#'] as const;

export async function getAliasFromTsConfig(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<AliasConfig | null> {
    const tsConfig = await readTsConfig(cwd, fsAdapter);
    const paths = tsConfig?.compilerOptions?.paths;

    if (!paths) return null;

    const wildcardAliases = Object.keys(paths).filter(alias => alias.endsWith('/*'));
    const conventionalPrefix = CONVENTIONAL_ALIAS_PREFIXES
        .find(prefix => wildcardAliases.includes(`${prefix}/*`));
    const prefix = conventionalPrefix ?? wildcardAliases[0]?.replace('/*', '');
    if (!prefix) return null;

    return {
        components: `${prefix}/components`,
        utils: `${prefix}/lib/utils`,
        composables: `${prefix}/composables`,
    };
}

export async function getDefaultAliases(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<AliasConfig> {
    return await getAliasFromTsConfig(cwd, fsAdapter) ?? { ...DEFAULT_ALIASES };
}
