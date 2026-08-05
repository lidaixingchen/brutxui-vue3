import fs from 'fs-extra';
import path from 'path';
import {
    validateRegistryIntegrity,
    validateRegistryItem,
} from 'brutx-shared-vue';
import type { RegistryItem, BrutalistConfig, RegistryManifestSummary, TrustedPublicKey } from './types.js';
import { DEFAULT_REGISTRY_URL, SCHEMA_URL, DEFAULT_ALIASES, DEFAULT_TAILWIND_CONFIG, CURRENT_CONFIG_VERSION } from './constants.js';
import { CliError } from './error.js';
import { getCachedEntry, setCachedEntry, touchCachedEntry, dedupeInflight, isOfflineMode } from './cache.js';
import { buildAuthHeaders, fetchWithSources } from './registry-source.js';
import { logger } from './logger.js';
import { verifyManifestIntegrityAndSignature, setTrustedPublicKeys } from './signature.js';
import { applyRequireSignatureConfig } from './signature-mode.js';

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
const registryManifestCache = new Map<string, RegistryManifestSummary | null>();

/**
 * 拉取 registry-manifest.json 获取 registryVersion 与 integrity。
 * 拉取失败时返回 null——缓存版本绑定降级为"不校验版本"，由 integrity 兜底。
 *
 * P1-6：若 manifest 含 signature/keyId 字段且 BRUTX_REGISTRY_PUBLIC_KEYS 已配置，
 * 在此触发签名验证。REGISTRY_SIGNATURE_INVALID 必须冒泡（不降级为 null）。
 */
async function fetchRegistryManifestSummary(source: string): Promise<RegistryManifestSummary | null> {
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
        // 基础设施闭环 P1：完整性复算 + 签名校验。REGISTRY_SIGNATURE_INVALID 必须冒泡，
        // 由 catch 块特判放行——签名失败绝不降级为 null（否则篡改的 manifest 会静默通过）。
        verifyManifestIntegrityAndSignature(manifest);

        const summary: RegistryManifestSummary = {
            registryVersion: manifest.registryVersion,
            integrity: typeof manifest.integrity === 'string' ? manifest.integrity : undefined,
        };
        registryManifestCache.set(source, summary);
        return summary;
    } catch (error) {
        // 签名失败必须冒泡——降级为 null 会让篡改的 manifest 静默通过
        if (error instanceof CliError && error.code === 'REGISTRY_SIGNATURE_INVALID') {
            throw error;
        }
        registryManifestCache.set(source, null);
        return null;
    }
}

async function fetchWithRetry(url: string, maxRetries: number = 3, headers?: Record<string, string>): Promise<Response> {
    const delays = [1000, 2000, 4000];
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fetch(url, {
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
        }
    }

    throw new CliError(
        `Failed to fetch from "${url}" after ${maxRetries} attempts. ` +
        `Please check your network connection or use --registry to specify a different source.\n` +
        `Last error: ${lastError?.message ?? 'Unknown error'}`,
        { code: 'REGISTRY_FETCH_FAILED', cause: lastError }
    );
}

function verifyRegistryIntegrity(item: RegistryItem, name: string): void {
    try {
        validateRegistryIntegrity(item, name);
    } catch (error) {
        throw new CliError(
            `Integrity check failed for component '${name}'. The registry content may have been tampered with.`,
            { code: 'REGISTRY_INTEGRITY_FAILED', cause: error }
        );
    }
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
        const filePath = path.resolve(source, `${name}.json`);
        if (!filePath.startsWith(path.resolve(source) + path.sep)) {
            throw new CliError(
                `Security Error: Path traversal detected in component name "${name}".`,
                { code: 'PATH_UNSAFE', exitCode: 2 }
            );
        }
        if (!(await fs.pathExists(filePath))) {
            throw new Error(`Component "${name}" not found in local registry: ${filePath}`);
        }
        const data = await fs.readJson(filePath);

        validateRegistryItem(data, { name });
        verifyRegistryIntegrity(data, name);
        return data;
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

    if (useCache) {
        // 离线模式下不拉 manifest（manifest 也走网络），直接读缓存。
        if (!isOfflineMode()) {
            currentRegistryVersion = (await fetchRegistryManifestSummary(source))?.registryVersion;
        }
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
        await touchCachedEntry(name, source).catch(() => {});
        return cachedEntry.data;
    }
    if (!res.ok) {
        throw new CliError(
            `Failed to fetch component "${name}" from registry: ${res.statusText}`,
            { code: 'REGISTRY_FETCH_FAILED' }
        );
    }

    const data = await res.json() as RegistryItem;
    validateRegistryItem(data, { name });
    verifyRegistryIntegrity(data, name);

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
     * 仅支持 GitHub raw URL 结构（raw.githubusercontent.com/{owner}/{repo}/{ref}/...），
     * 其他结构显式报错而非静默忽略（v2.2 补强：去硬编码，与 --registry 一致）。
     */
    function resolveVersionedSource(baseSource: string, version: string): string {
        const match = baseSource.match(GITHUB_RAW_URL_PATTERN);
        if (!match) {
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
