import crypto from 'node:crypto';
import {
    DEFAULT_LIB_EXCLUDE,
    type MergedRegistryEntry,
} from 'brutx-shared-vue';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import {
    DependencyResolver,
    type ResolvedComponentClosure,
} from './dependency-resolver.js';
import type {
    ComponentIndexBuilder,
    CompilerPaths,
    PublicComponentProjection,
} from './types.js';
import type { ModuleResolver } from 'brutx-shared-vue/module-resolver';

export const CACHE_VERSION = 4;

export interface SourceHashOptions {
    closure?: ResolvedComponentClosure;
    knownComponents?: Set<string>;
    publicProjection?: PublicComponentProjection;
    publicProjectionDigest?: string;
    manifestDigest?: string;
    componentIndexBuilder?: ComponentIndexBuilder;
    moduleResolver?: ModuleResolver;
}

function stableSerialize(value: unknown): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;

    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
        .sort()
        .map(key => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
        .join(',')}}`;
}

export function computeInputDigest(value: unknown): string {
    return crypto.createHash('sha256').update(stableSerialize(value)).digest('hex');
}

export class CacheManager {
    constructor(
        private fs: FileSystemAdapter,
        private cacheFilePath: string
    ) {}

    public async loadCache(): Promise<Record<string, string>> {
        try {
            if (await this.fs.pathExists(this.cacheFilePath)) {
                return await this.fs.readJson<Record<string, string>>(this.cacheFilePath);
            }
        } catch {
            // 缓存读取失败时平滑回退为空缓存
        }
        return {};
    }

    public async saveCache(cache: Record<string, string>): Promise<void> {
        await this.fs.writeJson(this.cacheFilePath, cache, { spaces: 2 });
    }

    public async computeSourceHash(
        name: string,
        fileMapping: { files: string[]; composables?: string[]; directives?: string[] },
        componentInfo: MergedRegistryEntry | undefined,
        tailwindConfig: Record<string, unknown> | undefined,
        cssVars: Record<string, string> | undefined,
        paths: CompilerPaths,
        libExclude: ReadonlySet<string> = DEFAULT_LIB_EXCLUDE,
        options: SourceHashOptions = {},
    ): Promise<string> {
        const projectionDigest = options.publicProjectionDigest
            ?? computeInputDigest(options.publicProjection ?? null);
        const descriptor = {
            cacheVersion: CACHE_VERSION,
            componentInfo: componentInfo ?? null,
            fileMapping,
            tailwind: tailwindConfig ?? {},
            cssVars: cssVars ?? {},
        };

        const resolver = new DependencyResolver(
            this.fs,
            paths,
            libExclude,
            options.componentIndexBuilder,
            options.moduleResolver,
        );
        if (!options.closure && !options.publicProjection) {
            throw new Error(`Public component projection is required to hash Registry component "${name}"`);
        }
        const closure = options.closure ?? await resolver.resolveComponentClosure(
            name,
            componentInfo ?? ({ ...fileMapping } as MergedRegistryEntry),
            options.knownComponents,
            options.publicProjection,
        );

        const files = [...closure.files]
            .sort((a, b) => a.path.localeCompare(b.path))
            .map(file => ({
                path: file.path,
                type: file.type,
                content: file.content,
            }));

        return crypto.createHash('sha256').update(stableSerialize({
            descriptor,
            manifestDigest: options.manifestDigest ?? null,
            publicProjectionDigest: projectionDigest,
            registryDependencies: closure.registryDependencies,
            files,
        })).digest('hex');
    }
}
