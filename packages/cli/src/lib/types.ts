import type { RegistryItem } from 'brutx-shared-vue';

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

/**
 * 路径别名配置（components.json 的 aliases 字段，P0-1）。
 *
 * 路径语义约定：
 * - 推荐写法为 `@/` 或 `~/` 前缀别名（如默认值 '@/components'、'@/lib/utils'），
 *   由 resolveAliasPath 依据 tsconfig paths 或项目类型（src/ 根）解析；
 * - 也支持相对项目根的普通路径（如 'src/components'），此时直接相对 cwd 解析；
 * - 禁止通配符（`*`）与绝对路径（`/` 开头）：仅 tsconfig paths 的 key 侧使用 `*`，
 *   本字段为字面别名值，解析结果必须落在项目目录内，否则 resolveAliasPath 抛错。
 */
export interface AliasConfig {
    /** 组件目录别名，如 '@/components' */
    components: string;
    /** 工具函数目录别名，如 '@/lib/utils' */
    utils: string;
    /** 组合式函数目录别名，如 '@/composables' */
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

/**
 * 各命令共享的 CLI 选项基础接口（单一来源）。
 * cwd/silent/registry/cache/offline/json/dryRun 等公共字段在此声明一次，
 * 命令特有字段在各命令接口中声明并 extends 本接口，避免逐命令重复导致漂移。
 */
export interface BaseCommandOptions {
    /** 工作目录，默认 process.cwd() */
    cwd?: string;
    /** 静默模式：抑制输出与交互提示 */
    silent?: boolean;
    /** registry 源覆盖（HTTP URL 或本地目录路径） */
    registry?: string;
    /** 是否使用缓存（默认 true；false 时强制直连 registry） */
    cache?: boolean;
    /** 离线模式：只读缓存、禁止网络请求 */
    offline?: boolean;
    /** JSON 结构化输出 */
    json?: boolean;
    /** 演练模式：模拟执行但不实际写入磁盘 */
    dryRun?: boolean;
}

export interface AddOptions extends BaseCommandOptions {
    all?: boolean;
    overwrite?: boolean;
    path?: string;
    yes?: boolean;
    vscode?: boolean;
}

export type { RegistryItem };

export interface DoctorOptions extends BaseCommandOptions {
    fix?: boolean;
    yes?: boolean;
    fixOnly?: string;
    /** 生成用户项目 SBOM（CycloneDX 格式）后退出，不运行常规检查 */
    sbom?: boolean;
    /** SBOM 输出文件路径，默认 ./brutx-sbom.json */
    sbomOutput?: string;
}

export interface DiffOptions extends BaseCommandOptions {
    components?: string[];
    all?: boolean;
}

export interface UpdateOptions extends BaseCommandOptions {
    components?: string[];
    all?: boolean;
    yes?: boolean;
    acrossVersions?: boolean;
}

export interface ListOptions extends BaseCommandOptions {
    checkUpdates?: boolean;
}

/** info 命令选项：无特有字段，直接复用公共选项 */
export type InfoOptions = BaseCommandOptions;

export interface RemoveOptions extends BaseCommandOptions {
    yes?: boolean;
}

/**
 * 从 InstalledComponentManifest（单一事实来源）派生的、Info 消费的字段子集。
 * 本地手工组件可能无 manifest 记录，故共享字段在 Info 中一律可选（Partial 化）；
 * 新增 Manifest 字段且 Info 需要消费时，扩展本 Pick 而非在 Info 中重复声明，
 * 避免两处并行结构字段漂移（字段名与必填性以 Manifest 为准）。
 */
type ManifestInfoFields = Pick<
    InstalledComponentManifest,
    | 'registrySource'
    | 'integrity'
    | 'installedAt'
    | 'category'
    | 'examples'
    | 'status'
    | 'replacement'
    | 'registryDependencies'
    | 'version'
>;

export interface InstalledComponentInfo extends Partial<ManifestInfoFields> {
    name: string;
    files: string[];
    dependencies: string[];
    latestIntegrity?: string;
    updateAvailable?: boolean;
    updateCheckError?: string;
    manifestFiles?: string[];
    managed?: boolean;
}

/**
 * 当前受支持的 .brutx/manifest.json 版本。
 * 新增版本时同步扩展 ManifestVersion 联合，并在 manifest.ts 解析层实现对应迁移/校验。
 */
export const MANIFEST_VERSION = 1 as const;

/** 受支持的 manifest 版本（字面量联合，随 MANIFEST_VERSION 演进）。 */
export type ManifestVersion = typeof MANIFEST_VERSION;

export interface BrutxManifest {
    version: ManifestVersion;
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
 * integrity 为必填契约：manifest 自身完整性哈希（v2.2 补强），
 * CLI 拉取后必须先校验，缺失即视为无效 manifest（解析层降级为不信任）。
 */
export interface RegistryManifestSummary {
    registryVersion: string;
    integrity: string;
}
