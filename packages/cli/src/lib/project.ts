import fs from 'fs-extra';
import path from 'path';
import { createRequire } from 'module';
import { parse as parseJsonc } from 'jsonc-parser';
import { initSync, parse as parseModuleImports } from 'es-module-lexer';
import type { ProjectType, TsConfig, AliasConfig, PackageManager, BrutalistConfig } from './types.js';
import { CONFIG_FILES, CSS_LOCATIONS, DEFAULT_ALIASES } from './constants.js';
import { CliError } from './error.js';
import { logger } from './logger.js';

initSync();

async function hasAnyFile(cwd: string, files: readonly string[]): Promise<boolean> {
    for (const file of files) {
        if (await fs.pathExists(path.join(cwd, file))) return true;
    }
    return false;
}

async function findFirstExisting(cwd: string, files: readonly string[]): Promise<string | null> {
    for (const file of files) {
        if (await fs.pathExists(path.join(cwd, file))) {
            return file;
        }
    }
    return null;
}

async function hasVueDependency(cwd: string): Promise<boolean> {
    try {
        const packageJson: Record<string, Record<string, string> | undefined> = await fs.readJson(path.join(cwd, 'package.json'));
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
    /** package.json 的 mtime（毫秒），用于探测依据变化时使缓存失效 */
    packageJsonMtimeMs: number | null;
}

const projectTypeCache = new Map<string, ProjectTypeCacheEntry>();

export function clearProjectTypeCache(): void {
    projectTypeCache.clear();
}

/**
 * 读取 package.json 的 mtimeMs 作为依赖变化的失效信号。
 * package.json 不存在或读取失败时返回 null（此时不启用缓存命中）。
 */
async function getPackageJsonMtimeMs(cwd: string): Promise<number | null> {
    try {
        const stat = await fs.stat(path.join(cwd, 'package.json'));
        return stat.mtimeMs;
    } catch {
        return null;
    }
}

export async function detectProjectType(cwd: string): Promise<ProjectType> {
    const packageJsonMtimeMs = await getPackageJsonMtimeMs(cwd);
    const cached = projectTypeCache.get(cwd);
    // 仅在 package.json 特征未变化时命中缓存：init 后新增 vue/nuxt 依赖或
    // 修改 package.json 会改变 mtime，使缓存失效并重新探测；
    // package.json 始终不存在（mtime 为 null）时不启用缓存命中，与
    // getPackageJsonMtimeMs 的语义一致
    if (packageJsonMtimeMs !== null && cached && cached.packageJsonMtimeMs === packageJsonMtimeMs) {
        return cached.result;
    }

    const hasNuxt = await hasAnyFile(cwd, CONFIG_FILES.nuxt);
    const hasSrc = await fs.pathExists(path.join(cwd, 'src'));

    let result: ProjectType;
    if (hasNuxt) result = 'nuxt';
    else if (await hasVueDependency(cwd)) result = hasSrc ? 'vite-vue-src' : 'vite-vue';
    else result = 'unknown';

    projectTypeCache.set(cwd, { result, packageJsonMtimeMs });
    return result;
}

export async function detectWorkspaceRoot(cwd: string): Promise<string | null> {
    let current = path.resolve(cwd);
    const root = path.parse(current).root;

    while (current !== root) {
        if (await fs.pathExists(path.join(current, 'pnpm-workspace.yaml'))) {
            return current;
        }

        if (await fs.pathExists(path.join(current, 'lerna.json'))) {
            return current;
        }

        if (await fs.pathExists(path.join(current, 'turbo.json'))) {
            return current;
        }

        const pkgPath = path.join(current, 'package.json');
        if (await fs.pathExists(pkgPath)) {
            try {
                const pkg = await fs.readJson(pkgPath) as Record<string, unknown>;
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

export async function detectPackageManager(cwd: string): Promise<PackageManager> {
    const { lockfiles } = CONFIG_FILES;

    if (await fs.pathExists(path.join(cwd, lockfiles.pnpm))) return 'pnpm';
    if (await fs.pathExists(path.join(cwd, lockfiles.yarn))) return 'yarn';
    if (await fs.pathExists(path.join(cwd, lockfiles.bun))) return 'bun';

    let current = path.resolve(cwd);
    const root = path.parse(current).root;

    while (current !== root) {
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;

        if (await fs.pathExists(path.join(current, lockfiles.pnpm))) return 'pnpm';
        if (await fs.pathExists(path.join(current, lockfiles.yarn))) return 'yarn';
        if (await fs.pathExists(path.join(current, lockfiles.bun))) return 'bun';
    }

    return 'npm';
}

/**
 * 局部扩展类型：types.ts 的 TsConfig 不含 extends 字段，
 * 递归解析 extends 链时需要读取它（不改动 types.ts）。
 */
interface RawTsConfig extends TsConfig {
    extends?: string | string[];
}

/**
 * 解析 extends 指向的配置文件路径。
 * - 绝对路径或相对路径：以当前配置所在目录为基准
 * - 包名（如 @vue/tsconfig、@tsconfig/node）：先按 Node 模块解析
 *   （相对当前配置目录向上查找 node_modules），失败时输出 warn 提示并
 *   退化为相对路径（与 TypeScript 的 extends fallback 语义一致）
 * - 路径未带扩展名时自动尝试补 .json
 * 解析失败（文件缺失）返回 null，由调用方忽略并继续。
 */
async function resolveTsConfigExtendsPath(extend: string, baseDir: string): Promise<string | null> {
    const candidates: string[] = [];

    if (path.isAbsolute(extend)) {
        candidates.push(extend);
    } else if (extend.startsWith('.')) {
        candidates.push(path.resolve(baseDir, extend));
    } else {
        try {
            // createRequire 只需 baseDir 内任意真实路径作基准即可按该目录解析，
            // 用 package.json 而非魔法探测文件名
            const requireFromBase = createRequire(path.join(baseDir, 'package.json'));
            candidates.push(requireFromBase.resolve(extend));
        } catch {
            // 包名不可解析（包不存在/未安装/未导出）时按相对路径退化，
            // 贴近 TypeScript 行为；输出 warn 提示避免静默误判
            logger.warn(`Unable to resolve tsconfig extends package "${extend}" from "${baseDir}", falling back to relative path resolution.`);
            candidates.push(path.resolve(baseDir, extend));
        }
    }

    for (const candidate of candidates) {
        if (await fs.pathExists(candidate)) return candidate;
        if (!path.extname(candidate)) {
            const withJson = `${candidate}.json`;
            if (await fs.pathExists(withJson)) return withJson;
        }
    }

    return null;
}

/**
 * 递归读取单个 tsconfig 文件并展开其 extends 链。
 * 合并规则：基座配置先合并（extends 数组按顺序后者覆盖前者），
 * 当前文件的 compilerOptions 最后合并、整体覆盖基座（含 paths）。
 * visited 集合以 realpath 记录已解析文件，防止循环引用导致无限递归。
 */
async function readTsConfigFile(configPath: string, visited: Set<string>): Promise<TsConfig | null> {
    let realPath: string;
    try {
        realPath = await fs.promises.realpath(configPath);
    } catch {
        realPath = path.resolve(configPath);
    }
    if (visited.has(realPath)) return null;
    visited.add(realPath);

    let content: string;
    try {
        content = await fs.readFile(configPath, 'utf-8');
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
            const extendPath = await resolveTsConfigExtendsPath(extend, path.dirname(configPath));
            if (!extendPath) continue;
            const base = await readTsConfigFile(extendPath, visited);
            if (base?.compilerOptions) {
                Object.assign(mergedOptions, base.compilerOptions);
            }
        }
    }

    // 当前文件覆盖基座配置
    Object.assign(mergedOptions, parsed.compilerOptions);
    return { compilerOptions: mergedOptions };
}

export async function readTsConfig(cwd: string): Promise<TsConfig | null> {
    for (const configFile of CONFIG_FILES.tsconfig) {
        const configPath = path.join(cwd, configFile);

        if (!await fs.pathExists(configPath)) continue;

        const parsed = await readTsConfigFile(configPath, new Set<string>());
        if (parsed) return parsed;
    }

    return null;
}

export async function findTailwindConfig(cwd: string): Promise<string | null> {
    return findFirstExisting(cwd, CONFIG_FILES.tailwind);
}

export async function findCssFile(cwd: string, projectType: ProjectType): Promise<string | null> {
    const locations = CSS_LOCATIONS[projectType];
    return findFirstExisting(cwd, locations);
}

/** 常见别名约定前缀，按优先级顺序匹配（registry 内容以 @/ 书写，@ 最优先） */
const CONVENTIONAL_ALIAS_PREFIXES = ['@', '~', '#'] as const;

export async function getAliasFromTsConfig(cwd: string): Promise<AliasConfig | null> {
    const tsConfig = await readTsConfig(cwd);
    const paths = tsConfig?.compilerOptions?.paths;

    if (!paths) return null;

    const wildcardAliases = Object.keys(paths).filter(alias => alias.endsWith('/*'));

    // 优先采用约定前缀（@/*、~/*、#/*），避免多别名项目中
    // 第一个以 /* 结尾的条目并非约定别名（如 assets/*）时推导出错误的层级；
    // 无约定前缀时退回原逻辑：取第一个以 /* 结尾的条目
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

export async function resolveAliasPath(alias: string, cwd: string): Promise<string> {
    const match = alias.match(/^(@[^/]*|~)\/(.*)/);

    let resolvedPath: string;

    if (!match) {
        resolvedPath = path.join(cwd, alias);
    } else {
        const [, aliasPrefix, relativePath] = match;
        const resolvedFromConfig = await resolveFromTsConfig(cwd, aliasPrefix, relativePath);
        resolvedPath = resolvedFromConfig ?? await resolveByProjectType(cwd, relativePath);
    }

    if (!await isSafePath(resolvedPath, cwd)) {
        throw new Error(
            `Security Error: Resolved path "${resolvedPath}" is outside the project directory "${cwd}". This may be a path traversal attack.`
        );
    }

    return resolvedPath;
}

async function resolveFromTsConfig(
    cwd: string,
    aliasPrefix: string,
    relativePath: string
): Promise<string | null> {
    const tsConfig = await readTsConfig(cwd);
    const paths = tsConfig?.compilerOptions?.paths;

    if (!paths) return null;

    const aliasPattern = `${aliasPrefix}/*`;
    const baseUrl = tsConfig?.compilerOptions?.baseUrl || '.';
    // baseUrl 允许为绝对路径（TypeScript 语义）；绝对路径时直接以它为基准，
    // 避免 path.join 把 cwd 与绝对路径简单拼接出 cwd/绝对路径的错误结果
    const baseDir = path.isAbsolute(baseUrl) ? baseUrl : path.join(cwd, baseUrl);

    if (paths[aliasPattern]) {
        const targets = paths[aliasPattern];
        // TypeScript `paths` arrays are ordered fallbacks. Return the first
        // target whose resolved path actually exists on disk; if none match
        // (e.g. file not yet created, or no-extension file path), fall back
        // to the first target to preserve prior single-target behavior.
        for (const targetPath of targets) {
            const resolvedBase = targetPath.replace('/*', '');
            const candidate = path.join(baseDir, resolvedBase, relativePath);
            if (await fs.pathExists(candidate)) {
                return candidate;
            }
        }
        const firstBase = targets[0].replace('/*', '');
        return path.join(baseDir, firstBase, relativePath);
    }

    return null;
}

async function resolveByProjectType(cwd: string, relativePath: string): Promise<string> {
    const projectType = await detectProjectType(cwd);

    const projectTypeToBase: Record<ProjectType, string> = {
        'vite-vue-src': 'src',
        'vite-vue': '',
        nuxt: '',
        unknown: await fs.pathExists(path.join(cwd, 'src')) ? 'src' : '',
    };

    const base = projectTypeToBase[projectType];
    return path.join(cwd, base, relativePath);
}

/**
 * 解析 utils 文件完整路径（add-service / init-service 共用，避免两处实现漂移）。
 * - sharedBase 存在时：<sharedBase>/utils.ts
 * - 否则：aliases.utils 解析路径 + '.ts'（幂等：配置已带 .ts 扩展名时不再拼接，
 *   避免 `@/lib/utils.ts` 这类配置被拼成 utils.ts.ts）
 */
export async function resolveUtilsFilePath(
    config: Pick<BrutalistConfig, 'aliases' | 'sharedBase'>,
    cwd: string
): Promise<string> {
    if (config.sharedBase) {
        return path.join(await resolveAliasPath(config.sharedBase, cwd), 'utils.ts');
    }
    const resolved = await resolveAliasPath(config.aliases.utils, cwd);
    return resolved.endsWith('.ts') ? resolved : `${resolved}.ts`;
}

export async function getDefaultAliases(cwd: string): Promise<AliasConfig> {
    return await getAliasFromTsConfig(cwd) ?? { ...DEFAULT_ALIASES };
}

export function extractScriptBlocks(content: string): Array<{ start: number; end: number; code: string }> {
    const blocks: Array<{ start: number; end: number; code: string }> = [];
    // Note: this regex is non-greedy and may split prematurely if a string literal
    // inside <script> contains the substring "</script>". Current codebase does not
    // trigger this, but it remains a known limitation; switching to
    // @vue/compiler-sfc would resolve it definitively.
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
    // libAlias mirrors where add-service.ts writes non-utils lib files
    // (path.dirname(resolveAliasPath(config.aliases.utils))): keeps write/rewrite
    // paths symmetric so cross-file `@/lib/<x>` imports resolve correctly under
    // any user-customized `aliases.utils` value, not just the default `@/lib/utils`.
    const libAlias = path.dirname(config.aliases.utils);
    // 以完整 <script>...</script> 配对判定 Vue SFC，而非仅含 "<script" 子串：
    // 普通 .ts/.js 文件中 HTML 模板字符串/文档里的 "<script" 字样会被旧正则误判为
    // SFC，导致 extractScriptBlocks 提取不到任何块、整个文件的导入被静默跳过。
    // （调用方无扩展名上下文，无法按 .vue 后缀判定，故用配对检测作后备）
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
                        // Symmetric with composables/locales/directives: rewrite to
                        // the user-configured lib directory derived from aliases.utils.
                        newPath = imp.n.replace('@/lib', libAlias);
                    }
                } else if (imp.n.startsWith('@/locales/')) {
                    newPath = imp.n.replace('@/locales', localesAlias);
                } else if (imp.n.startsWith('@/directives/')) {
                    newPath = imp.n.replace('@/directives', directivesAlias);
                }

                if (newPath) {
                    // es-module-lexer 的 imp.s/imp.e 指向去引号后的模块说明符区间
                    //（import specifier 的引号不在区间内，保留在原文中），
                    // 因此直接替换为 newPath 即可，不能用 JSON.stringify 再加引号（会叠加成双引号）。
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

/**
 * 断言路径位于项目目录内，不安全时抛出 PATH_UNSAFE 的 CliError。
 * add-service 的解析期预检与写入前复检共用，避免校验逻辑与错误文案漂移。
 */
export async function assertSafePath(targetPath: string, cwd: string): Promise<void> {
    if (!(await isSafePath(targetPath, cwd))) {
        throw new CliError(`Security Error: Resolved path "${targetPath}" is outside the project directory.`, {
            code: 'PATH_UNSAFE',
            exitCode: 2,
        });
    }
}

export async function isSafePath(targetPath: string, cwd: string): Promise<boolean> {
    const normalize = process.platform === 'win32'
        ? (s: string) => s.toLowerCase()
        : (s: string) => s;

    let resolvedCwd: string;
    try {
        resolvedCwd = normalize(await fs.promises.realpath(path.resolve(cwd)));
    } catch {
        resolvedCwd = normalize(path.resolve(cwd));
    }

    if (resolvedCwd === normalize(path.parse(resolvedCwd).root)) {
        return false;
    }

    let resolvedTarget: string;
    try {
        resolvedTarget = normalize(await fs.promises.realpath(path.resolve(targetPath)));
    } catch {
        resolvedTarget = normalize(path.resolve(targetPath));
        let current = path.resolve(targetPath);
        const root = path.parse(current).root;

        while (current !== root) {
            const parent = path.dirname(current);
            try {
                const realParent = await fs.promises.realpath(parent);
                const relative = path.relative(parent, path.resolve(targetPath));
                resolvedTarget = normalize(path.join(realParent, relative));
                break;
            } catch {
                current = parent;
            }
        }
    }

    return resolvedTarget.startsWith(resolvedCwd + path.sep) || resolvedTarget === resolvedCwd;
}

export async function verifyWrittenPath(targetPath: string, cwd: string): Promise<void> {
    const safe = await isSafePath(targetPath, cwd);
    if (!safe) {
        try {
            await fs.promises.rm(targetPath, { force: true });
        } catch {
            // best effort cleanup
        }
        throw new Error(
            `Security Error: Written path "${targetPath}" resolved outside project directory after write. ` +
            `This may indicate a symlink attack. The file has been removed.`
        );
    }
}
