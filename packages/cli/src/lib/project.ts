import fs from 'fs-extra';
import path from 'path';
import type { ProjectType, TsConfig, AliasConfig, PackageManager, BrutalistConfig } from './types.js';
import { CONFIG_FILES, CSS_LOCATIONS, DEFAULT_ALIASES } from './constants.js';

function hasAnyFile(cwd: string, files: readonly string[]): boolean {
    return files.some((file) => fs.existsSync(path.join(cwd, file)));
}

function findFirstExisting(cwd: string, files: readonly string[]): string | null {
    for (const file of files) {
        if (fs.existsSync(path.join(cwd, file))) {
            return file;
        }
    }
    return null;
}

function hasVueDependency(cwd: string): boolean {
    try {
        const packageJson = fs.readJsonSync(path.join(cwd, 'package.json'));
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

export function detectProjectType(cwd: string): ProjectType {
    const hasNuxt = hasAnyFile(cwd, CONFIG_FILES.nuxt);
    const hasSrc = fs.existsSync(path.join(cwd, 'src'));

    if (hasNuxt) return 'nuxt';

    if (hasVueDependency(cwd)) {
        return hasSrc ? 'vite-vue-src' : 'vite-vue';
    }

    return 'unknown';
}

export function detectPackageManager(cwd: string): PackageManager {
    const { lockfiles } = CONFIG_FILES;

    if (fs.existsSync(path.join(cwd, lockfiles.pnpm))) return 'pnpm';
    if (fs.existsSync(path.join(cwd, lockfiles.yarn))) return 'yarn';
    if (fs.existsSync(path.join(cwd, lockfiles.bun))) return 'bun';

    return 'npm';
}

function stripJsonComments(content: string): string {
    let result = '';
    let inString = false;
    let stringChar = '';
    let i = 0;

    while (i < content.length) {
        const char = content[i];
        const next = content[i + 1];

        if (inString) {
            result += char;
            if (char === '\\' && i + 1 < content.length) {
                result += content[i + 1];
                i += 2;
                continue;
            }
            if (char === stringChar) {
                inString = false;
            }
            i++;
            continue;
        }

        if (char === '"' || char === "'") {
            inString = true;
            stringChar = char;
            result += char;
            i++;
            continue;
        }

        if (char === '/' && next === '/') {
            while (i < content.length && content[i] !== '\n') {
                i++;
            }
            continue;
        }

        if (char === '/' && next === '*') {
            i += 2;
            while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
                i++;
            }
            if (i < content.length) {
                i += 2;
            }
            continue;
        }

        result += char;
        i++;
    }

    return result;
}

function stripJsonTrailingCommas(content: string): string {
    let result = '';
    let inString = false;
    let stringChar = '';
    let i = 0;

    while (i < content.length) {
        const char = content[i];

        if (inString) {
            result += char;
            if (char === '\\' && i + 1 < content.length) {
                result += content[i + 1];
                i += 2;
                continue;
            }
            if (char === stringChar) {
                inString = false;
            }
            i++;
            continue;
        }

        if (char === '"' || char === "'") {
            inString = true;
            stringChar = char;
            result += char;
            i++;
            continue;
        }

        if (char === ',') {
            let j = i + 1;
            while (j < content.length && /\s/.test(content[j])) {
                j++;
            }
            if (content[j] === '}' || content[j] === ']') {
                i++;
                continue;
            }
        }

        result += char;
        i++;
    }

    return result;
}

export function readTsConfig(cwd: string): TsConfig | null {
    for (const configFile of CONFIG_FILES.tsconfig) {
        const configPath = path.join(cwd, configFile);

        if (!fs.existsSync(configPath)) continue;

        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            const jsonContent = stripJsonTrailingCommas(stripJsonComments(content));
            return JSON.parse(jsonContent);
        } catch {
            continue;
        }
    }
    return null;
}

export function findTailwindConfig(cwd: string): string | null {
    return findFirstExisting(cwd, CONFIG_FILES.tailwind);
}

export function findCssFile(cwd: string, projectType: ProjectType): string | null {
    const locations = CSS_LOCATIONS[projectType];
    return findFirstExisting(cwd, locations);
}

export function getAliasFromTsConfig(cwd: string): AliasConfig | null {
    const tsConfig = readTsConfig(cwd);
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

export function resolveAliasPath(alias: string, cwd: string): string {
    const match = alias.match(/^(@[^/]*|~)\/(.*)/);

    if (!match) {
        return path.join(cwd, alias);
    }

    const [, aliasPrefix, relativePath] = match;

    const resolvedFromConfig = resolveFromTsConfig(cwd, aliasPrefix, relativePath);
    if (resolvedFromConfig) return resolvedFromConfig;

    return resolveByProjectType(cwd, relativePath);
}

function resolveFromTsConfig(
    cwd: string,
    aliasPrefix: string,
    relativePath: string
): string | null {
    const tsConfig = readTsConfig(cwd);
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

function resolveByProjectType(cwd: string, relativePath: string): string {
    const projectType = detectProjectType(cwd);

    const projectTypeToBase: Record<ProjectType, string> = {
        'vite-vue-src': 'src',
        'vite-vue': '',
        nuxt: '',
        unknown: fs.existsSync(path.join(cwd, 'src')) ? 'src' : '',
    };

    const base = projectTypeToBase[projectType];
    return path.join(cwd, base, relativePath);
}

function inferTailwindVersionFromConfig(cwd: string): 'v3' | 'v4' {
    const hasConfig = CONFIG_FILES.tailwind.some(file => fs.existsSync(path.join(cwd, file)));
    return hasConfig ? 'v3' : 'v4';
}

export function getDefaultAliases(cwd: string): AliasConfig {
    return getAliasFromTsConfig(cwd) ?? { ...DEFAULT_ALIASES };
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

export function isSafePath(targetPath: string, cwd: string): boolean {
    const normalize = process.platform === 'win32'
        ? (s: string) => s.toLowerCase()
        : (s: string) => s;
    const resolvedTarget = normalize(path.resolve(targetPath));
    const resolvedCwd = normalize(path.resolve(cwd));
    return resolvedTarget.startsWith(resolvedCwd + path.sep) || resolvedTarget === resolvedCwd;
}

export function detectTailwindVersion(cwd: string): 'v3' | 'v4' {
    try {
        const pkgJsonPath = path.join(cwd, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
            const pkg = fs.readJsonSync(pkgJsonPath);
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
