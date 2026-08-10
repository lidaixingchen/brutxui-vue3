import fs from 'fs-extra';
import path from 'path';
import {
    RegistryIntegrityMismatchError,
    validateRegistryItem,
} from 'brutx-shared-vue';
import type { RegistryItem, BrutalistConfig, RegistryManifestSummary, TrustedPublicKey } from './types.js';
import {
    DEFAULT_REGISTRY_URL,
    DEFAULT_REGISTRY_SOURCES,
    SCHEMA_URL,
    DEFAULT_ALIASES,
    DEFAULT_TAILWIND_CONFIG,
    CURRENT_CONFIG_VERSION,
} from './constants.js';
import { CliError } from './error.js';
import { getCachedEntry, setCachedEntry, touchCachedEntry, dedupeInflight, isOfflineMode } from './cache.js';
import { buildAuthHeaders, fetchWithSources } from './registry-source.js';
import { logger } from './logger.js';
import { verifyManifestIntegrityAndSignature, setTrustedPublicKeys } from './signature.js';
import { applyRequireSignatureConfig, isRequireSignature } from './signature-mode.js';

function isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
}

/**
 * GitHub raw URL 完整结构：raw.githubusercontent.com/{owner}/{repo}/{ref}/...
 * 在 resolveVersionedSource 与嵌套依赖版本解析处共享，避免前缀/完整结构两处模式漂移。
 */
const GITHUB_RAW_URL_PATTERN = /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)$/;

/**
 * 进程级 registry-manifest 缓存：首次 getItem 时按需拉取一次，
 * 避免每条目多一次请求。key 为 registry source URL。
 */
const registryManifestCache = new Map<string, ManifestSummaryInternal | null>();

/**
 * 拉取的 manifest 摘要（进程级缓存）。在 RegistryManifestSummary 基础上扩展
 * itemIntegrities：#120 交叉校验所需——manifest.items 中声明的各组件 integrity 映射
 * （manifest 内容已由完整性复算 + 签名校验背书，可用作 item 校验的信任锚）。
 */
interface ManifestSummaryInternal extends RegistryManifestSummary {
    itemIntegrities?: Record<string, string>;
}

/**
 * 拉取 registry-manifest.json 获取 registryVersion 与 integrity。
 * 拉取失败时返回 null——缓存版本绑定降级为"不校验版本"，由 integrity 兜底。
 *
 * P1-6：若 manifest 含 signature/keyId 字段且 BRUTX_REGISTRY_PUBLIC_KEYS 已配置，
 * 在此触发签名验证。严格模式下 REGISTRY_SIGNATURE_INVALID 必须冒泡（不降级为 null）。
 * 默认模式下签名失败仅 warn（signature.ts 的迁移期设计），integrity 复算仍兜底防篡改。
 */
