import type { RegistryFile, RegistryItem } from 'brutx-shared-vue';

export type ProjectType =
    | 'vite-vue'
    | 'vite-vue-src'
    | 'nuxt'
    | 'unknown';

export type PackageManager = 'pnpm' | 'yarn' | 'bun' | 'npm';

/**
 * 受信任的 manifest 签名公钥（P1-6 信任链）。
 * publicKey 为 base64 编码的 SPKI DER 格式 Ed25519 公钥。
 * status 用于标识密钥生命周期，便于轮换与撤销审计。
 */
export interface TrustedPublicKey {
    keyId: string;
    /** base64 编码的 SPKI DER 格式公钥 */
    publicKey: string;
    /** 密钥状态：active / rotated / revoked */
    status?: 'active' | 'rotated' | 'revoked';
    /** 备注（来源、用途等） */
    note?: string;
}

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
    sharedBase?: string;
    /**
     * 多 registry 源（P1-5）：主源 + 镜像列表，CLI 按序 fallback。
     * 未配置时回退到 DEFAULT_REGISTRY_SOURCES。
     * 命令行 --registry 临时覆盖整个列表。
     */
    registries?: string[];
    /**
     * 严格签名模式（基础设施闭环 P1）：为 true 时强制 manifest 签名校验。
     * 优先级低于 BRUTX_REQUIRE_SIGNATURE 环境变量与 --require-signature flag，
     * 用于团队在项目中声明强制验签，旧版本 components.json 缺省时静默兼容。
     */
    requireSignature?: boolean;
    /**
     * 项目级追加信任公钥（基础设施闭环 P1）：在官方 Root 公钥之外追加信任。
     * 未配置时回退到 BRUTX_REGISTRY_PUBLIC_KEYS 环境变量，再回退到官方内置公钥。
     */
    trustedPublicKeys?: TrustedPublicKey[];
}

/**
 * 解析后的 registry 源描述（P1-5）。
 * 用于 doctor 健康检查与日志输出。
 */
export interface RegistrySourceStatus {
    url: string;
    reachable: boolean;
    latencyMs?: number;
    error?: string;
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
    cache?: boolean;
    offline?: boolean;
}

export type { RegistryFile, RegistryItem };

export interface DoctorOptions {
    cwd?: string;
    fix?: boolean;
    json?: boolean;
    silent?: boolean;
    yes?: boolean;
    fixOnly?: string;
    offline?: boolean;
    /** 生成用户项目 SBOM（CycloneDX 格式）后退出，不运行常规检查 */
    sbom?: boolean;
    /** SBOM 输出文件路径，默认 ./brutx-sbom.json */
    sbomOutput?: string;
}

export interface DiffOptions {
    components?: string[];
    all?: boolean;
    cwd?: string;
    registry?: string;
    json?: boolean;
    silent?: boolean;
    cache?: boolean;
    offline?: boolean;
}

export interface UpdateOptions {
    components?: string[];
    all?: boolean;
    cwd?: string;
    yes?: boolean;
    silent?: boolean;
    dryRun?: boolean;
    registry?: string;
    cache?: boolean;
    acrossVersions?: boolean;
    offline?: boolean;
}

export interface ListOptions {
    cwd?: string;
    json?: boolean;
    silent?: boolean;
    registry?: string;
    checkUpdates?: boolean;
    cache?: boolean;
    offline?: boolean;
}

export interface InfoOptions {
    cwd?: string;
    json?: boolean;
    silent?: boolean;
    registry?: string;
    offline?: boolean;
}

export interface RemoveOptions {
    cwd?: string;
    yes?: boolean;
    silent?: boolean;
    dryRun?: boolean;
    cache?: boolean;
}

export interface InstalledComponentInfo {
    name: string;
    files: string[];
    fileCount: number;
    dependencies: string[];
    category?: RegistryItem['category'];
    examples?: string[];
    status?: RegistryItem['status'];
    replacement?: string;
    registryDependencies?: string[];
    registrySource?: string;
    installedIntegrity?: string;
    latestIntegrity?: string;
    updateAvailable?: boolean;
    updateCheckError?: string;
    installedAt?: string;
    manifestFiles?: string[];
    managed?: boolean;
    version?: string;
}

export interface BrutxManifest {
    version: 1;
    components: Record<string, InstalledComponentManifest>;
}

export interface InstalledComponentManifest {
    name: string;
    registrySource: string;
    integrity: string;
    installedContentHash?: string;
    version?: string;
    installedAt: string;
    files: string[];
    dependencies: string[];
    registryDependencies: string[];
    category?: RegistryItem['category'];
    examples: string[];
    status?: RegistryItem['status'];
    replacement?: string;
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
    RestoreIntegrity = 'restore-integrity',
    RemoveOrphans = 'remove-orphans',
}

export interface CheckResult {
    name: string;
    status: CheckStatus;
    message: string;
    fixId?: FixId;
    fixDescription?: string;
    componentName?: string;
}

export type DiffFileStatus = 'unchanged' | 'modified' | 'added' | 'removed';

export interface FileDiff {
    path: string;
    status: DiffFileStatus;
    patch?: string;
}

export type DiffComponentStatus = 'up-to-date' | 'modified' | 'not-installed' | 'local-only' | 'registry-unreachable';
export type DiffIntegrityStatus = 'unknown' | 'current' | 'outdated';

export interface DiffResult {
    component: string;
    status: DiffComponentStatus;
    files: FileDiff[];
    installedIntegrity?: string;
    latestIntegrity?: string;
    integrityStatus?: DiffIntegrityStatus;
    registrySource?: string;
    installedAt?: string;
    registryError?: string;
}

/**
 * registry-manifest.json 的摘要（CLI 侧消费的字段子集）。
 * 用于缓存版本绑定：registry 版本变化时旧缓存条目自动跳过。
 * integrity 字段为 manifest 自身完整性哈希（v2.2 补强），CLI 拉取后必须先校验。
 */
export interface RegistryManifestSummary {
    registryVersion: string;
    integrity?: string;
}
