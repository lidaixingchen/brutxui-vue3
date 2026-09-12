import path from 'path';
import { DiskFileSystemAdapter, type FileSystemAdapter } from './fs/index.js';
import {
    RegistryIntegrityMismatchError,
    validateRegistryItem,
} from 'brutx-shared-vue';
import type { RegistryItem, RegistryManifestSummary, TrustedPublicKey } from './types.js';
import {
    DEFAULT_REGISTRY_SOURCES,
} from './constants.js';
import { CliError } from './error.js';
import { logger } from './logger.js';
import { createDefaultCacheStorage, isOfflineMode, type CacheStorage, type CacheReadResult } from './storage/cache-storage.js';
import { resilientFetch } from './resilience/resilient-fetch.js';
import { RegistrySourceTracker } from './resilience/source-tracker.js';
import { hedgedRace } from './resilience/hedged-race.js';
import { buildAuthHeaders } from './registry-source.js';
import { verifyManifestIntegrityAndSignature, loadTrustedPublicKeys } from './signature.js';
import type {
    RegistryClientOptions,
    ResolvedComponentPlan,
    FetchItemOptions,
    ListComponentsOptions,
    HttpFetcher,
} from './registry-types.js';

const GITHUB_RAW_URL_PATTERN = /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)$/;
const SPECIFIER_PATTERN = /^(@[a-z0-9-]+\/[a-z0-9-]+|[a-z0-9-]+)(?:@([a-zA-Z0-9._-]+))?$/;

interface ManifestSummaryInternal extends RegistryManifestSummary {
    itemIntegrities?: Record<string, string>;
}

function isHttpUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
}

const defaultHttpFetcher: HttpFetcher = (url: string, init?: RequestInit): Promise<Response> => {
    const rawHeaders = init?.headers;
    let headers: Record<string, string> | undefined;
    if (rawHeaders) {
        if (rawHeaders instanceof Headers) {
            headers = Object.fromEntries(rawHeaders.entries());
        } else if (Array.isArray(rawHeaders)) {
            headers = Object.fromEntries(rawHeaders);
        } else {
            headers = { ...(rawHeaders as Record<string, string>) };
        }
    }
    return resilientFetch(url, {
        headers,
        signal: init?.signal as AbortSignal | undefined,
    });
};

export class RegistryClient {
    public readonly sources: readonly string[];
    public readonly requireSignature: boolean;
    public readonly trustedPublicKeys?: readonly TrustedPublicKey[];
    public readonly offline: boolean;
    public readonly useCache: boolean;
    public readonly fs: FileSystemAdapter;
    public readonly cache: CacheStorage;
    public readonly fetcher: HttpFetcher;
    public readonly tracker: RegistrySourceTracker;

    private readonly manifestCache = new Map<string, ManifestSummaryInternal | null>();
    private readonly inflightItems = new Map<string, Promise<{ item: RegistryItem; source: string }>>();
    private readonly lastHitSources = new Map<string, string>();

    public getLastHitSource(name: string): string | undefined {
        return this.lastHitSources.get(name);
    }

    public constructor(options?: RegistryClientOptions) {
        this.sources = options?.sources && options.sources.length > 0
            ? [...options.sources]
            : [...DEFAULT_REGISTRY_SOURCES];
        this.requireSignature = options?.requireSignature ?? false;
        this.trustedPublicKeys = options?.trustedPublicKeys ?? loadTrustedPublicKeys();
        this.offline = options?.offline ?? isOfflineMode();
        this.useCache = options?.useCache ?? (process.env.BRUTX_NO_CACHE !== '1');
        this.fs = options?.fsAdapter ?? new DiskFileSystemAdapter();
        this.cache = options?.cacheStorage ?? createDefaultCacheStorage(this.fs);
        this.fetcher = options?.httpFetcher ?? defaultHttpFetcher;
        this.tracker = options?.tracker ?? new RegistrySourceTracker();
    }

