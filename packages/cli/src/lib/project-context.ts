import path from 'path';
import { createRequire } from 'module';
import { parse as parseJsonc } from 'jsonc-parser';
import { DiskFileSystemAdapter, type FileSystemAdapter } from 'brutx-shared-vue/fs';
import { SfcAstEngine } from 'brutx-shared-vue/ast';
import type {
    AliasConfig,
    BrutalistConfig,
    PackageManager,
    ProjectType,
    TsConfig,
} from './types.js';
import { AuditLogStorage } from './storage/audit-storage.js';
import {
    CONFIG_FILES,
    CSS_LOCATIONS,
    REGISTRY_PATH_PREFIXES,
} from './constants.js';
import { CliError } from './error.js';
import { isSafePath } from './security.js';
import { FileTransaction } from './file-transaction.js';

import { RegistryClient } from './registry-client.js';
import type { RegistryClientOptions } from './registry-types.js';

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
    registryClient?: RegistryClient;
}

interface RawTsConfig extends TsConfig {
    extends?: string | string[];
}

export class ProjectContext {
    readonly cwd: string;
    readonly fs: FileSystemAdapter;
    readonly env: ProjectEnvironmentInfo;
    readonly tsConfig: TsConfig | null;
    readonly auditLog: AuditLogStorage;

    private _config?: BrutalistConfig;
    private _registryClient?: RegistryClient;
    private _aliasesCache?: AliasConfig;
    private _componentsDirCache?: string;
    private _utilsFilePathCache?: string;

    private constructor(
        cwd: string,
        fsAdapter: FileSystemAdapter,
        env: ProjectEnvironmentInfo,
        tsConfig: TsConfig | null,
        config?: BrutalistConfig,
        registryClient?: RegistryClient,
    ) {
        this.cwd = path.resolve(cwd);
        this.fs = fsAdapter;
        this.env = env;
        this.tsConfig = tsConfig;
        this._config = config;
        this._registryClient = registryClient;
        this.auditLog = new AuditLogStorage({ fs: fsAdapter, cwd: this.cwd });
    }

    get registry(): RegistryClient {
        return this.getRegistryClient();
    }

    public getRegistryClient(overrides?: Partial<RegistryClientOptions>): RegistryClient {
        if (!this._registryClient || overrides) {
            const client = new RegistryClient({
                sources: this._config?.registries,
                requireSignature: this._config?.requireSignature,
                trustedPublicKeys: this._config?.trustedPublicKeys,
                fsAdapter: this.fs,
                ...overrides,
            });
            if (!overrides) {
                this._registryClient = client;
            }
            return client;
        }
        return this._registryClient;
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
                    if (!options.optionalConfig) {
                        throw new CliError(`Failed to parse components.json in "${resolvedCwd}": ${error instanceof Error ? error.message : String(error)}`, {
                            code: 'CONFIG_INVALID',
                            exitCode: 1,
                        });
                    }
                    config = undefined;
                }
            }
        }

        return new ProjectContext(resolvedCwd, fsAdapter, env, tsConfig, config, options.registryClient);
    }

    bindConfig(config: BrutalistConfig): void {
        this._config = config;
        this.clearDerivedCaches();
    }

    private clearDerivedCaches(): void {
        this._registryClient = undefined;
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

    async assertSafePath(targetPath: string, rootDir: string = this.cwd): Promise<void> {
        const isSafe = await isSafePath(targetPath, rootDir, this.fs);
        if (!isSafe) {
            const scopeLabel = rootDir === this.cwd ? 'project' : 'components';
            throw new CliError(`Security Error: Resolved path "${targetPath}" is outside the ${scopeLabel} directory.`, {
                code: 'PATH_UNSAFE',
                exitCode: 2,
            });
        }
    }

    async resolveComponentsDir(): Promise<string> {
        return this.resolveAliasPath(this.requireConfig().aliases.components);
    }

    async resolveComponentDir(componentName: string): Promise<string> {
        const componentsDir = await this.resolveComponentsDir();
        const target = path.resolve(componentsDir, componentName);
        await this.assertSafePath(target, componentsDir);

        const uiTarget = path.resolve(componentsDir, 'ui', componentName);
        if (await this.fs.pathExists(uiTarget)) {
            await this.assertSafePath(uiTarget, componentsDir);
            return uiTarget;
        }

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

    toRelativePosixPath(absolutePath: string): string {
        return path.relative(this.cwd, absolutePath).replace(/\\/g, '/');
    }

    async isSafePath(targetPath: string): Promise<boolean> {
        return isSafePath(targetPath, this.cwd, this.fs);
    }

    createTransaction(): FileTransaction {
        return new FileTransaction(this.fs, this.cwd);
    }

    // Static Helpers
    static extractScriptBlocks(content: string): Array<{ start: number; end: number; code: string }> {
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
