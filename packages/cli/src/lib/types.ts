import type { RegistryFile, RegistryItem } from 'brutx-shared-vue';

export type ProjectType =
    | 'vite-vue'
    | 'vite-vue-src'
    | 'nuxt'
    | 'unknown';

export type PackageManager = 'pnpm' | 'yarn' | 'bun' | 'npm';

export interface TsConfig {
    compilerOptions?: {
        baseUrl?: string;
        paths?: Record<string, string[]>;
    };
}

export interface AliasConfig {
    components: string;
    utils: string;
    composables: string;
}

export interface TailwindConfig {
    config: string;
    css: string;
}

export interface BrutalistConfig {
    $schema?: string;
    $version?: number;
    style: string;
    tailwind: TailwindConfig;
    aliases: AliasConfig;
}

export interface InitOptions {
    yes?: boolean;
    defaults?: boolean;
    cwd?: string;
    force?: boolean;
    silent?: boolean;
    vscode?: boolean;
    workspaceRoot?: string;
}

export type CreateTemplate = 'default' | 'nuxt';

export interface CreateOptions {
    template?: CreateTemplate;
    packageManager?: PackageManager;
    cwd?: string;
    yes?: boolean;
}

export interface AddOptions {
    all?: boolean;
    overwrite?: boolean;
    path?: string;
    cwd?: string;
    yes?: boolean;
    silent?: boolean;
    dryRun?: boolean;
    registry?: string;
    vscode?: boolean;
}

export type { RegistryFile, RegistryItem };

export interface DoctorOptions {
    cwd?: string;
    fix?: boolean;
    json?: boolean;
    silent?: boolean;
    yes?: boolean;
    fixOnly?: string;
}

export interface DiffOptions {
    components?: string[];
    all?: boolean;
    cwd?: string;
    registry?: string;
    json?: boolean;
    silent?: boolean;
}

export interface UpdateOptions {
    components?: string[];
    all?: boolean;
    cwd?: string;
    yes?: boolean;
    silent?: boolean;
    dryRun?: boolean;
    registry?: string;
}

export interface ListOptions {
    cwd?: string;
    json?: boolean;
    silent?: boolean;
}

export interface InfoOptions {
    cwd?: string;
    json?: boolean;
    silent?: boolean;
    registry?: string;
}

export interface RemoveOptions {
    cwd?: string;
    yes?: boolean;
    silent?: boolean;
    dryRun?: boolean;
}

export interface InstalledComponentInfo {
    name: string;
    files: string[];
    fileCount: number;
    dependencies: string[];
    registryDependencies?: string[];
    registrySource?: string;
    installedIntegrity?: string;
    installedAt?: string;
    manifestFiles?: string[];
    managed?: boolean;
}

export interface BrutxManifest {
    version: 1;
    components: Record<string, InstalledComponentManifest>;
}

export interface InstalledComponentManifest {
    name: string;
    registrySource: string;
    integrity: string;
    installedAt: string;
    files: string[];
    dependencies: string[];
    registryDependencies: string[];
}

export type CheckStatus = 'pass' | 'warn' | 'error';

export enum FixId {
    AddSchema = 'add-schema',
    SetStyle = 'set-style',
    InjectCssTokens = 'inject-css-tokens',
    CreateComponentsDir = 'create-components-dir',
    CreateUtilsFile = 'create-utils-file',
    AddCnFunction = 'add-cn-function',
    AddConfigVersion = 'add-config-version',
}

export interface CheckResult {
    name: string;
    status: CheckStatus;
    message: string;
    fixId?: FixId;
    fixDescription?: string;
}

export type DiffFileStatus = 'unchanged' | 'modified' | 'added' | 'removed';

export interface FileDiff {
    path: string;
    status: DiffFileStatus;
    patch?: string;
}

export type DiffComponentStatus = 'up-to-date' | 'modified' | 'not-installed' | 'local-only';

export interface DiffResult {
    component: string;
    status: DiffComponentStatus;
    files: FileDiff[];
}