async function fetchRegistryManifestSummary(source: string): Promise<ManifestSummaryInternal | null> {
    const cached = registryManifestCache.get(source);
    if (cached !== undefined) return cached;

    const manifestUrl = `${source}/registry-manifest.json`;
    try {
        const res = await fetchWithRetry(manifestUrl, 3, buildAuthHeaders(source));
        if (!res.ok) {
            registryManifestCache.set(source, null);
            return null;
        }
        const manifest = await res.json() as {
            name?: unknown;
            schemaVersion?: unknown;
            registryVersion?: string;
            items?: unknown;
            integrity?: string;
            signature?: string;
            keyId?: string;
        };
        if (typeof manifest.registryVersion !== 'string' || manifest.registryVersion.length === 0) {
            registryManifestCache.set(source, null);
            return null;
        }
        // #109：integrity 为必填契约。manifest 缺失/类型错误的 integrity 与 registryVersion
        // 缺失同构处理——降级为"不信任该 manifest"（返回 null），不再产出无 integrity 的摘要。
        if (typeof manifest.integrity !== 'string' || manifest.integrity.length === 0) {
            logger.warn(`Registry manifest from "${source}" is missing the integrity field, manifest not trusted (version binding skipped).`);
            registryManifestCache.set(source, null);
            return null;
        }
        // 基础设施闭环 P1：完整性复算 + 签名校验。严格模式下签名失败抛
        // REGISTRY_SIGNATURE_INVALID，由 catch 块特判冒泡——签名失败绝不降级为 null
        // （否则篡改的 manifest 会静默通过）。
        // #116：返回值检查为 P1-6 兜底——即使验签函数未来改为"返回 false 而非抛错"，
        // 严格模式下签名失败仍必须冒泡，不能被忽略后继续使用 manifest。
        const signatureValid = verifyManifestIntegrityAndSignature(manifest);
        if (!signatureValid && isRequireSignature()) {
            throw new CliError(
                'Manifest signature verification failed. The manifest may have been tampered with.',
                { code: 'REGISTRY_SIGNATURE_INVALID' }
            );
        }

        // #120：提取 manifest.items 中声明的各组件 integrity，供 item 与签名 manifest 交叉校验。
        // 仅收录字符串 integrity 的条目；manifest 无 items/条目缺 integrity 时跳过对应组件
        // （不误伤未收录该组件的兼容性 registry）。
        const itemIntegrities: Record<string, string> = {};
        if (typeof manifest.items === 'object' && manifest.items !== null && !Array.isArray(manifest.items)) {
            for (const [itemName, entry] of Object.entries(manifest.items as Record<string, unknown>)) {
                const integrity = (entry as { integrity?: unknown } | null)?.integrity;
                if (typeof integrity === 'string' && integrity.length > 0) {
                    itemIntegrities[itemName] = integrity;
                } else {
                    // #120：条目存在但 integrity 缺失/类型非法时不能静默丢弃——否则该组件
                    // 的交叉校验会在无告警的情况下失效，warn 提示声明格式非法
                    logger.warn(
                        `Registry manifest declares component "${itemName}" with a missing or invalid integrity value, ` +
                        `cross-check for this component is skipped.`
                    );
                }
            }
        }

        const summary: ManifestSummaryInternal = {
            registryVersion: manifest.registryVersion,
            // #109：解析层已保证 integrity 为字符串（非字符串时提前降级 null），此处可直接赋值
            integrity: manifest.integrity,
            itemIntegrities: Object.keys(itemIntegrities).length > 0 ? itemIntegrities : undefined,
        };
        registryManifestCache.set(source, summary);
        return summary;
    } catch (error) {
        // 签名失败必须冒泡（严格模式）——降级为 null 会让篡改的 manifest 静默通过
        if (error instanceof CliError && error.code === 'REGISTRY_SIGNATURE_INVALID') {
            throw error;
        }
        // #116：区分异常来源，签名校验不再被静默关闭。
        // 网络/解析失败（REGISTRY_FETCH_FAILED）为设计内降级，debug 记录供排障；
        // 其余异常（未来新增错误码、验签侧运行时异常）意味着签名校验可能被静默关闭，必须 warn。
        if (error instanceof CliError && error.code === 'REGISTRY_FETCH_FAILED') {
            logger.debug(`Registry manifest fetch failed for "${source}", version binding skipped: ${error.message}`);
        } else {
            logger.warn(`Registry manifest verification failed for "${source}": ${error instanceof Error ? error.message : String(error)}`);
        }
        registryManifestCache.set(source, null);
        return null;
    }
}

async function fetchWithRetry(url: string, maxRetries: number = 3, headers?: Record<string, string>): Promise<Response> {
    const delays = [1000, 2000, 4000];
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        let res: Response;
        try {
            res = await fetch(url, {
                headers,
                signal: AbortSignal.timeout(30000),
            });
        } catch (error: unknown) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const isRetryable = lastError.name === 'TimeoutError' ||
                lastError.name === 'AbortError' ||
                lastError instanceof TypeError;

            if (!isRetryable || attempt >= maxRetries) break;

            process.stderr.write(`Network timeout, retrying (attempt ${attempt + 1}/${maxRetries})...\n`);
            await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]));
            continue;
        }

        // #119：HTTP 5xx 是瞬时服务端错误，与网络异常一样按退避重试；
        // 状态码记入 lastError——重试耗尽时统一抛错仍能透出最终失败信息
        if (res.status >= 500) {
            lastError = new Error(`HTTP ${res.status} ${res.statusText}`);
            if (attempt >= maxRetries) break;

            process.stderr.write(`Server error (HTTP ${res.status}), retrying (attempt ${attempt + 1}/${maxRetries})...\n`);
            await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]));
            continue;
        }

        return res;
    }

    throw new CliError(
        `Failed to fetch from "${url}" after ${maxRetries} attempts. ` +
        `Please check your network connection or use --registry to specify a different source.\n` +
        `Last error: ${lastError?.message ?? 'Unknown error'}`,
        { code: 'REGISTRY_FETCH_FAILED', cause: lastError }
    );
}

