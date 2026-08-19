import crypto from 'node:crypto';
import path from 'node:path';
import {
    buildComponentIndexContent,
} from 'brutx-shared-vue/scan';
import type { MergedRegistryEntry } from 'brutx-shared-vue';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import {
    extractComponentFileDeps,
    extractDeps,
    rewriteImports,
} from './ast-rewriter.js';
import type { CompilerPaths } from './types.js';

export const CACHE_VERSION = 4;

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

    private async readSource(filePath: string): Promise<string> {
        const raw = await this.fs.readFile(filePath, 'utf-8');
        return raw.replace(/\r\n/g, '\n');
    }

    public async computeSourceHash(
        name: string,
        fileMapping: { files: string[]; composables?: string[]; directives?: string[] },
        componentInfo: MergedRegistryEntry | undefined,
        tailwindConfig: Record<string, unknown> | undefined,
        cssVars: Record<string, string> | undefined,
        paths: CompilerPaths,
        libExclude: Set<string> = new Set(['utils.ts'])
    ): Promise<string> {
        const parts: string[] = [JSON.stringify({
            cacheVersion: CACHE_VERSION,
            componentInfo: componentInfo ?? null,
            fileMapping,
            tailwind: tailwindConfig ?? {},
            cssVars: cssVars ?? {},
        })];

        const componentDeps = new Set(fileMapping.files);
        const addedComponentDeps = new Set<string>();
        const composableDeps = new Set(fileMapping.composables ?? []);
        const addedComposableDeps = new Set<string>();
        const localeDeps = new Set<string>();
        const libDeps = new Set<string>();

        const addComponentFile = async (fileName: string): Promise<void> => {
            const filePath = path.join(paths.componentsDir, name, fileName);
            if (!(await this.fs.pathExists(filePath))) {
                throw new Error(`Source file not found: ${filePath}`);
            }
            const code = await this.readSource(filePath);
            parts.push(code);
            const rewritten = rewriteImports(code, name, 'component');
            extractComponentFileDeps(rewritten, name).forEach(d => componentDeps.add(d));
            extractDeps(rewritten, 'composables').forEach(d => composableDeps.add(d));
            extractDeps(rewritten, 'locales').forEach(d => localeDeps.add(d));
            extractDeps(rewritten, 'lib').forEach(d => libDeps.add(d));
            addedComponentDeps.add(fileName);
        };

        const addComposableFile = async (composableName: string): Promise<void> => {
            const composablePath = path.join(paths.composablesDir, composableName);
            if (!(await this.fs.pathExists(composablePath))) {
                throw new Error(`Composable file not found: ${composablePath}`);
            }
            const code = await this.readSource(composablePath);
            parts.push(code);
            const rewritten = rewriteImports(code, name, 'composable');
            extractDeps(rewritten, 'composables').forEach(d => composableDeps.add(d));
            extractDeps(rewritten, 'locales').forEach(d => localeDeps.add(d));
            extractDeps(rewritten, 'lib').forEach(d => libDeps.add(d));
            addedComposableDeps.add(composableName);
        };

        while (addedComponentDeps.size < componentDeps.size) {
            const pending = Array.from(componentDeps).filter(f => !addedComponentDeps.has(f));
            for (const fileName of pending) {
                await addComponentFile(fileName);
            }
        }

        // 派生 barrel 内容
        parts.push(buildComponentIndexContent(Array.from(componentDeps)));

        const directiveDeps = new Set<string>(fileMapping.directives ?? []);
        const addedDirectiveDeps = new Set<string>();
        while (addedDirectiveDeps.size < directiveDeps.size) {
            const pending = Array.from(directiveDeps).filter(d => !addedDirectiveDeps.has(d));
            for (const directiveName of pending) {
                const directivePath = path.join(paths.directivesDir, directiveName);
                if (!(await this.fs.pathExists(directivePath))) {
                    throw new Error(`Directive file not found: ${directivePath}`);
                }
                const code = await this.readSource(directivePath);
                parts.push(code);
                const rewritten = rewriteImports(code, name, 'directive');
                extractDeps(rewritten, 'composables').forEach(d => composableDeps.add(d));
                extractDeps(rewritten, 'locales').forEach(d => localeDeps.add(d));
                extractDeps(rewritten, 'lib').forEach(d => libDeps.add(d));
                extractDeps(rewritten, 'directives').forEach(d => directiveDeps.add(d));
                addedDirectiveDeps.add(directiveName);
            }
        }

        const addedLocaleDeps = new Set<string>();
        while (addedComposableDeps.size < composableDeps.size || addedLocaleDeps.size < localeDeps.size) {
            const pendingComposables = Array.from(composableDeps).filter(c => !addedComposableDeps.has(c));
            for (const composableName of pendingComposables) {
                await addComposableFile(composableName);
            }

            const pendingLocales = Array.from(localeDeps).filter(l => !addedLocaleDeps.has(l));
            for (const localeName of pendingLocales) {
                const localePath = path.join(paths.localesDir, localeName);
                if (await this.fs.pathExists(localePath)) {
                    const code = await this.readSource(localePath);
                    parts.push(code);
                    const rewritten = rewriteImports(code, name, 'locale');
                    extractDeps(rewritten, 'locales').forEach(d => localeDeps.add(d));
                    extractDeps(rewritten, 'composables').forEach(d => composableDeps.add(d));
                    extractDeps(rewritten, 'lib').forEach(d => libDeps.add(d));
                }
                addedLocaleDeps.add(localeName);
            }
        }

        for (const libName of libDeps) {
            const libPath = path.join(paths.libDir, libName);
            if (!(await this.fs.pathExists(libPath))) {
                throw new Error(`Lib file not found: ${libPath}`);
            }
            const code = await this.readSource(libPath);
            const rewritten = rewriteImports(code, name, 'lib');
            extractDeps(rewritten, 'lib').forEach(d => libDeps.add(d));

            if (libExclude.has(libName)) continue;
            parts.push(code);
        }

        return crypto.createHash('sha256').update(parts.join('\0')).digest('hex');
    }
}