    /**
     * 获取单个组件完整元数据及命中源信息。
     */
    public async fetchItemWithMeta(
        specifier: string,
        options?: FetchItemOptions,
    ): Promise<{ item: RegistryItem; source: string }> {
        const { name, version } = this.parseSpecifier(specifier);
        this.assertSafeComponentName(name);

        const targetSources = options?.sourceOverride
            ? [options.sourceOverride]
            : this.sources;

        // 如果包含版本，根据说明符转换源 URL
        const effectiveSources = targetSources.map(source => this.resolveVersionedSource(source, version));
        const sourceKey = effectiveSources.join(',');

        return this.dedupeInflight(name, sourceKey, () => {
            return this.fetchWithSourcesPipeline(name, effectiveSources, options);
        });
    }

    /**
     * 获取单个组件完整元数据。
     */
    public async fetchItem(specifier: string, options?: FetchItemOptions): Promise<RegistryItem> {
        const { item } = await this.fetchItemWithMeta(specifier, options);
        return item;
    }

    /**
     * 解析说明符为名称与版本号。
     */
    private parseSpecifier(specifier: string): { name: string; version?: string } {
        const trimmed = specifier.trim();
        if (trimmed.length === 0) {
            throw new CliError('Component specifier cannot be empty.', { code: 'INVALID_REGISTRY' });
        }

        const match = trimmed.match(SPECIFIER_PATTERN);
        if (match) {
            return {
                name: match[1],
                version: match[2],
            };
        }

        // 兜底拆分处理
        if (trimmed.includes('@') && !trimmed.startsWith('@')) {
            const parts = trimmed.split('@');
            return {
                name: parts[0],
                version: parts[1],
            };
        }

        return { name: trimmed };
    }

    /**
     * 校验组件名，杜绝路径穿越。
     */
    private assertSafeComponentName(name: string): void {
        if (
            name.length === 0 ||
            name === '.' ||
            name === '..' ||
            name.includes('\\') ||
            name.includes('/../') ||
            name.startsWith('../') ||
            name.endsWith('/..')
        ) {
            throw new CliError(
                `Security Error: Path traversal detected in component name "${name}".`,
                { code: 'PATH_UNSAFE', exitCode: 2 }
            );
        }
    }

