import path from 'path';
import { fileURLToPath } from 'node:url';
import { DiskFileSystemAdapter, type FileSystemAdapter } from './fs/index.js';
import {
    RegistryIntegrityMismatchError,
    validateRegistryItem,
} from 'brutx-shared-vue';
import type { RegistryItem, RegistryItemSnapshot, RegistryManifestSummary, RegistrySnapshot, TrustedPublicKey } from './types.js';
import {
    DEFAULT_REGISTRY_SOURCES,
} from './constants.js';
import { CliError } from './error.js';
import { logger } from './logger.js';
import {
    createDefaultCacheStorage,
    isOfflineMode,
    isRegistryCacheReadOnly,
    type CacheStorage,
    type CacheReadResult,
} from './storage/cache-storage.js';
import { resilientFetch } from './resilience/resilient-fetch.js';
import { RegistrySourceTracker } from './resilience/source-tracker.js';
import { hedgedRace, HedgedRaceWinnerAbort } from './resilience/hedged-race.js';
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

interface RegistrySourceSelection {
    source: string;
    baseSource?: string;
    version?: string;
}

interface RegistryComponentSpecifier {
    name: string;
    version?: string;
}

interface RegistryItemRequest {
    key: string;
    name: string;
    sources: RegistrySourceSelection[];
    requestedTag?: string;
}

/**
 * 解析说明符为名称与版本号。
 */
export function parseComponentSpecifier(specifier: string): RegistryComponentSpecifier {
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

function normalizeRegistryTag(version: string): string {
    return version.startsWith('v') ? version : `v${version}`;
}

function requestedRegistryTag(version?: string): string | undefined {
    return version && version !== 'latest' ? normalizeRegistryTag(version) : undefined;
}

function assertMatchingRegistryTags(name: string, firstTag?: string, secondTag?: string): void {
    if (firstTag && secondTag && firstTag !== secondTag) {
        throw new CliError(
            `Component "${name}" was requested at conflicting versions ${firstTag} and ${secondTag}.`,
            { code: 'INVALID_REGISTRY' },
        );
    }
}

export function collectRegistryComponentRequests(
    specifiers: readonly string[],
): Map<string, RegistryComponentSpecifier & { specifier: string }> {
    const requests = new Map<string, RegistryComponentSpecifier & { specifier: string }>();
    for (const specifier of specifiers) {
        const { name, version } = parseComponentSpecifier(specifier);
        const previous = requests.get(name);
        const previousTag = requestedRegistryTag(previous?.version);
        const tag = requestedRegistryTag(version);
        assertMatchingRegistryTags(name, previousTag, tag);
        if (!previous || (!previousTag && tag)) requests.set(name, { name, version, specifier });
    }
    return requests;
}

interface ManifestSummaryInternal extends RegistryManifestSummary {
    name?: string;
    schemaVersion?: number;
    releaseTag?: string;
    gitCommit?: string | null;
    digest?: string;
    itemCount?: number;
    itemIntegrities?: Record<string, string>;
    trusted?: boolean;
}

function isHttpUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
}