/**
 * 结构校验 + integrity 内容自校验（validateRegistryItem 现会校验 integrity 与 files 内容匹配）。
 * 内容不匹配是安全事件，统一归类为 REGISTRY_INTEGRITY_FAILED（而非普通数据错误）。
 */
function validateItemWithIntegrity(data: unknown, name: string): asserts data is RegistryItem {
    try {
        validateRegistryItem(data, { name });
    } catch (error) {
        if (error instanceof RegistryIntegrityMismatchError) {
            throw new CliError(
                `Integrity check failed for component '${name}'. The registry content may have been tampered with.`,
                { code: 'REGISTRY_INTEGRITY_FAILED', cause: error }
            );
        }
        throw error;
    }
}

/**
 * #120：item 与已签名 manifest 的交叉校验。
 *
 * verifyRegistryIntegrity 只保证 item 内部"files ↔ integrity 自洽"——攻击者同时改写
 * 两者即可保持自洽通过校验（manifest 签名在默认模式下又仅 warn 不拦截）。
 * 此处将 item.integrity 与 manifest.items 中声明的 integrity（manifest 内容已通过
 * 完整性复算 + 签名校验背书）比对，封堵该绕过路径。
 * manifest 未收录该 item（items 缺失/不完整/组件未声明）时跳过，避免误伤兼容性 registry。
 */
function verifyManifestItemIntegrity(item: RegistryItem, name: string, summary: ManifestSummaryInternal | null): void {
    const declared = summary?.itemIntegrities?.[name];
    if (declared === undefined || declared === item.integrity) return;
    throw new CliError(
        `Integrity check failed for component '${name}': its integrity does not match the signed registry manifest. The registry content may have been tampered with.`,
        { code: 'REGISTRY_INTEGRITY_FAILED' }
    );
}

export async function getItem(name: string, source: string = DEFAULT_REGISTRY_URL, useCache: boolean = true): Promise<RegistryItem> {
    if (isUrl(source)) {
        const effectiveUseCache = useCache && process.env.BRUTX_NO_CACHE !== '1';

        if (effectiveUseCache) {
            return dedupeInflight(name, source, async () => {
                return await fetchItemWithConditionalRequest(name, source);
            }) as Promise<RegistryItem>;
        }
        return await fetchItemWithConditionalRequest(name, source, false);
    } else {
        const sourceResolved = path.resolve(source);
        const filePath = path.resolve(source, `${name}.json`);
        // 词法前缀校验：快速拒绝明显的路径穿越（../、绝对路径等）
        if (!filePath.startsWith(sourceResolved + path.sep)) {
            throw new CliError(
                `Security Error: Path traversal detected in component name "${name}".`,
                { code: 'PATH_UNSAFE', exitCode: 2 }
            );
        }
        if (!(await fs.pathExists(filePath))) {
            throw new CliError(
                `Component "${name}" not found in local registry: ${filePath}`,
                { code: 'COMPONENT_NOT_FOUND' }
            );
        }
        // #118：词法前缀校验无法识别符号链接——本地 registry 内的 symlink 可指向目录外，
        // realpath 归一化后再做前缀校验，封堵 PATH_UNSAFE 绕过。
        let realFilePath: string;
        try {
            realFilePath = await fs.realpath(filePath);
        } catch {
            // realpath 失败（文件在 pathExists 与 realpath 之间被删除等竞态）按未找到处理
            throw new CliError(
                `Component "${name}" not found in local registry: ${filePath}`,
                { code: 'COMPONENT_NOT_FOUND' }
            );
        }
        let realSource: string;
        try {
            realSource = await fs.realpath(sourceResolved);
        } catch {
            // source 目录本身无法解析（不存在等）时按词法路径比较，后续 readJson 自会报错
            realSource = sourceResolved;
        }
        // #120：改用 path.relative 判定越界（与 remove-service 的 isInsideDirectory 同语义）——
        // startsWith 词法比较在 realSource 为文件系统根目录（如 `/`）时 realSource + path.sep
        // 为 `//`，任何路径都不以它开头，本地 registry 全部组件被误拒。relative 结果以 `..`
        // 开头（越界）或为绝对路径（跨盘）即越界；rel 为空串（realFilePath === realSource）
        // 表示路径相同即 source 目录本身而非组件文件，同样按越界拒绝。
        const relativeFilePath = path.relative(realSource, realFilePath);
        if (relativeFilePath === '' || relativeFilePath.startsWith('..') || path.isAbsolute(relativeFilePath)) {
            throw new CliError(
                `Security Error: Path traversal detected in component name "${name}".`,
                { code: 'PATH_UNSAFE', exitCode: 2 }
            );
        }
        const data = await fs.readJson(realFilePath);

        validateItemWithIntegrity(data, name);
        return data;
    }
}