    /**
     * 将源转换为特定版本的源。
     */
    private resolveVersionedSource(baseSource: string, version?: string): string {
        if (!version) return baseSource;

        const match = baseSource.match(GITHUB_RAW_URL_PATTERN);
        if (!match) {
            if (DEFAULT_REGISTRY_SOURCES.some(s => s === baseSource)) {
                logger.warn(
                    `@version "${version}" is ignored: default Release registry has no versioned assets, fetching latest instead.`
                );
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

    /**
     * 多源阶梯竞速与离线回退管线。
     */
    private async fetchWithSourcesPipeline(
        name: string,
        sources: readonly string[],
        options?: FetchItemOptions,
    ): Promise<{ item: RegistryItem; source: string }> {
        const signal = options?.signal;
        if (sources.length === 0) {
            throw new CliError('No registry source available.', { code: 'REGISTRY_FETCH_FAILED' });
        }

        if (this.offline) {
            let firstError: CliError | null = null;
            for (const source of sources) {
                try {
                    const item = await this.fetchSingleSource(name, source, options);
                    this.lastHitSources.set(name, source);
                    return { item, source };
                } catch (error) {
                    if (firstError === null && error instanceof CliError) {
                        firstError = error;
                    }
                }
            }
            throw new CliError(
                `All ${sources.length} registry source(s) unavailable in offline mode. Pre-cache components while online.`,
                { code: 'REGISTRY_OFFLINE_UNAVAILABLE', cause: firstError }
            );
        }

        if (sources.length === 1) {
            const source = sources[0];
            try {
                const item = await this.fetchSingleSource(name, source, options);
                this.lastHitSources.set(name, source);
                return { item, source };
            } catch (err) {
                this.tracker.recordFailure(source);
                throw err;
            }
        }

        const rankedSources = this.tracker.rankSources([...sources]);
        const raceResult = await hedgedRace<RegistryItem>(
            rankedSources,
            async (source, sourceSignal) => {
                try {
                    return await this.fetchSingleSource(name, source, { ...options, signal: sourceSignal ?? signal });
                } catch (err) {
                    this.tracker.recordFailure(source);
                    throw err;
                }
            },
            { parentSignal: signal },
        );

        this.tracker.recordSuccess(raceResult.winningSource, raceResult.durationMs);
        this.lastHitSources.set(name, raceResult.winningSource);

        return {
            item: raceResult.result,
            source: raceResult.winningSource,
        };
    }

    /**
     * 从单一源（本地或远程）拉取单个组件。
     */
    private async fetchSingleSource(
        name: string,
        source: string,
        options?: FetchItemOptions,
    ): Promise<RegistryItem> {
        if (isHttpUrl(source)) {
            return await this.fetchRemoteHttp(name, source, options);
        }
        return await this.fetchLocalDisk(name, source);
    }

    /**
     * 本地文件源读取。
     */
    private async fetchLocalDisk(name: string, source: string): Promise<RegistryItem> {
        const sourceResolved = path.resolve(source);
        const filePath = path.resolve(source, `${name}.json`);

        if (!filePath.startsWith(sourceResolved + path.sep)) {
            throw new CliError(
                `Security Error: Path traversal detected in component name "${name}".`,
                { code: 'PATH_UNSAFE', exitCode: 2 }
            );
        }

        if (!(await this.fs.pathExists(filePath))) {
            throw new CliError(
                `Component "${name}" not found in local registry: ${filePath}`,
                { code: 'COMPONENT_NOT_FOUND' }
            );
        }

        let realFilePath: string;
        try {
            realFilePath = await this.fs.realpath(filePath);
        } catch {
            throw new CliError(
                `Component "${name}" not found in local registry: ${filePath}`,
                { code: 'COMPONENT_NOT_FOUND' }
            );
        }

        let realSource: string;
        try {
            realSource = await this.fs.realpath(sourceResolved);
        } catch {
            realSource = sourceResolved;
        }

        const relativeFilePath = path.relative(realSource, realFilePath);
        if (relativeFilePath === '' || relativeFilePath.startsWith('..') || path.isAbsolute(relativeFilePath)) {
            throw new CliError(
                `Security Error: Path traversal detected in component name "${name}".`,
                { code: 'PATH_UNSAFE', exitCode: 2 }
            );
        }

        const data = await this.fs.readJson<RegistryItem>(realFilePath);
        this.validateItemIntegrity(data, name);
        return data;
    }

    /**
     * 远程 HTTP 源拉取（304 缓存协商 + 签名/完整性交叉校验）。
     */
    private async fetchRemoteHttp(
        name: string,
        source: string,
        options?: FetchItemOptions,
    ): Promise<RegistryItem> {
        const signal = options?.signal;
        const effectiveUseCache = options?.useCache ?? this.useCache;
        let cachedEntry: CacheReadResult<RegistryItem> | null = null;
        let manifestSummary: ManifestSummaryInternal | null = null;
        let currentRegistryVersion: string | undefined;

        if (!this.offline) {
            manifestSummary = await this.fetchManifestSummary(source, signal);
            currentRegistryVersion = manifestSummary?.registryVersion;
        }

        if (effectiveUseCache) {
            cachedEntry = await this.cache.get<RegistryItem>(name, source);
            if (cachedEntry) {
                const versionMatch = !currentRegistryVersion ||
                    !cachedEntry.registryVersion ||
                    cachedEntry.registryVersion === currentRegistryVersion;

                const offlineOk = this.offline && versionMatch;
                const onlineFresh = !cachedEntry.expired && versionMatch;

                if (offlineOk || onlineFresh) {
                    if (offlineOk) {
                        logger.info(`[OFFLINE CACHE HIT] ${name} (source: ${source})`);
                    }
                    this.verifyManifestItemCrossCheck(cachedEntry.data, name, manifestSummary);
                    this.validateItemIntegrity(cachedEntry.data, name);
                    return cachedEntry.data;
                }
            }
        }

        if (this.offline) {
            throw new CliError(`Component "${name}" not cached in offline mode (source: ${source}).`, {
                code: 'REGISTRY_OFFLINE_UNAVAILABLE',
            });
        }

        const url = `${source}/${name}.json`;
        const headers: Record<string, string> = {
            ...buildAuthHeaders(source),
        };

        if (effectiveUseCache && cachedEntry) {
            if (cachedEntry.etag) headers['If-None-Match'] = cachedEntry.etag;
            if (cachedEntry.lastModified) headers['If-Modified-Since'] = cachedEntry.lastModified;
        }

        const res = await this.fetcher(url, { headers, signal });

        if (res.status === 304 && cachedEntry) {
            await this.cache.touch(name, source);
            this.verifyManifestItemCrossCheck(cachedEntry.data, name, manifestSummary);
            this.validateItemIntegrity(cachedEntry.data, name);
            return cachedEntry.data;
        }

        if (!res.ok) {
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
        this.validateItemIntegrity(data, name);
        this.verifyManifestItemCrossCheck(data, name, manifestSummary);

        if (effectiveUseCache) {
            const etag = res.headers.get('etag') ?? undefined;
            const lastModified = res.headers.get('last-modified') ?? undefined;
            await this.cache.set(name, source, data, {
                etag,
                lastModified,
                registryVersion: currentRegistryVersion,
            }).catch(() => {});
        }

        return data;
    }

    /**
     * 拉取与校验 Manifest 摘要。
     */
    private async fetchManifestSummary(source: string, signal?: AbortSignal): Promise<ManifestSummaryInternal | null> {
        const cached = this.manifestCache.get(source);
        if (cached !== undefined) return cached;

        const manifestUrl = `${source}/registry-manifest.json`;
        try {
            const res = await this.fetcher(manifestUrl, {
                headers: buildAuthHeaders(source),
                signal,
            });
            if (!res.ok) {
                if (this.requireSignature) {
                    throw new CliError(
                        `Strict signature verification requires valid manifest, but failed to fetch: HTTP ${res.status} ${res.statusText}`,
                        { code: 'REGISTRY_SIGNATURE_INVALID' }
                    );
                }
                this.manifestCache.set(source, null);
                return null;
            }
            const manifest = await res.json() as {
                registryVersion?: string;
                integrity?: string;
                signature?: string;
                keyId?: string;
                items?: Record<string, { integrity?: string }>;
            };

            if (typeof manifest.registryVersion !== 'string' || manifest.registryVersion.length === 0) {
                if (this.requireSignature) {
                    throw new CliError('Strict signature verification failed: manifest missing registryVersion.', {
                        code: 'REGISTRY_SIGNATURE_INVALID',
                    });
                }
                this.manifestCache.set(source, null);
                return null;
            }
            if (typeof manifest.integrity !== 'string' || manifest.integrity.length === 0) {
                if (this.requireSignature) {
                    throw new CliError('Strict signature verification failed: manifest missing integrity.', {
                        code: 'REGISTRY_SIGNATURE_INVALID',
                    });
                }
                this.manifestCache.set(source, null);
                return null;
            }

            const signatureValid = verifyManifestIntegrityAndSignature(
                manifest,
                this.trustedPublicKeys as TrustedPublicKey[] | undefined,
                this.requireSignature,
            );
            if (!signatureValid && this.requireSignature) {
                throw new CliError(
                    'Manifest signature verification failed. The manifest may have been tampered with.',
                    { code: 'REGISTRY_SIGNATURE_INVALID' }
                );
            }

            const itemIntegrities: Record<string, string> = {};
            if (manifest.items && typeof manifest.items === 'object') {
                for (const [itemName, entry] of Object.entries(manifest.items)) {
                    if (typeof entry?.integrity === 'string' && entry.integrity.length > 0) {
                        itemIntegrities[itemName] = entry.integrity;
                    }
                }
            }

            const summary: ManifestSummaryInternal = {
                registryVersion: manifest.registryVersion,
                integrity: manifest.integrity,
                itemIntegrities: Object.keys(itemIntegrities).length > 0 ? itemIntegrities : undefined,
            };
            this.manifestCache.set(source, summary);
            return summary;
        } catch (error) {
            if (signal?.aborted) throw error;
            if (error instanceof CliError && error.code === 'REGISTRY_SIGNATURE_INVALID') {
                throw error;
            }
            if (this.requireSignature) {
                throw new CliError(
                    `Strict signature verification requires valid manifest: ${error instanceof Error ? error.message : String(error)}`,
                    { code: 'REGISTRY_SIGNATURE_INVALID', cause: error }
                );
            }
            this.manifestCache.set(source, null);
            return null;
        }
    }

    /**
     * 组件自身 integrity 校验。
     */
    private validateItemIntegrity(item: RegistryItem, expectedName: string): void {
        try {
            validateRegistryItem(item, { name: expectedName });
        } catch (error) {
            if (error instanceof RegistryIntegrityMismatchError) {
                throw new CliError(
                    `Component "${expectedName}" integrity check failed: ${error.message}`,
                    { code: 'REGISTRY_INTEGRITY_FAILED', exitCode: 1 }
                );
            }
            throw new CliError(
                `Component "${expectedName}" schema validation failed: ${error instanceof Error ? error.message : String(error)}`,
                { code: 'REGISTRY_FETCH_FAILED', exitCode: 1 }
            );
        }
    }

    /**
     * 与 Manifest items 声明的 integrity 交叉校验。
     */
    private verifyManifestItemCrossCheck(
        item: RegistryItem,
        itemName: string,
        manifestSummary: ManifestSummaryInternal | null,
    ): void {
        const declaredIntegrity = manifestSummary?.itemIntegrities?.[itemName];
        if (!declaredIntegrity) return;

        if (item.integrity !== declaredIntegrity) {
            throw new CliError(
                `Security Error: Cross-check failed for component "${itemName}". ` +
                `Manifest declared integrity "${declaredIntegrity}", but received "${item.integrity ?? '<missing>'}".`,
                { code: 'REGISTRY_INTEGRITY_FAILED', exitCode: 1 }
            );
        }
    }

    /**
     * 请求去重。
     */
    private dedupeInflight(
        name: string,
        sourceKey: string,
        fn: () => Promise<{ item: RegistryItem; source: string }>,
    ): Promise<{ item: RegistryItem; source: string }> {
        const key = `${name}::${sourceKey}`;
        const existing = this.inflightItems.get(key);
        if (existing) {
            return existing;
        }

        const promise = fn().finally(() => {
            this.inflightItems.delete(key);
        });

        this.inflightItems.set(key, promise);
        return promise;
    }

    /**
     * 拓扑解析与依赖展开。
     * 对组件及其 registryDependencies 执行深度优先搜索（DFS），
     * 通过 ancestors 调用链集合严格防御循环依赖（避免菱形依赖假阳性），
     * 并发分支通过 resolving Promise 记忆表实现汇聚单飞等待，
     * 内部通过 Promise.all 树级并发与 dedupeInflight 请求单飞去重，
     * 保证返回的 items 数组满足拓扑排序（被依赖组件在前）。
     */
    public async resolve(
        specifiers: readonly string[],
        options?: FetchItemOptions,
    ): Promise<ResolvedComponentPlan> {
        const resolved: RegistryItem[] = [];
        const hitSources = new Map<string, string>();
        const visited = new Set<string>();
        const resolving = new Map<string, Promise<void>>();
        const dependencies = new Set<string>();
        const devDependencies = new Set<string>();
        const registryDependencies = new Set<string>();

        const targetSources = options?.sourceOverride
            ? [options.sourceOverride]
            : this.sources;

        const dfs = async (
            specifier: string,
            parentSource?: string,
            ancestors: ReadonlySet<string> = new Set(),
        ): Promise<void> => {
            const { name: cleanName, version } = this.parseSpecifier(specifier);
            this.assertSafeComponentName(cleanName);

            // 如果有父级源且无显式覆盖，优先沿用父级命中源；否则使用 targetSources
            const effectiveSources = (parentSource ? [parentSource] : targetSources)
                .map(source => this.resolveVersionedSource(source, version));

            const sourceKey = effectiveSources.join(',');
            const dedupeKey = `${cleanName}::${sourceKey}`;

            if (ancestors.has(dedupeKey)) {
                const cycle = Array.from(ancestors).map(k => k.split('::')[0]).concat(cleanName).join(' -> ');
                throw new CliError(
                    `Circular dependency detected: ${cycle}`,
                    { code: 'INVALID_REGISTRY' }
                );
            }

            if (visited.has(dedupeKey)) {
                return;
            }

            const ongoing = resolving.get(dedupeKey);
            if (ongoing) {
                await ongoing;
                return;
            }

            const nextAncestors = new Set(ancestors);
            nextAncestors.add(dedupeKey);

            const task = (async () => {
                const { item, source: hitSource } = await this.dedupeInflight(
                    cleanName,
                    sourceKey,
                    () => this.fetchWithSourcesPipeline(cleanName, effectiveSources, options),
                );

                hitSources.set(cleanName, hitSource);

                if (item.registryDependencies && item.registryDependencies.length > 0) {
                    item.registryDependencies.forEach(dep => registryDependencies.add(dep));
                    await Promise.all(
                        item.registryDependencies.map(dep => dfs(dep, hitSource, nextAncestors))
                    );
                }

                visited.add(dedupeKey);

                if (!resolved.some(r => r.name === item.name)) {
                    resolved.push(item);
                }

                // 收集依赖
                item.dependencies?.forEach((dep: string) => dependencies.add(dep));
                if (item.devDependencies && Array.isArray(item.devDependencies)) {
                    item.devDependencies.forEach((dep: string) => devDependencies.add(dep));
                }
            })();

            resolving.set(dedupeKey, task);
            try {
                await task;
            } finally {
                resolving.delete(dedupeKey);
            }
        };

        for (const specifier of specifiers) {
            await dfs(specifier);
        }

        return {
            items: resolved,
            hitSources,
            npmDependencies: Array.from(dependencies).sort(),
            npmDevDependencies: Array.from(devDependencies).sort(),
            registryDependencies: Array.from(registryDependencies).sort(),
        };
    }

    /**
     * 枚举组件名称。
     * 本地源遍历目标目录中的 *.json 文件；
     * 远程 HTTP 源拉取 registry-manifest.json 提取 items 字段。
     */
    public async listComponents(options?: ListComponentsOptions): Promise<readonly string[]> {
        const targetSource = options?.source ?? this.sources[0];
        if (isHttpUrl(targetSource)) {
            if (this.offline) {
                const cachedManifest = await this.cache.get<{ items?: Record<string, unknown> }>('registry-manifest', targetSource);
                if (cachedManifest && cachedManifest.data?.items && typeof cachedManifest.data.items === 'object') {
                    return Object.keys(cachedManifest.data.items).sort();
                }
                throw new CliError(`Offline mode enabled: registry manifest not available in cache for "${targetSource}".`, {
                    code: 'REGISTRY_OFFLINE_UNAVAILABLE',
                });
            }

            const summary = await this.fetchManifestSummary(targetSource, options?.signal);
            if (summary && summary.itemIntegrities) {
                return Object.keys(summary.itemIntegrities).sort();
            }

            const manifestUrl = `${targetSource}/registry-manifest.json`;
            try {
                const res = await this.fetcher(manifestUrl, {
                    headers: buildAuthHeaders(targetSource),
                    signal: options?.signal,
                });
                if (res.ok) {
                    const manifest = await res.json() as { items?: Record<string, unknown> };
                    if (manifest.items && typeof manifest.items === 'object') {
                        return Object.keys(manifest.items).sort();
                    }
                }
            } catch {
                // fallthrough to throw CliError
            }

            throw new CliError('Remote registry does not support listing components.', {
                code: 'REGISTRY_LIST_UNSUPPORTED',
            });
        }

        const sourceResolved = path.resolve(targetSource);
        if (!(await this.fs.pathExists(sourceResolved))) {
            throw new CliError(`Registry directory not found: ${sourceResolved}`, {
                code: 'INVALID_REGISTRY',
            });
        }

        const entries = await this.fs.readdir(sourceResolved);
        return entries
            .filter(f => f.endsWith('.json') && !f.startsWith('registry-') && f !== 'index.json')
            .map(f => f.replace(/\.json$/, ''))
            .sort();
    }
}

/** 判定是否为“组件在注册表中不存在”（404 或本地文件缺失）的精准守卫（支持展开 cause 链） */
export function isComponentNotFoundError(error: unknown): boolean {
    let current = error;
    while (current) {
        if (current instanceof CliError && current.code === 'COMPONENT_NOT_FOUND') {
            return true;
        }
        if (current instanceof Error && current.cause && current.cause !== current) {
            current = current.cause;
        } else {
            break;
        }
    }
    return false;
}

/** 判定是否为安全类错误（签名无效、完整性篡改、路径穿越） */
export function isRegistrySecurityError(error: unknown): boolean {
    if (error instanceof CliError) {
        return error.code === 'REGISTRY_SIGNATURE_INVALID' ||
            error.code === 'REGISTRY_INTEGRITY_FAILED' ||
            error.code === 'PATH_UNSAFE' ||
            error.code === 'PATH_UNSAFE_AFTER_WRITE';
    }
    return false;
}
