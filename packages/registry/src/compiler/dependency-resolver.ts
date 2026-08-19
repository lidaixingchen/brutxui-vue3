import path from 'node:path';
import {
    buildComponentIndexContent,
} from 'brutx-shared-vue/scan';
import type {
    MergedRegistryEntry,
    RegistryFile,
} from 'brutx-shared-vue';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import {
    assertKnownRegistryDeps,
    extractComponentFileDeps,
    extractDeps,
    extractRegistryDeps,
    getFileType,
    rewriteImports,
} from './ast-rewriter.js';
import type { CompilerPaths } from './types.js';

export interface ResolvedComponentClosure {
    files: RegistryFile[];
    registryDependencies: string[];
}

export class DependencyResolver {
    constructor(
        private fs: FileSystemAdapter,
        private paths: CompilerPaths,
        private libExclude: Set<string> = new Set(['utils.ts'])
    ) {}

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

    public async resolveComponentClosure(
        name: string,
        componentInfo: MergedRegistryEntry,
        knownComponents?: Set<string>
    ): Promise<ResolvedComponentClosure> {
        const allRegistryDeps = new Set<string>();
        const files: RegistryFile[] = [];
        const componentFileDeps = new Set(componentInfo.files);
        const composableDeps = new Set(componentInfo.composables ?? []);
        const localeDeps = new Set<string>();
        const libDeps = new Set<string>();

        const addedComponentFiles = new Set<string>();
        while (addedComponentFiles.size < componentFileDeps.size) {
            const pending = Array.from(componentFileDeps).filter(f => !addedComponentFiles.has(f));
            for (const rawName of pending) {
                const fileName = await this.resolveExtension(rawName, path.join(this.paths.componentsDir, name));
                const filePath = path.join(this.paths.componentsDir, name, fileName);
                if (!(await this.fs.pathExists(filePath))) {
                    throw new Error(`Source file not found at ${filePath}`);
                }

                let code = await this.readSource(filePath);
                code = rewriteImports(code, name, 'component', knownComponents);

                assertKnownRegistryDeps(code, name, fileName);
                extractRegistryDeps(code, name, knownComponents).forEach(d => allRegistryDeps.add(d));

                for (const d of extractComponentFileDeps(code, name)) {
                    const resolved = await this.resolveExtension(d, path.join(this.paths.componentsDir, name));
                    componentFileDeps.add(resolved);
                }
                for (const d of extractDeps(code, 'composables')) {
                    const resolved = await this.resolveExtension(d, this.paths.composablesDir);
                    composableDeps.add(resolved);
                }
                for (const d of extractDeps(code, 'locales')) {
                    const resolved = await this.resolveExtension(d, this.paths.localesDir);
                    localeDeps.add(resolved);
                }
                for (const d of extractDeps(code, 'lib')) {
                    const resolved = await this.resolveExtension(d, this.paths.libDir);
                    libDeps.add(resolved);
                }

                const relPath = `components/ui/${name}/${fileName}`;
                files.push({
                    path: relPath,
                    content: code,
                    type: getFileType(relPath),
                });
                addedComponentFiles.add(rawName);
                addedComponentFiles.add(fileName);
            }
        }

        // 内联生成 index.ts 派生 barrel
        const indexContent = rewriteImports(
            buildComponentIndexContent(Array.from(componentFileDeps)),
            name,
            'component',
            knownComponents
        );
        const indexRelPath = `components/ui/${name}/index.ts`;
        files.push({
            path: indexRelPath,
            content: indexContent,
            type: getFileType(indexRelPath),
        });

        const addedComposables = new Set<string>();
        await this.processComposables(
            composableDeps,
            addedComposables,
            name,
            files,
            allRegistryDeps,
            localeDeps,
            libDeps,
            knownComponents
        );

        const addedDirectives = new Set<string>();
        const directiveDeps = new Set<string>(componentInfo.directives ?? []);
        while (addedDirectives.size < directiveDeps.size) {
            const pending = Array.from(directiveDeps).filter(d => !addedDirectives.has(d));
            for (const rawName of pending) {
                const directiveName = await this.resolveExtension(rawName, this.paths.directivesDir);
                const directivePath = path.join(this.paths.directivesDir, directiveName);
                if (!(await this.fs.pathExists(directivePath))) {
                    throw new Error(`Directive file not found at ${directivePath}`);
                }

                let code = await this.readSource(directivePath);
                code = rewriteImports(code, name, 'directive', knownComponents);
                assertKnownRegistryDeps(code, name, directiveName);
                extractRegistryDeps(code, name, knownComponents).forEach(d => allRegistryDeps.add(d));

                for (const d of extractDeps(code, 'composables')) {
                    composableDeps.add(await this.resolveExtension(d, this.paths.composablesDir));
                }
                for (const d of extractDeps(code, 'locales')) {
                    localeDeps.add(await this.resolveExtension(d, this.paths.localesDir));
                }
                for (const d of extractDeps(code, 'lib')) {
                    libDeps.add(await this.resolveExtension(d, this.paths.libDir));
                }
                for (const d of extractDeps(code, 'directives')) {
                    directiveDeps.add(await this.resolveExtension(d, this.paths.directivesDir));
                }

                const relPath = `directives/${directiveName}`;
                files.push({
                    path: relPath,
                    content: code,
                    type: getFileType(relPath),
                });
                addedDirectives.add(rawName);
                addedDirectives.add(directiveName);
            }
        }

        await this.processComposables(
            composableDeps,
            addedComposables,
            name,
            files,
            allRegistryDeps,
            localeDeps,
            libDeps,
            knownComponents
        );

        const addedLocaleDeps = new Set<string>();
        while (addedLocaleDeps.size < localeDeps.size || addedComposables.size < composableDeps.size) {
            const pendingLocales = Array.from(localeDeps).filter(l => !addedLocaleDeps.has(l));
            for (const rawLocaleName of pendingLocales) {
                const localeName = await this.resolveExtension(rawLocaleName, this.paths.localesDir);
                const localePath = path.join(this.paths.localesDir, localeName);
                if (await this.fs.pathExists(localePath)) {
                    const raw = await this.readSource(localePath);
                    const code = rewriteImports(raw, name, 'locale', knownComponents);
                    for (const d of extractDeps(code, 'locales')) {
                        localeDeps.add(await this.resolveExtension(d, this.paths.localesDir));
                    }
                    for (const d of extractDeps(code, 'composables')) {
                        composableDeps.add(await this.resolveExtension(d, this.paths.composablesDir));
                    }
                    for (const d of extractDeps(code, 'lib')) {
                        libDeps.add(await this.resolveExtension(d, this.paths.libDir));
                    }
                }
                addedLocaleDeps.add(rawLocaleName);
                addedLocaleDeps.add(localeName);
            }
            await this.processComposables(
                composableDeps,
                addedComposables,
                name,
                files,
                allRegistryDeps,
                localeDeps,
                libDeps,
                knownComponents
            );
        }

        if (localeDeps.size > 0) {
            allRegistryDeps.add('locale-zh-cn');
        }

        for (const rawLibName of libDeps) {
            const libName = await this.resolveExtension(rawLibName, this.paths.libDir);
            const libPath = path.join(this.paths.libDir, libName);
            if (!(await this.fs.pathExists(libPath))) {
                throw new Error(`Lib file not found at ${libPath}`);
            }

            const raw = await this.readSource(libPath);
            const code = rewriteImports(raw, name, 'lib', knownComponents);
            assertKnownRegistryDeps(code, name, libName);
            extractRegistryDeps(code, name, knownComponents).forEach(d => allRegistryDeps.add(d));
            for (const d of extractDeps(code, 'lib')) {
                libDeps.add(await this.resolveExtension(d, this.paths.libDir));
            }

            if (this.libExclude.has(libName)) continue;

            const relPath = `lib/${libName}`;
            files.push({
                path: relPath,
                content: code,
                type: getFileType(relPath),
            });
        }

        return {
            files,
            registryDependencies: Array.from(allRegistryDeps).sort(),
        };
    }

