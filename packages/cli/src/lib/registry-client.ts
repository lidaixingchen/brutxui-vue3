import path from 'path';
import { fileURLToPath } from 'node:url';
import { DiskFileSystemAdapter, type FileSystemAdapter } from './fs/index.js';
import {
    RegistryIntegrityMismatchError,
    validateRegistryItem,
} from 'brutx-shared-vue';
import type { RegistryItem, RegistryManifestSummary, RegistrySnapshot, TrustedPublicKey } from './types.js';
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
    ): Promise<{ item: RegistryItem; source: string }> {
        const { name, version } = this.parseSpecifier(specifier);
        this.assertSafeComponentName(name);

        const targetSources = options?.sourceOverride
            ? [options.sourceOverride]
            : this.sources;

        // 如果包含版本，根据说明符转换源 URL
        const effectiveSources: string[] = targetSources.map((source: string): string => this.resolveVersionedSource(source, version));
        const sourceKey: string = effectiveSources.join(',');

        if (options?.signal) {
            return this.fetchWithSourcesPipeline(name, effectiveSources, options);
        }

        return this.dedupeInflight(name, sourceKey, (): Promise<{ item: RegistryItem; source: string }> => {
            return this.fetchWithSourcesPipeline(name, effectiveSources, options);
        }, options?.useCache ?? this.useCache);
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

        const normalizedTag = version.startsWith('v') ? version : `v${version}`;

        // 1. GitHub Releases 资产路径: releases/latest/download -> releases/download/<tag>
        if (baseSource.includes('/releases/latest/download')) {
            return baseSource.replace('/releases/latest/download', `/releases/download/${normalizedTag}`);
        }

        // 2. GitHub Raw URL: https://raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>
        const match = baseSource.match(GITHUB_RAW_URL_PATTERN);
        if (match) {
            const [, owner, repo, , rest] = match;
            return `https://raw.githubusercontent.com/${owner}/${repo}/${normalizedTag}/${rest}`;
        }

        // 3. 通用 HTTP 注册表源带版本路径 (如 https://registry.brutxui.com 或 https://registry.brutxui.com/v0.11.0)
        if (isHttpUrl(baseSource)) {
            let trimmed = baseSource;
            while (trimmed.endsWith('/')) {
                trimmed = trimmed.slice(0, -1);
            }
            if (/\/v?\d+\.\d+(\.\d+)?(-[a-zA-Z0-9._-]+)?$/.test(trimmed)) {
                return trimmed.replace(/\/v?\d+\.\d+(\.\d+)?(-[a-zA-Z0-9._-]+)?$/, `/${normalizedTag}`);
            }
            return `${trimmed}/${normalizedTag}`;
        }

        return baseSource;
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
        const key: string = `${name}::${sourceKey}::cache=${effectiveUseCache}`;
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

        const targetSources: readonly string[] = options?.sourceOverride
            ? [options.sourceOverride]
            : this.sources;

        interface DependencyRequest {
            readonly key: string;
            readonly specifier: string;
            readonly sourceOverride?: string;
        }

        interface ResolvedNode {
            readonly key: string;
            readonly item: RegistryItem;
            readonly source: string;
        }

        interface TraversalFrame {
            readonly key: string;
            dependencyIndex: number;
        }

        const createRequest: (specifier: string, parentSource?: string) => DependencyRequest = (specifier: string, parentSource?: string): DependencyRequest => {
            const parsedSpecifier: { name: string; version?: string } = this.parseSpecifier(specifier);
            const cleanName: string = parsedSpecifier.name;
            const version: string | undefined = parsedSpecifier.version;
            this.assertSafeComponentName(cleanName);

            const effectiveSources: string[] = (parentSource ? [parentSource] : targetSources)
                .map((source: string): string => this.resolveVersionedSource(source, version));
            const sourceKey: string = effectiveSources.join(',');
            return {
                key: `${cleanName}::${sourceKey}`,
                specifier,
                sourceOverride: parentSource ?? options?.sourceOverride,
            };
        };

        const rootRequests: DependencyRequest[] = specifiers.map(
            (specifier: string): DependencyRequest => createRequest(specifier),
        );
        const rootKeys: string[] = rootRequests.map(
            (request: DependencyRequest): string => request.key,
        );
        const nodes: Map<string, ResolvedNode> = new Map();
        const dependencyKeysByNode: Map<string, readonly string[]> = new Map();
        let pending: DependencyRequest[] = [...rootRequests];

        const loadNode: (request: DependencyRequest) => Promise<ResolvedNode> = (request: DependencyRequest): Promise<ResolvedNode> => {
            const fetchOptions: FetchItemOptions = {
                ...options,
                ...(request.sourceOverride ? { sourceOverride: request.sourceOverride } : {}),
            };
            return this.fetchItemWithMeta(
                request.specifier,
                fetchOptions,
            ).then(({ item, source }: { item: RegistryItem; source: string }): ResolvedNode => ({
                key: request.key,
                item,
                source,
            }));
        };

        while (pending.length > 0) {
            const requestsByKey: Map<string, DependencyRequest> = new Map();
            for (let requestIndex: number = 0; requestIndex < pending.length; requestIndex += 1) {
                const request: DependencyRequest = pending[requestIndex]!;
                if (!nodes.has(request.key) && !requestsByKey.has(request.key)) {
                    requestsByKey.set(request.key, request);
                }
            }
            pending = [];

            const loadedNodes: ResolvedNode[] = await Promise.all(
                Array.from(requestsByKey.values(), loadNode),
            );

            for (let nodeIndex: number = 0; nodeIndex < loadedNodes.length; nodeIndex += 1) {
                const node: ResolvedNode = loadedNodes[nodeIndex]!;
                nodes.set(node.key, node);
                hitSources.set(node.item.name, node.source);

                const dependencyRequests: DependencyRequest[] = node.item.registryDependencies.map(
                    (specifier: string): DependencyRequest => createRequest(specifier, node.source),
                );
                dependencyKeysByNode.set(
                    node.key,
                    dependencyRequests.map((request: DependencyRequest): string => request.key),
                );

                node.item.registryDependencies.forEach((dependency: string): void => {
                    registryDependencies.add(dependency);
                });
                for (
                    let dependencyIndex: number = 0;
                    dependencyIndex < dependencyRequests.length;
                    dependencyIndex += 1
                ) {
                    const dependencyRequest: DependencyRequest = dependencyRequests[dependencyIndex]!;
                    if (!nodes.has(dependencyRequest.key)) {
                        pending.push(dependencyRequest);
                    }
                }
            }
        }

        const visited: Set<string> = new Set();
        const activePath: string[] = [];
        const activePathIndices: Map<string, number> = new Map();
        const resolvedNames: Set<string> = new Set();

        for (let rootIndex: number = 0; rootIndex < rootKeys.length; rootIndex += 1) {
            const rootKey: string = rootKeys[rootIndex]!;
            if (visited.has(rootKey)) {
                continue;
            }

            const traversal: TraversalFrame[] = [{ key: rootKey, dependencyIndex: 0 }];
            activePathIndices.set(rootKey, 0);
            activePath.push(rootKey);

            while (traversal.length > 0) {
                const frame: TraversalFrame = traversal[traversal.length - 1]!;
                const dependencyKeys: readonly string[] = dependencyKeysByNode.get(frame.key) ?? [];

                if (frame.dependencyIndex < dependencyKeys.length) {
                    const dependencyKey: string = dependencyKeys[frame.dependencyIndex]!;
                    frame.dependencyIndex += 1;

                    const cycleStartIndex: number | undefined = activePathIndices.get(dependencyKey);
                    if (cycleStartIndex !== undefined) {
                        const cycleKeys: string[] = [...activePath.slice(cycleStartIndex), dependencyKey];
                        const cycleNames: string[] = cycleKeys.map(
                            (key: string): string => nodes.get(key)!.item.name,
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

                const node: ResolvedNode = nodes.get(frame.key)!;
                if (!resolvedNames.has(node.item.name)) {
                    resolved.push(node.item);
                    resolvedNames.add(node.item.name);
                }

                (node.item.dependencies ?? []).forEach((dependency: string): void => {
                    dependencies.add(dependency);
                });
                (node.item.devDependencies ?? []).forEach((dependency: string): void => {
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