function isSignalCancellation(error: unknown, signal?: AbortSignal): boolean {
    if (!signal?.aborted) return false;
    let candidate: unknown = error;
    while (candidate !== undefined) {
        if (candidate === signal.reason) return true;
        if (!(candidate instanceof Error)) return false;
        if (candidate.name === 'AbortError') return true;
        candidate = (candidate as Error & { cause?: unknown }).cause;
    }
    return false;
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
    private readonly inflightManifests = new Map<string, Promise<ManifestSummaryInternal | null>>();
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
    ): Promise<RegistryItemSnapshot> {
        return this.fetchRequest(this.createItemRequest(parseComponentSpecifier(specifier), options), options);
    }

    private createItemRequest(
        { name, version }: RegistryComponentSpecifier,
        options?: FetchItemOptions,
        parent?: RegistrySourceSelection,
    ): RegistryItemRequest {
        this.assertSafeComponentName(name);
        const sources = parent
            ? [version ? this.selectSource(parent.baseSource ?? parent.source, version) : parent]
            : (options?.sourceOverride ? [options.sourceOverride] : this.sources)
                .map(source => this.selectSource(source, version));

        return {
            key: JSON.stringify([name, sources]),
            name,
            sources,
            requestedTag: requestedRegistryTag(version),
        };
    }

    private async fetchRequest(
        request: RegistryItemRequest,
        options?: FetchItemOptions,
    ): Promise<RegistryItemSnapshot> {
        const { name, sources } = request;
        const effectiveSources = [...new Set(sources.map(selection => selection.source))];
        const fetchItem = () => this.fetchWithSourcesPipeline(name, effectiveSources, options);
        const result = options?.signal
            ? await fetchItem()
            : await this.dedupeInflight(name, JSON.stringify(effectiveSources), fetchItem, options?.useCache ?? this.useCache);
        const selection = sources.find(candidate => candidate.source === result.source)!;
        return {
            ...result,
            ...(selection.version === undefined ? {} : { version: selection.version }),
            ...(selection.baseSource === undefined ? {} : { baseSource: selection.baseSource }),
        };
    }

    /**
     * 获取单个组件完整元数据。
     */
    public async fetchItem(specifier: string, options?: FetchItemOptions): Promise<RegistryItem> {
        const { item } = await this.fetchItemWithMeta(specifier, options);
        return item;
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

    private selectSource(baseSource: string, version?: string): RegistrySourceSelection {
        if (!version || version === 'latest' || !isHttpUrl(baseSource)
            || DEFAULT_REGISTRY_SOURCES.some(source => source === baseSource.replace(/\/+$/, ''))) {
            return { source: baseSource };
        }

        const tag = normalizeRegistryTag(version);
        const releasePath = /\/releases\/(?:latest\/download|download\/[^/]+)(?=\/|$)/;
        const rawPath = baseSource.match(GITHUB_RAW_URL_PATTERN);
        let source: string;
        if (releasePath.test(baseSource)) {
            source = baseSource.replace(releasePath, `/releases/download/${tag}`);
        } else if (rawPath) {
            const [, owner, repo, , rest] = rawPath;
            source = `https://raw.githubusercontent.com/${owner}/${repo}/${tag}/${rest}`;
        } else {
            const versionPath = /\/v?\d+\.\d+(\.\d+)?(-[a-zA-Z0-9._-]+)?$/;
            const trimmed = baseSource.replace(/\/+$/, '');
            source = versionPath.test(trimmed) ? trimmed.replace(versionPath, `/${tag}`) : `${trimmed}/${tag}`;
        }

        return { source, version, baseSource };
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
                if (!isSignalCancellation(err, signal)) {
                    this.tracker.recordFailure(source);
                }
                throw err;
            }
        }

        const rankedSources = this.tracker.rankSources([...sources]);
        const raceResult = await hedgedRace<RegistryItem>(
            rankedSources,
            async (source, sourceSignal) => {
                const attemptStartedAt = Date.now();
                try {
                    return await this.fetchSingleSource(name, source, { ...options, signal: sourceSignal ?? signal });
                } catch (err) {
                    if (isSignalCancellation(err, signal)) {
                        throw err;
                    }
                    if (
                        sourceSignal.reason instanceof HedgedRaceWinnerAbort &&
                        isSignalCancellation(err, sourceSignal)
                    ) {
                        this.tracker.recordCanceledByWinner(source, Date.now() - attemptStartedAt);
                    } else {
                        this.tracker.recordFailure(source);
                    }
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
        let localDir = source;
        if (localDir.startsWith('file://')) {
            try {
                localDir = fileURLToPath(localDir);
            } catch {
                localDir = localDir.replace(/^file:\/\//, '');
            }
        }
        const sourceResolved = path.resolve(localDir);
        const filePath = path.resolve(localDir, `${name}.json`);

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
        }
        const cachedVersionMatches = !currentRegistryVersion || !cachedEntry ||
            cachedEntry.registryVersion === currentRegistryVersion;

        if (cachedEntry) {
            const offlineOk = this.offline && cachedVersionMatches;
            const onlineFresh = !cachedEntry.expired && cachedVersionMatches;

            if (offlineOk || onlineFresh) {
                if (offlineOk) {
                    logger.info(`[OFFLINE CACHE HIT] ${name} (source: ${source})`);
                }
                this.verifyManifestItemCrossCheck(cachedEntry.data, name, manifestSummary);
                this.validateItemIntegrity(cachedEntry.data, name);
                return cachedEntry.data;
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

        if (effectiveUseCache && cachedEntry && cachedVersionMatches) {
            if (cachedEntry.etag) headers['If-None-Match'] = cachedEntry.etag;
            if (cachedEntry.lastModified) headers['If-Modified-Since'] = cachedEntry.lastModified;
        }

        let res = await this.fetcher(url, { headers, signal });

        if (res.status === 304 && cachedEntry && cachedVersionMatches) {
            await this.cache.touch(name, source);
            this.verifyManifestItemCrossCheck(cachedEntry.data, name, manifestSummary);
            this.validateItemIntegrity(cachedEntry.data, name);
            return cachedEntry.data;
        }

        if (res.status === 304 && cachedEntry && !cachedVersionMatches) {
            res = await this.fetcher(url, { headers: buildAuthHeaders(source), signal });
        }

        if (res.status === 304) {
            throw new CliError(`Registry returned 304 without a matching cached component "${name}".`, {
                code: 'REGISTRY_FETCH_FAILED',
            });
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
     * 获取指定源的不可变快照（操作级会话冻结）。
     */
    public async getSnapshot(source?: string, signal?: AbortSignal): Promise<RegistrySnapshot | null> {
        const targetSource = source ?? this.sources[0];
        if (!targetSource) return null;
        const summary = await this.fetchManifestSummary(targetSource, signal);
        if (!summary) return null;
        return {
            source: targetSource,
            resolvedUrl: targetSource,
            name: summary.name ?? 'brutx-ui-vue',
            schemaVersion: summary.schemaVersion ?? 1,
            registryVersion: summary.registryVersion,
            releaseTag: summary.releaseTag ?? `v${summary.registryVersion}`,
            gitCommit: summary.gitCommit ?? null,
            digest: summary.digest ?? summary.integrity,
            itemCount: summary.itemCount ?? (summary.itemIntegrities ? Object.keys(summary.itemIntegrities).length : 0),
            itemIntegrities: new Map(Object.entries(summary.itemIntegrities ?? {})),
            trusted: summary.trusted ?? false,
        };
    }

    /**
     * 拉取与校验 Manifest 摘要（操作级会话单次拉取并冻结）。
     */
    private async fetchManifestSummary(source: string, signal?: AbortSignal): Promise<ManifestSummaryInternal | null> {
        if (this.manifestCache.has(source)) {
            return this.manifestCache.get(source)!;
        }

        const fetchAndFreeze: (requestSignal?: AbortSignal) => Promise<ManifestSummaryInternal | null> = async (requestSignal?: AbortSignal): Promise<ManifestSummaryInternal | null> => {
            const result: ManifestSummaryInternal | null = await this.doFetchManifestSummary(source, requestSignal);
            if (!this.manifestCache.has(source)) {
                this.manifestCache.set(source, result);
            }
            return this.manifestCache.get(source)!;
        };

        if (signal) {
            return fetchAndFreeze(signal);
        }

        if (this.inflightManifests.has(source)) {
            return await this.inflightManifests.get(source)!;
        }

        const fetchPromise: Promise<ManifestSummaryInternal | null> = (async (): Promise<ManifestSummaryInternal | null> => {
            try {
                return await fetchAndFreeze();
            } finally {
                this.inflightManifests.delete(source);
            }
        })();

        this.inflightManifests.set(source, fetchPromise);
        return await fetchPromise;
    }

    private async doFetchManifestSummary(source: string, signal?: AbortSignal): Promise<ManifestSummaryInternal | null> {
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
                return null;
            }
            const manifest = await res.json() as {
                name?: string;
                schemaVersion?: number;
                registryVersion?: string;
                releaseTag?: string;
                gitCommit?: string | null;
                digest?: string;
                integrity?: string;
                signature?: string;
                keyId?: string;
                itemCount?: number;
                items?: Record<string, { integrity?: string }>;
            };

            if (typeof manifest.registryVersion !== 'string' || manifest.registryVersion.length === 0) {
                if (this.requireSignature) {
                    throw new CliError('Strict signature verification failed: manifest missing registryVersion.', {
                        code: 'REGISTRY_SIGNATURE_INVALID',
                    });
                }
                return null;
            }
            if (typeof manifest.integrity !== 'string' || manifest.integrity.length === 0) {
                if (this.requireSignature) {
                    throw new CliError('Strict signature verification failed: manifest missing integrity.', {
                        code: 'REGISTRY_SIGNATURE_INVALID',
                    });
                }
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
                name: manifest.name,
                schemaVersion: manifest.schemaVersion,
                registryVersion: manifest.registryVersion,
                releaseTag: manifest.releaseTag ?? (manifest.registryVersion ? `v${manifest.registryVersion}` : undefined),
                gitCommit: manifest.gitCommit ?? null,
                digest: manifest.digest ?? manifest.integrity,
                integrity: manifest.integrity,
                itemCount: manifest.itemCount,
                itemIntegrities: Object.keys(itemIntegrities).length > 0 ? itemIntegrities : undefined,
                trusted: signatureValid,
            };
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
        effectiveUseCache: boolean,
    ): Promise<{ item: RegistryItem; source: string }> {
        const cacheMode = effectiveUseCache ? isRegistryCacheReadOnly() ? 'read-only' : 'read-write' : 'disabled';
        const key: string = `${name}::${sourceKey}::cache=${cacheMode}`;
        const existing: Promise<{ item: RegistryItem; source: string }> | undefined = this.inflightItems.get(key);
        if (existing) {
            return existing;
        }

        const promise: Promise<{ item: RegistryItem; source: string }> = fn().finally(() => {
            this.inflightItems.delete(key);
        });

        this.inflightItems.set(key, promise);
        return promise;
    }

    /**
     * 并发加载依赖图并执行拓扑排序，被依赖组件排在依赖它们的组件之前。
     */
    public async resolve(
        specifiers: readonly string[],
        options?: FetchItemOptions,
    ): Promise<ResolvedComponentPlan> {
        const resolved: RegistryItem[] = [];
        const hitSources = new Map<string, string>();
        const dependencies = new Set<string>();
        const devDependencies = new Set<string>();
        const registryDependencies = new Set<string>();

        interface ResolvedNode {
            readonly request: RegistryItemRequest;
            readonly snapshot: RegistryItemSnapshot;
            readonly dependencies: RegistryItemRequest[];
        }

        interface TraversalFrame {
            readonly key: string;
            dependencyIndex: number;
        }

        const pins = new Map<string, RegistryItemRequest>();
        const registerPin = (request: RegistryItemRequest): void => {
            if (!request.requestedTag) return;
            const previous = pins.get(request.name);
            assertMatchingRegistryTags(request.name, previous?.requestedTag, request.requestedTag);
            if (!previous) pins.set(request.name, request);
        };
        const selectRequest = (request: RegistryItemRequest) => pins.get(request.name) ?? request;
        const rootRequests = Array.from(
            collectRegistryComponentRequests(specifiers).values(),
            specifier => this.createItemRequest(specifier, options),
        );
        rootRequests.forEach(registerPin);

        const nodes = new Map<string, ResolvedNode>();
        // 更深层的依赖可以指定版本，先保留读取错误，最终只报告选中路径上的错误。
        const loadErrors = new Map<string, unknown>();
        const loadNode = async (request: RegistryItemRequest): Promise<ResolvedNode> => {
            const snapshot = await this.fetchRequest(request, options);
            const { item, ...parent } = snapshot;
            const dependencies = item.registryDependencies.map(specifier =>
                this.createItemRequest(parseComponentSpecifier(specifier), options, parent),
            );
            return { request, snapshot, dependencies };
        };

        let pending = rootRequests;
        while (pending.length > 0) {
            const requestsByKey = new Map<string, RegistryItemRequest>();
            for (const candidate of pending) {
                const request = selectRequest(candidate);
                if (!nodes.has(request.key) && !loadErrors.has(request.key)) {
                    requestsByKey.set(request.key, request);
                }
            }
            const requests = [...requestsByKey.values()];
            const results = await Promise.allSettled(requests.map(loadNode));
            options?.signal?.throwIfAborted();
            const loaded: ResolvedNode[] = [];
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    loadErrors.set(requests[index]!.key, result.reason);
                    return;
                }
                const node = result.value;
                nodes.set(node.request.key, node);
                loaded.push(node);
                if (selectRequest(node.request).key === node.request.key) node.dependencies.forEach(registerPin);
            });
            pending = loaded.flatMap(node =>
                selectRequest(node.request).key === node.request.key ? node.dependencies : [selectRequest(node.request)],
            );
        }

        const visited: Set<string> = new Set();
        const activePath: string[] = [];
        const activePathIndices: Map<string, number> = new Map();
        const itemSnapshots = new Map<string, RegistryItemSnapshot>();

        for (const root of rootRequests) {
            const rootKey = selectRequest(root).key;
            if (visited.has(rootKey)) {
                continue;
            }

            const traversal: TraversalFrame[] = [{ key: rootKey, dependencyIndex: 0 }];
            activePathIndices.set(rootKey, 0);
            activePath.push(rootKey);

            while (traversal.length > 0) {
                const frame: TraversalFrame = traversal[traversal.length - 1]!;
                if (loadErrors.has(frame.key)) throw loadErrors.get(frame.key);
                const node = nodes.get(frame.key)!;

                if (frame.dependencyIndex < node.dependencies.length) {
                    const dependencyKey = selectRequest(node.dependencies[frame.dependencyIndex]!).key;
                    frame.dependencyIndex += 1;

                    const cycleStartIndex: number | undefined = activePathIndices.get(dependencyKey);
                    if (cycleStartIndex !== undefined) {
                        const cycleKeys: string[] = [...activePath.slice(cycleStartIndex), dependencyKey];
                        const cycleNames: string[] = cycleKeys.map(
                            (key: string): string => nodes.get(key)!.snapshot.item.name,
                        );
                        throw new CliError(
                            `Circular dependency detected: ${cycleNames.join(' -> ')}`,
                            { code: 'INVALID_REGISTRY' },
                        );
                    }

                    if (visited.has(dependencyKey)) {
                        continue;
                    }

                    activePathIndices.set(dependencyKey, activePath.length);
                    activePath.push(dependencyKey);
                    traversal.push({ key: dependencyKey, dependencyIndex: 0 });
                    continue;
                }

                const { snapshot } = node;
                const { item } = snapshot;
                if (!itemSnapshots.has(item.name)) {
                    resolved.push(item);
                    hitSources.set(item.name, snapshot.source);
                    itemSnapshots.set(item.name, snapshot);
                }

                item.registryDependencies.forEach(dependency => registryDependencies.add(dependency));
                (item.dependencies ?? []).forEach((dependency: string): void => {
                    dependencies.add(dependency);
                });
                (item.devDependencies ?? []).forEach((dependency: string): void => {
                    devDependencies.add(dependency);
                });

                visited.add(frame.key);
                activePathIndices.delete(frame.key);
                activePath.pop();
                traversal.pop();
            }
        }

        return {
            items: resolved,
            hitSources,
            itemSnapshots,
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
