import fs from 'fs-extra';
import path from 'path';
import { parse as parseJsonc } from 'jsonc-parser';
import type { ProjectType, TsConfig, AliasConfig, PackageManager, BrutalistConfig } from './types.js';
import { CONFIG_FILES, CSS_LOCATIONS, DEFAULT_ALIASES } from './constants.js';

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

export async function detectProjectType(cwd: string): Promise<ProjectType> {
    const hasNuxt = await hasAnyFile(cwd, CONFIG_FILES.nuxt);
    const hasSrc = await fs.pathExists(path.join(cwd, 'src'));

    if (hasNuxt) return 'nuxt';

    if (await hasVueDependency(cwd)) {
        return hasSrc ? 'vite-vue-src' : 'vite-vue';
    }

    return 'unknown';
}

export async function detectPackageManager(cwd: string): Promise<PackageManager> {
    const { lockfiles } = CONFIG_FILES;

    if (await fs.pathExists(path.join(cwd, lockfiles.pnpm))) return 'pnpm';
    if (await fs.pathExists(path.join(cwd, lockfiles.yarn))) return 'yarn';
    if (await fs.pathExists(path.join(cwd, lockfiles.bun))) return 'bun';

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
        const targetPath = paths[aliasPattern][0];
        const resolvedBase = targetPath.replace('/*', '');
        return path.join(cwd, baseUrl, resolvedBase, relativePath);
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

async function inferTailwindVersionFromConfig(cwd: string): Promise<'v3' | 'v4'> {
    for (const file of CONFIG_FILES.tailwind) {
        if (await fs.pathExists(path.join(cwd, file))) return 'v3';
    }
    return 'v4';
}

export async function getDefaultAliases(cwd: string): Promise<AliasConfig> {
    return await getAliasFromTsConfig(cwd) ?? { ...DEFAULT_ALIASES };
}

export function resolveImportAlias(content: string, config: BrutalistConfig): string {
    const composablesAlias = config.aliases.composables ?? config.aliases.utils.replace(/\/utils$/, '/composables');
    const localesAlias = `${path.dirname(composablesAlias)}/locales`;

    return content
        .replace(/(["'])@\/lib\/utils\1/g, `$1${config.aliases.utils}$1`)
        .replace(/(["'])@\/components\/(.*?)\1/g, `$1${config.aliases.components}/$2$1`)
        .replace(/(["'])@\/composables\/(.*?)\1/g, `$1${composablesAlias}/$2$1`)
        .replace(/(["'])@\/locales\/(.*?)\1/g, `$1${localesAlias}/$2$1`);
}

export async function isSafePath(targetPath: string, cwd: string): Promise<boolean> {
    const normalize = process.platform === 'win32'
        ? (s: string) => s.toLowerCase()
        : (s: string) => s;

    // Resolve symlinks to prevent symlink-based path traversal attacks
    let resolvedTarget: string;
    let resolvedCwd: string;
    try {
        // Use realpath to resolve symlinks
        resolvedTarget = normalize(await fs.promises.realpath(path.resolve(targetPath)));
        resolvedCwd = normalize(await fs.promises.realpath(path.resolve(cwd)));
    } catch {
        // If realpath fails (e.g., path doesn't exist), fall back to path.resolve
        resolvedTarget = normalize(path.resolve(targetPath));
        resolvedCwd = normalize(path.resolve(cwd));
    }

    // 磁盘根目录作为 cwd 不安全，因为它允许访问整个磁盘
    if (resolvedCwd === normalize(path.parse(resolvedCwd).root)) {
        return false;
    }

    return resolvedTarget.startsWith(resolvedCwd + path.sep) || resolvedTarget === resolvedCwd;
}

export async function detectTailwindVersion(cwd: string): Promise<'v3' | 'v4'> {
    try {
        const pkgJsonPath = path.join(cwd, 'package.json');
        if (await fs.pathExists(pkgJsonPath)) {
            const pkg: Record<string, Record<string, string> | undefined> = await fs.readJson(pkgJsonPath);
            const tailwindVersion = pkg.dependencies?.['tailwindcss'] || pkg.devDependencies?.['tailwindcss'];

            if (tailwindVersion) {
                const cleanVersion = tailwindVersion.replace(/^[^0-9]+/, '');
                if (cleanVersion.startsWith('4')) {
                    return 'v4';
                }
                if (cleanVersion.startsWith('3')) {
                    return 'v3';
                }
            }
        }
    } catch {
        return inferTailwindVersionFromConfig(cwd);
    }

    return inferTailwindVersionFromConfig(cwd);
}