/**
 * 列出本地 registry（目录路径）中的全部组件名（*.json 文件名去扩展名），按名称排序。
 * 供 `add --all --registry <local-path>` 使用：本地目录可枚举，远程 HTTP registry
 * 协议不支持列表，返回 null 由调用方决定行为（如要求显式指定组件名）。
 * 目录缺失/不可读同样返回 null。
 *
 * 过滤非组件文件（两层）：
 * - 模式过滤：index.json（shadcn 风格 registry 索引）与 `registry-*` 前缀文件
 *   （registry-manifest.json / registry-sbom.json 及未来元数据）
 * - 内容校验：读取后顶层缺少组件 name 字段的文件（与 getItem 的校验语义一致）
 */
export async function listLocalRegistryComponents(registryPath: string): Promise<string[] | null> {
    if (isUrl(registryPath)) {
        return null;
    }
    try {
        const entries = await fs.readdir(registryPath, { withFileTypes: true });
        const names: string[] = [];
        for (const entry of entries) {
            if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
            const name = entry.name.slice(0, -'.json'.length);
            if (name === 'index' || name.startsWith('registry-')) continue;
            try {
                const data = await fs.readJson(path.join(registryPath, entry.name)) as { name?: unknown };
                if (typeof data.name !== 'string' || data.name.length === 0) continue;
                names.push(name);
            } catch {
                // 读取/解析失败的文件跳过（与 getItem 的容错一致）
            }
        }
        return names.sort();
    } catch {
        return null;
    }
}

/**
 * 多源拉取（基础设施闭环 P0）：按序尝试 sources，首个成功即返回。
 * - 在线模式：某源 integrity/signature 校验失败会 fallback 下一源（CDN 冗余）；
 *   全部失败抛聚合错误，并在一致性失败时提示可能的多源延迟。
 * - 离线模式：依次尝试各源缓存，全部 miss 才抛 REGISTRY_OFFLINE_UNAVAILABLE。
 *
 * @returns 命中的组件与其实际源 URL（调用方用于 manifest 记录 registrySource）。
 */
export async function getItemFromSources(
    name: string,
    sources: string[],
    useCache: boolean = true,
): Promise<{ item: RegistryItem; source: string }> {
    const { result, source } = await fetchWithSources(
        sources,
        (sourceUrl) => getItem(name, sourceUrl, useCache),
        { offline: isOfflineMode() },
    );
    return { item: result, source };
}

/**
 * 带条件请求的 fetch：先查缓存，TTL 过期则发 If-None-Match/If-Modified-Since，
 * 304 则 touch 复用 body，200 则校验 integrity 后写入缓存。
 *
 * 离线模式（P1-5）：BRUTX_OFFLINE=1 时只读缓存，TTL 过期也复用（integrity 仍校验），
 * 缓存未命中则抛 REGISTRY_OFFLINE_UNAVAILABLE。
 */
