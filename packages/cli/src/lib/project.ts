import fs from 'fs-extra';
import path from 'path';
import { parse as parseJsonc } from 'jsonc-parser';
import { initSync, parse as parseModuleImports } from 'es-module-lexer';
import type { ProjectType, TsConfig, AliasConfig, PackageManager, BrutalistConfig } from './types.js';
import { CONFIG_FILES, CSS_LOCATIONS, DEFAULT_ALIASES } from './constants.js';

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

const projectTypeCache = new Map<string, ProjectType>();

export function clearProjectTypeCache(): void {
    projectTypeCache.clear();
}

export async function detectProjectType(cwd: string): Promise<ProjectType> {
    const cached = projectTypeCache.get(cwd);
    if (cached) return cached;

    const hasNuxt = await hasAnyFile(cwd, CONFIG_FILES.nuxt);
    const hasSrc = await fs.pathExists(path.join(cwd, 'src'));

    let result: ProjectType;
    if (hasNuxt) result = 'nuxt';
    else if (await hasVueDependency(cwd)) result = hasSrc ? 'vite-vue-src' : 'vite-vue';
    else result = 'unknown';

    projectTypeCache.set(cwd, result);
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
            } catch {
            }
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

export async function readTsConfig(cwd: string): Promise<TsConfig | null> {
    for (const configFile of CONFIG_FILES.tsconfig) {
        const configPath = path.join(cwd, configFile);

        if (!await fs.pathExists(configPath)) continue;

        try {
            const content = await fs.readFile(configPath, 'utf-8');
            const parsed = parseJsonc(content) as TsConfig;
            return parsed;
        } catch {
            continue;
        }
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

export async function getAliasFromTsConfig(cwd: string): Promise<AliasConfig | null> {
    const tsConfig = await readTsConfig(cwd);
    const paths = tsConfig?.compilerOptions?.paths;

    if (!paths) return null;

    for (const alias of Object.keys(paths)) {
        if (alias.endsWith('/*')) {
            const prefix = alias.replace('/*', '');
            return {
                components: `${prefix}/components`,
                utils: `${prefix}/lib/utils`,
                composables: `${prefix}/composables`,
            };
        }
    }

    return null;
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

    if (paths[aliasPattern]) {
        const targets = paths[aliasPattern];
        // TypeScript `paths` arrays are ordered fallbacks. Return the first
        // target whose resolved path actually exists on disk; if none match
        // (e.g. file not yet created, or no-extension file path), fall back
        // to the first target to preserve prior single-target behavior.
        for (const targetPath of targets) {
            const resolvedBase = targetPath.replace('/*', '');
            const candidate = path.join(cwd, baseUrl, resolvedBase, relativePath);
            if (await fs.pathExists(candidate)) {
                return candidate;
            }
        }
        const firstBase = targets[0].replace('/*', '');
        return path.join(cwd, baseUrl, firstBase, relativePath);
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

export async function getDefaultAliases(cwd: string): Promise<AliasConfig> {
    return await getAliasFromTsConfig(cwd) ?? { ...DEFAULT_ALIASES };
}

function extractScriptBlocks(content: string): Array<{ start: number; end: number; code: string }> {
    const blocks: Array<{ start: number; end: number; code: string }> = [];
    // Note: this regex is non-greedy and may split prematurely if a string literal
    // inside <script> contains the substring "</script>". Current codebase does not
    // trigger this, but it remains a known limitation; switching to
    // @vue/compiler-sfc would resolve it definitively.
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
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
    const isVueSfc = /<script[\s>]/i.test(content);

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
                    replacements.push({
                        start: offset + imp.s,
                        end: offset + imp.e,
                        replacement: newPath,
                    });
                }
            }
        } catch {
        }
    };

    if (isVueSfc) {
        for (const block of extractScriptBlocks(content)) {
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
