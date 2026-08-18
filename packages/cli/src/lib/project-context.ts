import path from 'path';
import { createRequire } from 'module';
import { parse as parseJsonc } from 'jsonc-parser';
import { initSync, parse as parseModuleImports } from 'es-module-lexer';
import type {
    AliasConfig,
    BrutalistConfig,
    PackageManager,
    ProjectType,
    TsConfig,
} from './types.js';
import type { FileSystemAdapter } from './fs/file-system-adapter.js';
import { DiskFileSystemAdapter } from './fs/disk-fs.js';
import {
    CONFIG_FILES,
    CSS_LOCATIONS,
    DEFAULT_ALIASES,
    REGISTRY_PATH_PREFIXES,
} from './constants.js';
import { CliError } from './error.js';
import { logger } from './logger.js';
import { assertSafePath, isSafePath } from './security.js';
import { FileTransaction } from './file-transaction.js';

initSync();

export interface ProjectEnvironmentInfo {
    projectType: ProjectType;
    packageManager: PackageManager;
    workspaceRoot: string | null;
    hasSrc: boolean;
    isNuxt: boolean;
}

export interface ProjectContextOptions {
    fs?: FileSystemAdapter;
    configOverride?: BrutalistConfig;
    optionalConfig?: boolean;
}

interface RawTsConfig extends TsConfig {
    extends?: string | string[];
}

const CONVENTIONAL_ALIAS_PREFIXES = ['@', '~', '#'] as const;

export class ProjectContext {
    readonly cwd: string;
    readonly fs: FileSystemAdapter;
    readonly env: ProjectEnvironmentInfo;
    readonly tsConfig: TsConfig | null;

    private _config?: BrutalistConfig;
    private _aliasesCache?: AliasConfig;
    private _componentsDirCache?: string;
    private _utilsFilePathCache?: string;

    private constructor(
        cwd: string,
        fsAdapter: FileSystemAdapter,
        env: ProjectEnvironmentInfo,
        tsConfig: TsConfig | null,
        config?: BrutalistConfig
    ) {
        this.cwd = path.resolve(cwd);
        this.fs = fsAdapter;
        this.env = env;
        this.tsConfig = tsConfig;
        this._config = config;
    }

    get config(): BrutalistConfig | undefined {
        return this._config;
    }

    get isConfigured(): boolean {
        return this._config !== undefined;
    }

    requireConfig(): BrutalistConfig {
        if (!this._config) {
            throw new CliError('Project is not initialized with components.json. Run "brutx init" first.', {
                code: 'CONFIG_NOT_FOUND',
                exitCode: 1,
            });
        }
        return this._config;
    }

    static async load(cwd: string = process.cwd(), options: ProjectContextOptions = {}): Promise<ProjectContext> {
        const ctx = await this.loadUninitialized(cwd, options);
        if (!ctx.isConfigured) {
            throw new CliError(`components.json not found in "${cwd}". Run "brutx init" first.`, {
                code: 'CONFIG_NOT_FOUND',
                exitCode: 1,
            });
        }
        return ctx;
    }

    static async loadUninitialized(cwd: string = process.cwd(), options: ProjectContextOptions = {}): Promise<ProjectContext> {
        const fsAdapter = options.fs ?? new DiskFileSystemAdapter();
        const resolvedCwd = path.resolve(cwd);

        const [projectType, packageManager, workspaceRoot, tsConfig] = await Promise.all([
            ProjectContext.detectProjectType(resolvedCwd, fsAdapter),
            ProjectContext.detectPackageManager(resolvedCwd, fsAdapter),
            ProjectContext.detectWorkspaceRoot(resolvedCwd, fsAdapter),
            ProjectContext.readTsConfig(resolvedCwd, fsAdapter),
        ]);

        const hasSrc = await fsAdapter.pathExists(path.join(resolvedCwd, 'src'));
        const isNuxt = projectType === 'nuxt';

        const env: ProjectEnvironmentInfo = {
            projectType,
            packageManager,
            workspaceRoot,
            hasSrc,
            isNuxt,
        };

        let config = options.configOverride;
        if (!config) {
            const configPath = path.join(resolvedCwd, 'components.json');
            if (await fsAdapter.pathExists(configPath)) {
                try {
                    config = await fsAdapter.readJson<BrutalistConfig>(configPath);
                } catch (error) {
                    throw new CliError(`Failed to parse components.json in "${resolvedCwd}": ${error instanceof Error ? error.message : String(error)}`, {
                        code: 'CONFIG_INVALID',
                        exitCode: 1,
                    });
                }
            }
        }

        return new ProjectContext(resolvedCwd, fsAdapter, env, tsConfig, config);
    }