async function fetchItemWithConditionalRequest(
    name: string,
    source: string,
    useCache: boolean = true,
): Promise<RegistryItem> {
    let cachedEntry: Awaited<ReturnType<typeof getCachedEntry<RegistryItem>>> = null;
    let currentRegistryVersion: string | undefined;
    let manifestSummary: ManifestSummaryInternal | null = null;

    // #120：信任锚（manifest）与缓存开关解耦——BRUTX_NO_CACHE=1 / useCache=false 时
    // 交叉校验不能整体跳过，否则绕过缓存同样绕过了签名背书。离线模式仍不拉 manifest
    // （manifest 也走网络），直接读缓存。fetchRegistryManifestSummary 有进程级缓存且
    // 失败降级为 null 不抛错，无性能负担；currentRegistryVersion 仅在缓存写入路径
    // （setCachedEntry 只存在于 useCache 分支内）被消费，此处在 useCache=false 时取值无害。
    if (!isOfflineMode()) {
        manifestSummary = await fetchRegistryManifestSummary(source);
        currentRegistryVersion = manifestSummary?.registryVersion;
    }

    if (useCache) {
        cachedEntry = await getCachedEntry<RegistryItem>(name, source);

        if (cachedEntry) {
            const versionMatch = !currentRegistryVersion ||
                !cachedEntry.registryVersion ||
                cachedEntry.registryVersion === currentRegistryVersion;

            // 离线模式：TTL 过期也复用（只要版本匹配）；在线模式：TTL 未过期且版本匹配才复用
            const offlineOk = isOfflineMode() && versionMatch;
            const onlineFresh = !cachedEntry.expired && versionMatch;
            if (offlineOk || onlineFresh) {
                if (offlineOk) {
                    // 离线命中显性提示（基础设施闭环 P2）：让用户感知未发起网络请求
                    logger.info(`[OFFLINE CACHE HIT] ${name} (source: ${source})`);
                }
                // #120：缓存命中早退前交叉校验——旧版本 CLI 写入的缓存条目未经交叉校验，
                // 升级后不能静默放行（manifest 未收录该组件时校验内部跳过，不会误伤）。
                // 离线模式下 manifestSummary 为 null 同样跳过，不破坏离线可用性。
                verifyManifestItemIntegrity(cachedEntry.data, name, manifestSummary);
                return cachedEntry.data;
            }
        }
    }

    // 离线模式：缓存未命中（或版本不匹配且无法触网），抛错
    if (isOfflineMode()) {
        throw new CliError(
            `Offline mode is active and component "${name}" is not in cache for source ${source}.`,
            { code: 'REGISTRY_OFFLINE_UNAVAILABLE' }
        );
    }

    const url = `${source}/${name}.json`;
    const headers: Record<string, string> = { ...buildAuthHeaders(source) };
    if (cachedEntry?.etag) headers['If-None-Match'] = cachedEntry.etag;
    if (cachedEntry?.lastModified) headers['If-Modified-Since'] = cachedEntry.lastModified;

    const res = await fetchWithRetry(url, 3, headers);
    if (res.status === 304 && cachedEntry) {
        // #117：304 只 touch 续期 timestamp 会让条目永久携带旧 registryVersion
        // （touchCachedEntry 不重写 header），后续 versionMatch 恒 false，即使 TTL 未过期
        // 也永远无法命中缓存分支——用 setCachedEntry 同步写入当前 registryVersion
        // （etag/lastModified 沿用旧值）。manifest 拉取失败（currentRegistryVersion 为空）
        // 时退回 touch，避免用 undefined 抹掉条目已有的版本绑定。
        if (currentRegistryVersion) {
            await setCachedEntry(name, source, cachedEntry.data, {
                etag: cachedEntry.etag,
                lastModified: cachedEntry.lastModified,
                registryVersion: currentRegistryVersion,
            }).catch(() => {});
        } else {
            await touchCachedEntry(name, source).catch(() => {});
        }
        // #120：304 复用缓存 body 同样未经交叉校验（#117 只补版本绑定），返回前补齐；
        // manifest 拉取失败（manifestSummary 为 null）时校验内部跳过，不误伤。
        verifyManifestItemIntegrity(cachedEntry.data, name, manifestSummary);
        return cachedEntry.data;
    }
    if (!res.ok) {
        // 404 是"组件不存在"的确定性信号，透出独立错误码（供 info/update 等区分
        // not-found 与 registry-unreachable）；其余 HTTP 错误仍视为获取失败
        if (res.status === 404) {
            throw new CliError(
                `Component "${name}" not found in registry: ${res.statusText}`,
                { code: 'COMPONENT_NOT_FOUND' }
            );
        }
        throw new CliError(
            `Failed to fetch component "${name}" from registry: ${res.statusText}`,
            { code: 'REGISTRY_FETCH_FAILED' }
        );
    }

    const data = await res.json() as RegistryItem;
    validateItemWithIntegrity(data, name);
    verifyManifestItemIntegrity(data, name, manifestSummary);

    if (useCache) {
        const etag = res.headers.get('etag') ?? undefined;
        const lastModified = res.headers.get('last-modified') ?? undefined;
        await setCachedEntry(name, source, data, {
            etag,
            lastModified,
            registryVersion: currentRegistryVersion,
        }).catch(() => {});
    }

    return data;
}