    private async processComposables(
        composableDeps: Set<string>,
        addedComposables: Set<string>,
        componentName: string,
        files: RegistryFile[],
        allRegistryDeps: Set<string>,
        localeDeps: Set<string>,
        libDeps: Set<string>,
        knownComponents?: Set<string>
    ): Promise<void> {
        while (addedComposables.size < composableDeps.size) {
            const pending = Array.from(composableDeps).filter(c => !addedComposables.has(c));
            for (const rawName of pending) {
                const composableName = await this.resolveExtension(rawName, this.paths.composablesDir);
                const composablePath = path.join(this.paths.composablesDir, composableName);
                if (!(await this.fs.pathExists(composablePath))) {
                    throw new Error(`Composable file not found at ${composablePath}`);
                }

                let code = await this.readSource(composablePath);
                code = rewriteImports(code, componentName, 'composable', knownComponents);
                assertKnownRegistryDeps(code, componentName, composableName);
                extractRegistryDeps(code, componentName, knownComponents).forEach(d => allRegistryDeps.add(d));
                for (const d of extractDeps(code, 'composables')) {
                    composableDeps.add(await this.resolveExtension(d, this.paths.composablesDir));
                }
                for (const d of extractDeps(code, 'locales')) {
                    localeDeps.add(await this.resolveExtension(d, this.paths.localesDir));
                }
                for (const d of extractDeps(code, 'lib')) {
                    libDeps.add(await this.resolveExtension(d, this.paths.libDir));
                }

                const relPath = `composables/${composableName}`;
                files.push({
                    path: relPath,
                    content: code,
                    type: getFileType(relPath),
                });
                addedComposables.add(rawName);
                addedComposables.add(composableName);
            }
        }
    }
}
