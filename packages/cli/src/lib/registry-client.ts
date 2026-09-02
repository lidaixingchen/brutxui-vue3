import path from 'path';
import { DiskFileSystemAdapter, type FileSystemAdapter } from 'brutx-shared-vue/fs';
import {
    RegistryIntegrityMismatchError,
    validateRegistryItem,
} from 'brutx-shared-vue';
import type { RegistryItem, RegistryManifestSummary, TrustedPublicKey } from './types.js';
import {
    DEFAULT_REGISTRY_URL,
    DEFAULT_REGISTRY_SOURCES,
} from './constants.js';
import { CliError } from './error.js';
import { logger } from './logger.js';
import { createDefaultCacheStorage, isOfflineMode, type CacheStorage, type CacheReadResult } from './cache.js';
import { resilientFetch } from './resilience/resilient-fetch.js';
import { RegistrySourceTracker } from './resilience/source-tracker.js';
import { hedgedRace } from './resilience/hedged-race.js';
import { buildAuthHeaders } from './registry-source.js';
import { verifyManifestIntegrityAndSignature, loadTrustedPublicKeys } from './signature.js';
import type {
    RegistryClientOptions,
    ResolvedDependenciesResult,
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
    private readonly inflightItems = new Map<string, Promise<RegistryItem>>();

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
     * 获取单个组件完整元数据。
     */
    public async fetchItem(specifier: string, options?: FetchItemOptions): Promise<RegistryItem> {
        const { name, version } = this.parseSpecifier(specifier);
        this.assertSafeComponentName(name);

        const targetSources = options?.sourceOverride
            ? [options.sourceOverride]
            : this.sources;

        // 如果包含版本，根据说明符转换源 URL
        const effectiveSources = targetSources.map(source => this.resolveVersionedSource(source, version));

        return this.dedupeInflight(name, effectiveSources.join(','), async () => {
            const { item } = await this.fetchWithSourcesPipeline(
                name,
                effectiveSources,
                options?.signal,
            );
            return item;
        });
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
        signal?: AbortSignal,
    ): Promise<{ item: RegistryItem; source: string }> {
        if (sources.length === 0) {
            throw new CliError('No registry source available.', { code: 'REGISTRY_FETCH_FAILED' });
        }

        if (this.offline) {
            let firstError: CliError | null = null;
            for (const source of sources) {
                try {
                    const item = await this.fetchSingleSource(name, source, signal);
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
            const item = await this.fetchSingleSource(name, source, signal);
            return { item, source };
        }

        const rankedSources = this.tracker.rankSources([...sources]);
        const raceResult = await hedgedRace<RegistryItem>(
            rankedSources,
            async (source, sourceSignal) => {
                return await this.fetchSingleSource(name, source, sourceSignal ?? signal);
            },
            { parentSignal: signal },
        );

        this.tracker.recordSuccess(raceResult.winningSource, raceResult.durationMs);

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
        signal?: AbortSignal,
    ): Promise<RegistryItem> {
        if (isHttpUrl(source)) {
            return await this.fetchRemoteHttp(name, source, signal);
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
        signal?: AbortSignal,
    ): Promise<RegistryItem> {
        let cachedEntry: CacheReadResult<RegistryItem> | null = null;
        let manifestSummary: ManifestSummaryInternal | null = null;
        let currentRegistryVersion: string | undefined;

        if (!this.offline) {
            manifestSummary = await this.fetchManifestSummary(source, signal);
            currentRegistryVersion = manifestSummary?.registryVersion;
        }

        if (this.useCache) {
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

        if (this.useCache && cachedEntry) {
            if (cachedEntry.etag) headers['If-None-Match'] = cachedEntry.etag;
            if (cachedEntry.lastModified) headers['If-Modified-Since'] = cachedEntry.lastModified;
        }

        const res = await this.fetcher(url, { headers, signal });

        if (res.status === 304 && cachedEntry) {
            await this.cache.touch(name, source);
            this.verifyManifestItemCrossCheck(cachedEntry.data, name, manifestSummary);
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

        if (this.useCache) {
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
                this.manifestCache.set(source, null);
                return null;
            }
            if (typeof manifest.integrity !== 'string' || manifest.integrity.length === 0) {
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
    private dedupeInflight<T extends RegistryItem>(name: string, sourceKey: string, fn: () => Promise<T>): Promise<T> {
        const key = `${name}::${sourceKey}`;
        const existing = this.inflightItems.get(key);
        if (existing) {
            return existing as Promise<T>;
        }

        const promise = fn().finally(() => {
            this.inflightItems.delete(key);
        });

        this.inflightItems.set(key, promise);
        return promise;
    }

    /**
     * 拓扑解析与依赖展开（Ticket 3 实现完整版，此处先提供接口占位）。
     */
    public async resolveDependencies(
        specifiers: readonly string[],
        options?: FetchItemOptions,
    ): Promise<ResolvedDependenciesResult> {
        // 先拉取直接指定的组件
        const items: RegistryItem[] = [];
        const hitSources = new Map<string, string>();
        const dependencies = new Set<string>();
        const devDependencies = new Set<string>();

        for (const specifier of specifiers) {
            const item = await this.fetchItem(specifier, options);
            items.push(item);
            hitSources.set(item.name, this.sources[0]);
            item.dependencies?.forEach((dep: string) => dependencies.add(dep));
            const itemDevDeps = (item as unknown as Record<string, unknown>).devDependencies;
            if (Array.isArray(itemDevDeps)) {
                itemDevDeps.forEach((dep: unknown) => {
                    if (typeof dep === 'string') devDependencies.add(dep);
                });
            }
        }

        return {
            items,
            hitSources,
            dependencies: Array.from(dependencies),
            devDependencies: Array.from(devDependencies),
        };
    }

    /**
     * 枚举组件名称（Ticket 3 实现完整版，此处先提供接口占位）。
     */
    public async listComponents(options?: ListComponentsOptions): Promise<readonly string[]> {
        const targetSource = options?.source ?? this.sources[0];
        if (isHttpUrl(targetSource)) {
            throw new CliError('Remote registry does not support listing components.', {
                code: 'REGISTRY_LIST_UNSUPPORTED',
            });
        }

        const entries = await this.fs.readdir(targetSource);
        return entries
            .filter(f => f.endsWith('.json') && !f.startsWith('registry-') && f !== 'index.json')
            .map(f => f.replace(/\.json$/, ''))
            .sort();
    }
}