function validateBrutalistConfig(data: unknown): asserts data is Record<string, unknown> {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('Invalid components.json: expected an object.');
    }

    const config = data as Record<string, unknown>;

    if (config.$schema !== undefined && typeof config.$schema !== 'string') {
        throw new Error('Invalid components.json: "$schema" must be a string.');
    }

    if (config.style !== undefined && typeof config.style !== 'string') {
        throw new Error('Invalid components.json: "style" must be a string.');
    }

    if (config.tailwind !== undefined) {
        if (typeof config.tailwind !== 'object' || config.tailwind === null || Array.isArray(config.tailwind)) {
            throw new Error('Invalid components.json: "tailwind" must be an object.');
        }
        const tailwind = config.tailwind as Record<string, unknown>;
        if (tailwind.config !== undefined && typeof tailwind.config !== 'string') {
            throw new Error('Invalid components.json: "tailwind.config" must be a string.');
        }
        if (tailwind.css !== undefined && typeof tailwind.css !== 'string') {
            throw new Error('Invalid components.json: "tailwind.css" must be a string.');
        }
    }

    if (config.aliases !== undefined) {
        if (typeof config.aliases !== 'object' || config.aliases === null || Array.isArray(config.aliases)) {
            throw new Error('Invalid components.json: "aliases" must be an object.');
        }
        const aliases = config.aliases as Record<string, unknown>;
        if (aliases.components !== undefined && typeof aliases.components !== 'string') {
            throw new Error('Invalid components.json: "aliases.components" must be a string.');
        }
        if (aliases.utils !== undefined && typeof aliases.utils !== 'string') {
            throw new Error('Invalid components.json: "aliases.utils" must be a string.');
        }
        if (aliases.composables !== undefined && typeof aliases.composables !== 'string') {
            throw new Error('Invalid components.json: "aliases.composables" must be a string.');
        }
    }

    if (config.registries !== undefined) {
        if (!Array.isArray(config.registries) || config.registries.some(url => typeof url !== 'string' || url.length === 0)) {
            throw new Error('Invalid components.json: "registries" must be an array of non-empty strings.');
        }
    }

    // 基础设施闭环 P1：严格签名模式与项目级信任公钥（旧版本 components.json 缺省时静默兼容）
    if (config.requireSignature !== undefined && typeof config.requireSignature !== 'boolean') {
        throw new Error('Invalid components.json: "requireSignature" must be a boolean.');
    }

    if (config.trustedPublicKeys !== undefined) {
        if (!Array.isArray(config.trustedPublicKeys)) {
            throw new Error('Invalid components.json: "trustedPublicKeys" must be an array.');
        }
        for (const key of config.trustedPublicKeys) {
            if (typeof key !== 'object' || key === null || Array.isArray(key)) {
                throw new Error('Invalid components.json: each "trustedPublicKeys" entry must be an object.');
            }
            const k = key as Record<string, unknown>;
            if (typeof k.keyId !== 'string' || k.keyId.length === 0) {
                throw new Error('Invalid components.json: each "trustedPublicKeys" entry requires a non-empty "keyId".');
            }
            if (typeof k.publicKey !== 'string' || k.publicKey.length === 0) {
                throw new Error('Invalid components.json: each "trustedPublicKeys" entry requires a non-empty "publicKey".');
            }
        }
    }
}

export async function migrateConfig(raw: Record<string, unknown>): Promise<Record<string, unknown>> {
    const version = typeof raw.$version === 'number' ? raw.$version : 0;

    if (version >= CURRENT_CONFIG_VERSION) {
        return raw;
    }

    const migrated = { ...raw };

    // v0 → v1: add $schema and $version if missing
    if (version < 1) {
        if (!migrated.$schema) {
            migrated.$schema = SCHEMA_URL;
        }
        migrated.$version = 1;
    }

    // Future migrations go here:
    // if (migrated.$version < 2) { ... migrated.$version = 2; }

    return migrated;
}

