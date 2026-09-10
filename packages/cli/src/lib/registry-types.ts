import type { FileSystemAdapter } from 'brutx-shared-vue/fs';
import type { RegistryItem } from 'brutx-shared-vue';
import type { CacheStorage } from './storage/cache-storage.js';
import type { RegistrySourceTracker } from './resilience/source-tracker.js';
import type { TrustedPublicKey } from './types.js';

export type HttpFetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface RegistryClientOptions {
    /** 注册表源列表（URL 或本地目录绝对路径，按优先级排列） */
    readonly sources?: readonly string[];
    /** 是否强制要求 Ed25519 签名验证（严格模式下验签失败抛错） */
    readonly requireSignature?: boolean;
    /** 受信任公钥列表（覆盖默认官方公钥与环境变量） */
    readonly trustedPublicKeys?: readonly TrustedPublicKey[];
    /** 是否处于离线模式（仅读取缓存与本地源，不发起网络请求） */
    readonly offline?: boolean;
    /** 是否启用缓存（设为 false 时绕过读取并跳过写入） */
    readonly useCache?: boolean;
    /** 缓存存储适配器（支持注入内存或自定义缓存实现） */
    readonly cacheStorage?: CacheStorage;
    /** 文件系统适配器（用于本地注册表与缓存 IO） */
    readonly fsAdapter?: FileSystemAdapter;
    /** HTTP 请求适配器（实现网络层 Ports & Adapters，注入后可实现 100% 纯内存沙箱测试） */
    readonly httpFetcher?: HttpFetcher;
    /** 多源自适应竞速追踪器（用于网络健康度记忆） */
    readonly tracker?: RegistrySourceTracker;
}

export interface ResolvedComponentPlan {
    readonly items: readonly RegistryItem[];
    readonly hitSources: ReadonlyMap<string, string>;
    readonly npmDependencies: readonly string[];
    readonly npmDevDependencies: readonly string[];
    readonly registryDependencies: readonly string[];
}

export interface FetchItemOptions {
    /** 可选指定覆盖源（如未指定则按 client 配置的多源阶梯竞速拉取） */
    readonly sourceOverride?: string;
    /** 请求级 AbortSignal */
    readonly signal?: AbortSignal;
    /** 请求级覆盖是否使用缓存（缺省沿用客户端全局配置） */
    readonly useCache?: boolean;
}

export interface ListComponentsOptions {
    /** 可选指定枚举的目标源（若未指定则使用 client 配置的主源） */
    readonly source?: string;
    /** 请求级 AbortSignal */
    readonly signal?: AbortSignal;
}

export const REGISTRY_ERROR_CODES = [
    'REGISTRY_FETCH_FAILED',
    'COMPONENT_NOT_FOUND',
    'REGISTRY_INTEGRITY_FAILED',
    'REGISTRY_SIGNATURE_INVALID',
    'PATH_UNSAFE',
    'REGISTRY_OFFLINE_UNAVAILABLE',
    'REGISTRY_VERSION_UNSUPPORTED',
    'INVALID_REGISTRY',
    'REGISTRY_LIST_UNSUPPORTED',
] as const;

export type RegistryErrorCode = (typeof REGISTRY_ERROR_CODES)[number];
