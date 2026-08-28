import path from 'node:path';
import { createRequire } from 'node:module';
import { parse as parseJsonc } from 'jsonc-parser';
import { DiskFileSystemAdapter, type FileSystemAdapter } from 'brutx-shared-vue/fs';
import { SfcAstEngine } from 'brutx-shared-vue/ast';
import type { ProjectType, TsConfig, AliasConfig, PackageManager, BrutalistConfig } from './types.js';
import { CONFIG_FILES, CSS_LOCATIONS, DEFAULT_ALIASES } from './constants.js';
import { logger } from './logger.js';
import { ProjectContext } from './project-context.js';

const defaultDiskFs = new DiskFileSystemAdapter();

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

interface ProjectTypeCacheEntry {
    result: ProjectType;
    packageJsonMtimeMs: number | null;
}

const projectTypeCache = new Map<string, ProjectTypeCacheEntry>();

export function clearProjectTypeCache(): void {
    projectTypeCache.clear();
}

async function getPackageJsonMtimeMs(cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<number | null> {
    try {
        const stat = await fsAdapter.stat(path.join(cwd, 'package.json'));
        return stat.mtimeMs;
    } catch {
        return null;
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
    const root = path.parse(current).root;

    while (current !== root) {
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

    if (await fsAdapter.pathExists(path.join(cwd, lockfiles.pnpm))) return 'pnpm';
    if (await fsAdapter.pathExists(path.join(cwd, lockfiles.yarn))) return 'yarn';
    if (await fsAdapter.pathExists(path.join(cwd, lockfiles.bun))) return 'bun';

    let current = path.resolve(cwd);
    const root = path.parse(current).root;

    while (current !== root) {
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;

        if (await fsAdapter.pathExists(path.join(current, lockfiles.pnpm))) return 'pnpm';
        if (await fsAdapter.pathExists(path.join(current, lockfiles.yarn))) return 'yarn';
        if (await fsAdapter.pathExists(path.join(current, lockfiles.bun))) return 'bun';
    }

    return 'npm';
}

interface RawTsConfig extends TsConfig {
    extends?: string | string[];
}

async function resolveTsConfigExtendsPath(extend: string, baseDir: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<string | null> {
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

async function readTsConfigFile(configPath: string, visited: Set<string>, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<TsConfig | null> {
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

export async function resolveAliasPath(alias: string, cwd: string, fsAdapter: FileSystemAdapter = defaultDiskFs): Promise<string> {
    const ctx = await ProjectContext.loadUninitialized(cwd, { fs: fsAdapter });
    return ctx.resolveAliasPath(alias);
}

export async function resolveUtilsFilePath(
    config: { sharedBase?: string; aliases: { utils: string } },
    cwd: string,
    fsAdapter: FileSystemAdapter = defaultDiskFs
): Promise<string> {
    const ctx = await ProjectContext.loadUninitialized(cwd, { configOverride: config as BrutalistConfig, fs: fsAdapter });
    return ctx.resolveUtilsFilePath();
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

export function extractScriptBlocks(content: string): Array<{ start: number; end: number; code: string }> {
    const desc = SfcAstEngine.parse(content);
    const blocks: Array<{ start: number; end: number; code: string }> = [];
    if (desc.isSfc && (desc.script || desc.scriptSetup)) {
        if (desc.script) blocks.push({ start: desc.script.startOffset, end: desc.script.endOffset, code: desc.script.content });
        if (desc.scriptSetup) blocks.push({ start: desc.scriptSetup.startOffset, end: desc.scriptSetup.endOffset, code: desc.scriptSetup.content });
    } else {
        blocks.push({ start: 0, end: content.length, code: content });
    }
    return blocks;
}

export function resolveImportAlias(content: string, config: BrutalistConfig): string {
    const sharedBase = config.sharedBase;
    const composablesAlias = config.aliases.composables ?? config.aliases.utils.replace(/\/utils$/, '/composables');
    const localesAlias = config.aliases.locales ?? `${path.dirname(composablesAlias)}/locales`;
    const directivesAlias = config.aliases.directives ?? `${path.dirname(composablesAlias)}/directives`;
    const libAlias = path.dirname(config.aliases.utils);

    return SfcAstEngine.transformImports(content, ctx => {
        const spec = ctx.specifier;
        if (!spec.startsWith('@/')) return spec;

        if (spec === '@/lib/utils') {
            return sharedBase ? `${sharedBase}/utils` : config.aliases.utils;
        }
        if (spec.startsWith('@/components/')) {
            return spec.replace('@/components', config.aliases.components);
        }
        if (spec.startsWith('@/composables/')) {
            return sharedBase
                ? spec.replace('@/composables', `${sharedBase}/hooks`)
                : spec.replace('@/composables', composablesAlias);
        }
        if (spec.startsWith('@/lib/')) {
            return sharedBase
                ? spec.replace('@/lib', `${sharedBase}/lib`)
                : spec.replace('@/lib', libAlias);
        }
        if (spec.startsWith('@/locales/')) {
            return spec.replace('@/locales', localesAlias);
        }
        if (spec.startsWith('@/directives/')) {
            return spec.replace('@/directives', directivesAlias);
        }
        return spec;
    });
}

export { assertSafePath, isSafePath, verifyWrittenPath } from './security.js';