export async function readConfigSafe(cwd: string): Promise<BrutalistConfig | null> {
    try {
        return await readConfig(cwd);
    } catch {
        return null;
    }
}

export async function readConfig(cwd: string): Promise<BrutalistConfig> {
    const configPath = path.join(cwd, 'components.json');
    if (!(await fs.pathExists(configPath))) {
        throw new Error('components.json not found. Run `brutx-vue init` first.');
    }

    let config: unknown;
    try {
        config = await fs.readJson(configPath);
    } catch (error) {
        throw new Error(`Failed to parse components.json: invalid JSON. ${error instanceof Error ? error.message : ''}`, { cause: error });
    }

    validateBrutalistConfig(config);

    // config is narrowed to Record<string, unknown> by validateBrutalistConfig
    const raw = await migrateConfig(config as Record<string, unknown>);
    const rawTailwind = raw.tailwind;
    const rawAliases = raw.aliases;

    const tailwind = (typeof rawTailwind === 'object' && rawTailwind !== null && !Array.isArray(rawTailwind))
        ? rawTailwind as Record<string, unknown>
        : undefined;
    const aliases = (typeof rawAliases === 'object' && rawAliases !== null && !Array.isArray(rawAliases))
        ? rawAliases as Record<string, unknown>
        : undefined;

    const parsed: BrutalistConfig = {
        $schema: (typeof raw.$schema === 'string' ? raw.$schema : undefined) ?? SCHEMA_URL,
        $version: typeof raw.$version === 'number' ? raw.$version : undefined,
        style: (typeof raw.style === 'string' ? raw.style : undefined) ?? 'brutalism',
        tailwind: {
            config: (typeof tailwind?.config === 'string' ? tailwind.config : undefined) ?? DEFAULT_TAILWIND_CONFIG,
            css: (typeof tailwind?.css === 'string' ? tailwind?.css : undefined) ?? '@/styles/globals.css',
        },
        aliases: {
            components: (typeof aliases?.components === 'string' ? aliases.components : undefined) ?? DEFAULT_ALIASES.components,
            utils: (typeof aliases?.utils === 'string' ? aliases.utils : undefined) ?? DEFAULT_ALIASES.utils,
            composables: (typeof aliases?.composables === 'string' ? aliases.composables : undefined) ?? DEFAULT_ALIASES.composables,
        },
        sharedBase: typeof raw.sharedBase === 'string' ? raw.sharedBase : undefined,
        registries: Array.isArray(raw.registries)
            ? raw.registries.filter((url): url is string => typeof url === 'string' && url.length > 0)
            : undefined,
        requireSignature: typeof raw.requireSignature === 'boolean' ? raw.requireSignature : undefined,
        trustedPublicKeys: Array.isArray(raw.trustedPublicKeys)
            ? (raw.trustedPublicKeys as Array<Record<string, unknown>>)
                .filter(
                    k => typeof k === 'object' && k !== null &&
                        typeof k.keyId === 'string' && k.keyId.length > 0 &&
                        typeof k.publicKey === 'string' && k.publicKey.length > 0
                )
                .map((k): TrustedPublicKey => ({
                    keyId: k.keyId as string,
                    publicKey: k.publicKey as string,
                    status: (k.status === 'active' || k.status === 'rotated' || k.status === 'revoked') ? k.status : undefined,
                    note: typeof k.note === 'string' ? k.note : undefined,
                }))
            : undefined,
    };

    // 基础设施闭环 P1：项目级签名配置在配置读取时生效（严格模式优先级 + 项目信任公钥），
    // 保证后续任何 manifest 拉取/验签路径都应用项目声明。无相关字段时静默兼容旧版配置。
    applyRequireSignatureConfig(parsed);
    setTrustedPublicKeys(parsed.trustedPublicKeys);

    return parsed;
}