    bindConfig(config: BrutalistConfig): void {
        this._config = config;
        this.clearDerivedCaches();
    }

    private clearDerivedCaches(): void {
        this._aliasesCache = undefined;
        this._componentsDirCache = undefined;
        this._utilsFilePathCache = undefined;
    }

    async resolveTargetPath(registryPath: string): Promise<string> {
        const config = this.requireConfig();
        const sharedBase = config.sharedBase;
        let resolved: string;

        if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.components)) {
            const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.components.length);
            const aliasPath = await this.resolveAliasPath(config.aliases.components);
            resolved = path.join(aliasPath, relative);
        } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.composables)) {
            const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.composables.length);
            if (sharedBase) {
                const aliasPath = await this.resolveAliasPath(sharedBase);
                resolved = path.join(aliasPath, 'hooks', relative);
            } else {
                const aliasPath = await this.resolveAliasPath(config.aliases.composables);
                resolved = path.join(aliasPath, relative);
            }
        } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.locales)) {
            const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.locales.length);
            const composablesPath = await this.resolveAliasPath(config.aliases.composables);
            resolved = path.join(path.dirname(composablesPath), 'locales', relative);
        } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.directives)) {
            const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.directives.length);
            const composablesPath = await this.resolveAliasPath(config.aliases.composables);
            resolved = path.join(path.dirname(composablesPath), 'directives', relative);
        } else if (registryPath.startsWith('lib/utils') || registryPath.startsWith(REGISTRY_PATH_PREFIXES.libUtils)) {
            resolved = await this.resolveUtilsFilePath();
        } else if (registryPath.startsWith(REGISTRY_PATH_PREFIXES.lib)) {
            const relative = registryPath.slice(REGISTRY_PATH_PREFIXES.lib.length);
            if (sharedBase) {
                const aliasPath = await this.resolveAliasPath(sharedBase);
                resolved = path.join(aliasPath, 'lib', relative);
            } else {
                const aliasPath = await this.resolveAliasPath(config.aliases.utils);
                resolved = path.join(path.dirname(aliasPath), relative);
            }
        } else {
            resolved = path.join(this.cwd, registryPath);
        }

        await this.assertSafePath(resolved);
        return resolved;
    }

    async resolveComponentsDir(): Promise<string> {
        if (this._componentsDirCache) return this._componentsDirCache;
        const config = this.requireConfig();
        const resolved = await this.resolveAliasPath(config.aliases.components);
        this._componentsDirCache = resolved;
        return resolved;
    }

    async resolveComponentDir(componentName: string): Promise<string> {
        const componentsDir = await this.resolveComponentsDir();
        const target = path.join(componentsDir, componentName);
        await this.assertSafePath(target);
        return target;
    }

    async resolveUtilsFilePath(): Promise<string> {
        if (this._utilsFilePathCache) return this._utilsFilePathCache;
        const config = this.requireConfig();
        let resolved: string;
        if (config.sharedBase) {
            resolved = path.join(await this.resolveAliasPath(config.sharedBase), 'utils.ts');
        } else {
            const resolvedAlias = await this.resolveAliasPath(config.aliases.utils);
            resolved = resolvedAlias.endsWith('.ts') ? resolvedAlias : `${resolvedAlias}.ts`;
        }
        await this.assertSafePath(resolved);
        this._utilsFilePathCache = resolved;
        return resolved;
    }

    async resolveStyleFilePath(): Promise<string> {
        if (this._config?.tailwind?.css) {
            const configured = path.join(this.cwd, this._config.tailwind.css);
            await this.assertSafePath(configured);
            return configured;
        }
        const locations = CSS_LOCATIONS[this.env.projectType];
        for (const loc of locations) {
            const fullPath = path.join(this.cwd, loc);
            if (await this.fs.pathExists(fullPath)) {
                return fullPath;
            }
        }
        return path.join(this.cwd, locations[0] ?? 'src/index.css');
    }

    async resolveAliasPath(alias: string): Promise<string> {
        const match = alias.match(/^(@[^/]*|~)\/(.*)/);
        let resolvedPath: string;

        if (!match) {
            resolvedPath = path.join(this.cwd, alias);
        } else {
            const [, aliasPrefix, relativePath] = match;
            const resolvedFromConfig = await this.resolveFromTsConfig(aliasPrefix, relativePath);
            resolvedPath = resolvedFromConfig ?? await this.resolveByProjectType(relativePath);
        }

        await this.assertSafePath(resolvedPath);
        return resolvedPath;
    }

    private async resolveFromTsConfig(aliasPrefix: string, relativePath: string): Promise<string | null> {
        const paths = this.tsConfig?.compilerOptions?.paths;
        if (!paths) return null;

        const aliasPattern = `${aliasPrefix}/*`;
        const baseUrl = this.tsConfig?.compilerOptions?.baseUrl || '.';
        const baseDir = path.isAbsolute(baseUrl) ? baseUrl : path.join(this.cwd, baseUrl);

        if (paths[aliasPattern]) {
            const targets = paths[aliasPattern];
            for (const targetPath of targets) {
                const resolvedBase = targetPath.replace('/*', '');
                const candidate = path.join(baseDir, resolvedBase, relativePath);
                if (await this.fs.pathExists(candidate)) {
                    return candidate;
                }
            }
            const firstBase = targets[0].replace('/*', '');
            return path.join(baseDir, firstBase, relativePath);
        }

        return null;
    }

    private async resolveByProjectType(relativePath: string): Promise<string> {
        const projectTypeToBase: Record<ProjectType, string> = {
            'vite-vue-src': 'src',
            'vite-vue': '',
            nuxt: '',
            unknown: (await this.fs.pathExists(path.join(this.cwd, 'src'))) ? 'src' : '',
        };
        const base = projectTypeToBase[this.env.projectType];
        return path.join(this.cwd, base, relativePath);
    }

    resolveImportAlias(content: string): string {
        const config = this.requireConfig();
        const sharedBase = config.sharedBase;
        const composablesAlias = config.aliases.composables ?? config.aliases.utils.replace(/\/utils$/, '/composables');
        const localesAlias = `${path.dirname(composablesAlias)}/locales`;
        const directivesAlias = `${path.dirname(composablesAlias)}/directives`;
        const libAlias = path.dirname(config.aliases.utils);
        const scriptBlocks = ProjectContext.extractScriptBlocks(content);

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
            } catch { /* ignore parse failures */ }
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

    toRelativePosixPath(absolutePath: string): string {
        return path.relative(this.cwd, absolutePath).replace(/\\/g, '/');
    }

    async assertSafePath(targetPath: string): Promise<void> {
        return assertSafePath(targetPath, this.cwd, this.fs);
    }

    async isSafePath(targetPath: string): Promise<boolean> {
        return isSafePath(targetPath, this.cwd, this.fs);
    }

    createTransaction(): FileTransaction {
        return new FileTransaction(this.fs, this.cwd);
    }

    // Static Helpers
    static extractScriptBlocks(content: string): Array<{ start: number; end: number; code: string }> {
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

    static async detectProjectType(cwd: string, fsAdapter: FileSystemAdapter): Promise<ProjectType> {
        for (const file of CONFIG_FILES.nuxt) {
            if (await fsAdapter.pathExists(path.join(cwd, file))) return 'nuxt';
        }
        const pkgPath = path.join(cwd, 'package.json');
        if (await fsAdapter.pathExists(pkgPath)) {
            try {
                const pkg = await fsAdapter.readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(pkgPath);
                const hasVue = Boolean(pkg.dependencies?.['vue'] || pkg.devDependencies?.['vue'] || pkg.dependencies?.['nuxt'] || pkg.devDependencies?.['nuxt']);
                if (hasVue) {
                    const hasSrc = await fsAdapter.pathExists(path.join(cwd, 'src'));
                    return hasSrc ? 'vite-vue-src' : 'vite-vue';
                }
            } catch { /* ignore malformed package.json */ }
        }
        return 'unknown';
    }

    static async detectPackageManager(cwd: string, fsAdapter: FileSystemAdapter): Promise<PackageManager> {
        const { lockfiles } = CONFIG_FILES;
        let current = path.resolve(cwd);
        const root = path.parse(current).root;

        while (current !== root) {
            if (await fsAdapter.pathExists(path.join(current, lockfiles.pnpm))) return 'pnpm';
            if (await fsAdapter.pathExists(path.join(current, lockfiles.yarn))) return 'yarn';
            if (await fsAdapter.pathExists(path.join(current, lockfiles.bun))) return 'bun';

            const parent = path.dirname(current);
            if (parent === current) break;
            current = parent;
        }

        return 'npm';
    }

    static async detectWorkspaceRoot(cwd: string, fsAdapter: FileSystemAdapter): Promise<string | null> {
        let current = path.resolve(cwd);
        const root = path.parse(current).root;

        while (current !== root) {
            if (await fsAdapter.pathExists(path.join(current, 'pnpm-workspace.yaml'))) return current;
            if (await fsAdapter.pathExists(path.join(current, 'lerna.json'))) return current;
            if (await fsAdapter.pathExists(path.join(current, 'turbo.json'))) return current;

            const pkgPath = path.join(current, 'package.json');
            if (await fsAdapter.pathExists(pkgPath)) {
                try {
                    const pkg = await fsAdapter.readJson<Record<string, unknown>>(pkgPath);
                    if (pkg.workspaces) return current;
                } catch { /* ignore malformed package.json */ }
            }

            const parent = path.dirname(current);
            if (parent === current) break;
            current = parent;
        }

        return null;
    }

    static async readTsConfig(cwd: string, fsAdapter: FileSystemAdapter): Promise<TsConfig | null> {
        for (const configFile of CONFIG_FILES.tsconfig) {
            const configPath = path.join(cwd, configFile);
            if (await fsAdapter.pathExists(configPath)) {
                const parsed = await ProjectContext.readTsConfigFile(configPath, new Set<string>(), fsAdapter);
                if (parsed) return parsed;
            }
        }
        return null;
    }

    private static async readTsConfigFile(
        configPath: string,
        visited: Set<string>,
        fsAdapter: FileSystemAdapter
    ): Promise<TsConfig | null> {
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
        const extendsList = typeof extendsValue === 'string' ? [extendsValue] : (Array.isArray(extendsValue) ? extendsValue : undefined);

        if (extendsList) {
            for (const extend of extendsList) {
                const extendPath = await ProjectContext.resolveTsConfigExtendsPath(extend, path.dirname(configPath), fsAdapter);
                if (!extendPath) continue;
                const base = await ProjectContext.readTsConfigFile(extendPath, visited, fsAdapter);
                if (base?.compilerOptions) {
                    Object.assign(mergedOptions, base.compilerOptions);
                }
            }
        }

        Object.assign(mergedOptions, parsed.compilerOptions);
        return { compilerOptions: mergedOptions };
    }

    private static async resolveTsConfigExtendsPath(
        extend: string,
        baseDir: string,
        fsAdapter: FileSystemAdapter
    ): Promise<string | null> {
        const candidates: string[] = [];
        if (path.isAbsolute(extend)) {
            candidates.push(extend);
        } else if (extend.startsWith('.')) {
            candidates.push(path.resolve(baseDir, extend));
        } else {
            // 先尝试在 VFS 的 node_modules 查找
            const vfsCandidate = path.join(baseDir, 'node_modules', extend);
            candidates.push(vfsCandidate);

            try {
                const requireFromBase = createRequire(path.join(baseDir, 'package.json'));
                candidates.push(requireFromBase.resolve(extend));
            } catch {
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
}
