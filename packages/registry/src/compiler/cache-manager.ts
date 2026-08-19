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

    private async resolveExtension(rawFileName: string, baseDir: string): Promise<string> {
        if (path.extname(rawFileName)) return rawFileName;
        if (await this.fs.pathExists(path.join(baseDir, `${rawFileName}.vue`))) return `${rawFileName}.vue`;
        if (await this.fs.pathExists(path.join(baseDir, `${rawFileName}.ts`))) return `${rawFileName}.ts`;
        return rawFileName;
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

        const addComponentFile = async (rawName: string): Promise<void> => {
            const fileName = await this.resolveExtension(rawName, path.join(paths.componentsDir, name));
            const filePath = path.join(paths.componentsDir, name, fileName);
            if (!(await this.fs.pathExists(filePath))) {
                throw new Error(`Source file not found: ${filePath}`);
            }
            const code = await this.readSource(filePath);
            parts.push(code);
            const rewritten = rewriteImports(code, name, 'component');

            for (const d of extractComponentFileDeps(rewritten, name)) {
                componentDeps.add(await this.resolveExtension(d, path.join(paths.componentsDir, name)));
            }
            for (const d of extractDeps(rewritten, 'composables')) {
                composableDeps.add(await this.resolveExtension(d, paths.composablesDir));
            }
            for (const d of extractDeps(rewritten, 'locales')) {
                localeDeps.add(await this.resolveExtension(d, paths.localesDir));
            }
            for (const d of extractDeps(rewritten, 'lib')) {
                libDeps.add(await this.resolveExtension(d, paths.libDir));
            }

            addedComponentDeps.add(rawName);
            addedComponentDeps.add(fileName);
        };

        const addComposableFile = async (rawName: string): Promise<void> => {
            const composableName = await this.resolveExtension(rawName, paths.composablesDir);
            const composablePath = path.join(paths.composablesDir, composableName);
            if (!(await this.fs.pathExists(composablePath))) {
                throw new Error(`Composable file not found: ${composablePath}`);
            }
            const code = await this.readSource(composablePath);
            parts.push(code);
            const rewritten = rewriteImports(code, name, 'composable');

            for (const d of extractDeps(rewritten, 'composables')) {
                composableDeps.add(await this.resolveExtension(d, paths.composablesDir));
            }
            for (const d of extractDeps(rewritten, 'locales')) {
                localeDeps.add(await this.resolveExtension(d, paths.localesDir));
            }
            for (const d of extractDeps(rewritten, 'lib')) {
                libDeps.add(await this.resolveExtension(d, paths.libDir));
            }

            addedComposableDeps.add(rawName);
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
            for (const rawName of pending) {
                const directiveName = await this.resolveExtension(rawName, paths.directivesDir);
                const directivePath = path.join(paths.directivesDir, directiveName);
                if (!(await this.fs.pathExists(directivePath))) {
                    throw new Error(`Directive file not found: ${directivePath}`);
                }
                const code = await this.readSource(directivePath);
                parts.push(code);
                const rewritten = rewriteImports(code, name, 'directive');

                for (const d of extractDeps(rewritten, 'composables')) {
                    composableDeps.add(await this.resolveExtension(d, paths.composablesDir));
                }
                for (const d of extractDeps(rewritten, 'locales')) {
                    localeDeps.add(await this.resolveExtension(d, paths.localesDir));
                }
                for (const d of extractDeps(rewritten, 'lib')) {
                    libDeps.add(await this.resolveExtension(d, paths.libDir));
                }
                for (const d of extractDeps(rewritten, 'directives')) {
                    directiveDeps.add(await this.resolveExtension(d, paths.directivesDir));
                }

                addedDirectiveDeps.add(rawName);
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
            for (const rawLocaleName of pendingLocales) {
                const localeName = await this.resolveExtension(rawLocaleName, paths.localesDir);
                const localePath = path.join(paths.localesDir, localeName);
                if (await this.fs.pathExists(localePath)) {
                    const code = await this.readSource(localePath);
                    parts.push(code);
                    const rewritten = rewriteImports(code, name, 'locale');
                    for (const d of extractDeps(rewritten, 'locales')) {
                        localeDeps.add(await this.resolveExtension(d, paths.localesDir));
                    }
                    for (const d of extractDeps(rewritten, 'composables')) {
                        composableDeps.add(await this.resolveExtension(d, paths.composablesDir));
                    }
                    for (const d of extractDeps(rewritten, 'lib')) {
                        libDeps.add(await this.resolveExtension(d, paths.libDir));
                    }
                }
                addedLocaleDeps.add(rawLocaleName);
                addedLocaleDeps.add(localeName);
            }
        }

        for (const rawLibName of libDeps) {
            const libName = await this.resolveExtension(rawLibName, paths.libDir);
            const libPath = path.join(paths.libDir, libName);
            if (!(await this.fs.pathExists(libPath))) {
                throw new Error(`Lib file not found: ${libPath}`);
            }
            const code = await this.readSource(libPath);
            const rewritten = rewriteImports(code, name, 'lib');
            for (const d of extractDeps(rewritten, 'lib')) {
                libDeps.add(await this.resolveExtension(d, paths.libDir));
            }

            if (libExclude.has(libName)) continue;
            parts.push(code);
        }

        return crypto.createHash('sha256').update(parts.join('\0')).digest('hex');
    }
}
