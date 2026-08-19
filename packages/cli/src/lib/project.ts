import path from 'node:path';
import { createRequire } from 'node:module';
import { parse as parseJsonc } from 'jsonc-parser';
import { initSync, parse as parseModuleImports } from 'es-module-lexer';
import { DiskFileSystemAdapter, type FileSystemAdapter } from 'brutx-shared-vue/fs';
import type { ProjectType, TsConfig, AliasConfig, PackageManager, BrutalistConfig } from './types.js';
import { CONFIG_FILES, CSS_LOCATIONS, DEFAULT_ALIASES } from './constants.js';
import { logger } from './logger.js';
import { ProjectContext } from './project-context.js';

initSync();

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
    const blocks: Array<{ start: number; end: number; code: string }> = [];
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/gi;
    let match;
    while ((match = scriptRegex.exec(content)) !== null) {
        const scriptCode = match[1];
        const openTagEnd = match[0].indexOf('>') + 1;
        const codeStart = match.index + openTagEnd;
        blocks.push({
            start: codeStart,
            end: codeStart + scriptCode.length,
            code: scriptCode,
        });
    }
    return blocks;
}

export function resolveImportAlias(content: string, config: BrutalistConfig): string {
    const sharedBase = config.sharedBase;
    const composablesAlias = config.aliases.composables ?? config.aliases.utils.replace(/\/utils$/, '/composables');
    const localesAlias = `${path.dirname(composablesAlias)}/locales`;
    const directivesAlias = `${path.dirname(composablesAlias)}/directives`;
    const libAlias = path.dirname(config.aliases.utils);
    const scriptBlocks = extractScriptBlocks(content);

    interface Replacement { start: number; end: number; replacement: string }
    const replacements: Replacement[] = [];

    const collectReplacements = (code: string, offset: number): void => {
        try {
            const [imports] = parseModuleImports(code);
            for (const imp of imports) {
                if (!imp.n || !imp.n.startsWith('@/')) continue;

                let newPath: string | null = null;
                if (imp.n === '@/lib/utils') {
                    newPath = sharedBase ? `${sharedBase}/utils` : config.aliases.utils;
                } else if (imp.n.startsWith('@/components/')) {
                    newPath = imp.n.replace('@/components', config.aliases.components);
                } else if (imp.n.startsWith('@/composables/')) {
                    newPath = sharedBase
                        ? imp.n.replace('@/composables', `${sharedBase}/hooks`)
                        : imp.n.replace('@/composables', composablesAlias);
                } else if (imp.n.startsWith('@/lib/')) {
                    if (sharedBase) {
                        newPath = imp.n.replace('@/lib', `${sharedBase}/lib`);
                    } else {
                        newPath = imp.n.replace('@/lib', libAlias);
                    }
                } else if (imp.n.startsWith('@/locales/')) {
                    newPath = imp.n.replace('@/locales', localesAlias);
                } else if (imp.n.startsWith('@/directives/')) {
                    newPath = imp.n.replace('@/directives', directivesAlias);
                }

                if (newPath) {
                    replacements.push({
                        start: offset + imp.s,
                        end: offset + imp.e,
                        replacement: newPath,
                    });
                }
            }
        } catch { /* ignore parse failures in import rewriting */ }
    };

    if (scriptBlocks.length > 0) {
        for (const block of scriptBlocks) {
            collectReplacements(block.code, block.start);
        }
    } else {
        collectReplacements(content, 0);
    }

    if (replacements.length === 0) return content;

    replacements.sort((a, b) => b.start - a.start);

    let result = content;
    for (const { start, end, replacement } of replacements) {
        result = result.slice(0, start) + replacement + result.slice(end);
    }

    return result;
}

export { assertSafePath, isSafePath, verifyWrittenPath } from './security.js';