export async function resolveDeps(
    names: string[],
    source: string = DEFAULT_REGISTRY_URL,
    useCache: boolean = true,
    sources?: string[],
    outSources?: Map<string, string>,
): Promise<RegistryItem[]> {
    const resolved: RegistryItem[] = [];
    // 去重键为 (cleanName, itemSource) 二元组——版本信息已隐含在 itemSource 中。
    // 同源同名去重（A、B 都依赖 button@v1 只拉一次），跨版本各自解析（button@v1 与 button@v2 并存）。
    // 不可额外拼 version 进键——会造成同版本重复拉取，破坏现存去重行为。
    const visited = new Set<string>();
    const active = new Set<string>();
    const effectiveUseCache = useCache && process.env.BRUTX_NO_CACHE !== '1';
    // 多源解析（基础设施闭环 P0）：sources 非空时按序 fallback；否则退回单源。
    const effectiveSources = sources && sources.length > 0 ? sources : [source];

    function makeKey(cleanName: string, itemSource: string): string {
        return `${cleanName}::${itemSource}`;
    }

    /**
     * 把 @version 解析为相对当前 source 的 ref URL。
     * 仅支持 GitHub raw URL 结构（raw.githubusercontent.com/{owner}/{repo}/{ref}/...）；
     * 默认源（GitHub Release 资产端点，releases/latest/download）无版本化能力，
     * 忽略版本按 latest 拉取（产物发布时构建方案 T2 降级语义）；
     * 其他自定义结构仍显式报错而非静默忽略（v2.2 补强：去硬编码，与 --registry 一致）。
     */
    function resolveVersionedSource(baseSource: string, version: string): string {
        const match = baseSource.match(GITHUB_RAW_URL_PATTERN);
        if (!match) {
            // 默认源忽略版本：Release 资产 URL 固定指向 latest，无历史版本可寻址。
            if (DEFAULT_REGISTRY_SOURCES.some((source) => source === baseSource)) {
                return baseSource;
            }
            throw new CliError(
                `@version syntax requires a GitHub raw URL registry, but got: ${baseSource}. ` +
                `Use --registry to specify a GitHub raw URL, or remove @version from the component name.`,
                { code: 'REGISTRY_VERSION_UNSUPPORTED' }
            );
        }
        const [, owner, repo, , rest] = match;
        return `https://raw.githubusercontent.com/${owner}/${repo}/${version}/${rest}`;
    }

    async function dfs(fullName: string, inheritedSource?: string) {
        let cleanName = fullName;
        let requestedSource = inheritedSource ?? source;

        if (fullName.includes('@')) {
            const match = fullName.match(/^(@[a-z0-9-]+\/[a-z0-9-]+|[a-z0-9-]+)@([a-zA-Z0-9._-]+)$/);
            if (match) {
                cleanName = match[1];
                const version = match[2];
                // 版本号优先相对实际命中源（inheritedSource）解析，保证版本语义跟随真实来源；
                // 用完整结构正则判断（而非前缀），确保 inheritedSource 能被 resolveVersionedSource
                // 正常解析后再选用，否则回退到顶层 source。
                // 注意：版本化后 requestedSource !== source，该依赖不再参与多源 fallback（版本需钉在特定 ref）。
                const versionBase = inheritedSource && GITHUB_RAW_URL_PATTERN.test(inheritedSource)
                    ? inheritedSource
                    : source;
                requestedSource = resolveVersionedSource(versionBase, version);
            }
        }

        // 多源：仅顶层组件且未继承版本化源时启用；依赖继承父组件命中源，保证内容一致。
        const useMultiSource = !inheritedSource && requestedSource === source && effectiveSources.length > 1;
        const itemSources = useMultiSource ? effectiveSources : [requestedSource];

        const key = makeKey(cleanName, itemSources.join(','));
        if (active.has(key)) {
            throw new Error(`Circular dependency detected: ${cleanName} (source: ${itemSources.join(', ')})`);
        }
        if (visited.has(key)) {
            return;
        }

        active.add(key);

        try {
            const { item, source: hitSource } = useMultiSource
                ? await getItemFromSources(cleanName, itemSources, effectiveUseCache)
                : { item: await getItem(cleanName, itemSources[0], effectiveUseCache), source: itemSources[0] };

            // 记录实际命中源，供 manifest 准确记录 registrySource（多源 fallback 下可能非主源）
            outSources?.set(cleanName, hitSource);

            if (item.registryDependencies && item.registryDependencies.length > 0) {
                for (const dep of item.registryDependencies) {
                    await dfs(dep, hitSource);
                }
            }

            active.delete(key);
            visited.add(key);
            resolved.push(item);
        } catch (err) {
            active.delete(key);
            throw err;
        }
    }

    for (const name of names) {
        await dfs(name);
    }

    return resolved;
}
