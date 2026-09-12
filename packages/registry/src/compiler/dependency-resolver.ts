import path from 'node:path';
import {
    DEFAULT_LIB_EXCLUDE,
    type MergedRegistryEntry,
    type RegistryFile,
} from 'brutx-shared-vue';
import type { FileSystemAdapter } from '../fs/file-system-adapter.js';
import type { ModuleResolver } from 'brutx-shared-vue/module-resolver';
import {
    assertKnownRegistryDeps,
    extractComponentFileDeps,
    extractDeps,
    extractRegistryDeps,
    getFileType,
    rewriteImports,
} from './ast-rewriter.js';
import { buildRegistryComponentIndex } from './public-index.js';
import type {
    ComponentIndexBuilder,
    CompilerPaths,
    PublicComponentProjection,
} from './types.js';

export interface ResolvedComponentClosure {
    files: RegistryFile[];
    registryDependencies: string[];
}

export class DependencyResolver {
    private validatedModuleSources = new Map<string, string>();

    constructor(
        private fs: FileSystemAdapter,
        private paths: CompilerPaths,
        private libExclude: ReadonlySet<string> = DEFAULT_LIB_EXCLUDE,
        private componentIndexBuilder?: ComponentIndexBuilder,
        private moduleResolver?: ModuleResolver,
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

    private async assertPublicProjectionSources(
        componentName: string,
        projection: PublicComponentProjection,
    ): Promise<void> {
        const componentDir = path.join(this.paths.componentsDir, componentName);
        for (const item of projection.exports) {
            const source = item.source.split(/[?#]/)[0];
            let baseDir: string;
            let relativeSource: string;
            if (source.startsWith('./')) {
                baseDir = componentDir;
                relativeSource = source.slice(2);
            } else if (/^(?:\.\.\/)+types\//u.test(source)) {
                if (!this.paths.typesDir) {
                    throw new Error(`Types directory is required for public projection of "${componentName}"`);
                }
                baseDir = this.paths.typesDir;
                relativeSource = source.replace(/^(?:\.\.\/)+types\//u, '');
            } else if (/^(?:\.\.\/)+directives\//u.test(source)) {
                baseDir = this.paths.directivesDir;
                relativeSource = source.replace(/^(?:\.\.\/)+directives\//u, '');
            } else if (/^@\/types\//u.test(source)) {
                if (!this.paths.typesDir) {
                    throw new Error(`Types directory is required for public projection of "${componentName}"`);
                }
                baseDir = this.paths.typesDir;
                relativeSource = source.replace(/^@\/types\//u, '');
            } else if (/^@\/directives\//u.test(source)) {
                baseDir = this.paths.directivesDir;
                relativeSource = source.replace(/^@\/directives\//u, '');
            } else {
                throw new Error(
                    `Unsupported public projection source "${item.source}" for Registry component "${componentName}"`,
                );
            }

            const resolvedName = await this.resolveExtension(relativeSource, baseDir);
            const resolvedPath = path.resolve(baseDir, resolvedName);
            const relative = path.relative(path.resolve(baseDir), resolvedPath);
            if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
                throw new Error(
                    `Public projection source escapes its source directory: "${item.source}" for Registry component "${componentName}"`,
                );
            }
            let isFile: boolean;
            try {
                isFile = (await this.fs.stat(resolvedPath)).isFile();
            } catch {
                isFile = false;
            }
            if (!isFile) {
                throw new Error(
                    `Public projection source not found at ${resolvedPath} for Registry component "${componentName}"`,
                );
            }
        }
    }

    private assertResolvableModules(source: string, importer: string): void {
        if (!this.moduleResolver) return;
        if (!/\.(?:vue|[cm]?tsx?|jsx?)$/u.test(importer)) return;
        if (this.validatedModuleSources.get(importer) === source) return;
        const analysis = this.moduleResolver.analyze(source, importer).analysis;
        if (analysis.completeness === 'invalid') {
            const details = analysis.diagnostics.map(diagnostic => diagnostic.message).join('; ');
            throw new Error(`Failed to parse module references in "${importer}": ${details}`);
        }

        for (const reference of analysis.references) {
            if (!/^(?:\.|\/|@\/)/u.test(reference.specifier)) continue;
            const resolution = this.moduleResolver.resolve(importer, reference.specifier);
            if (resolution.kind !== 'unresolved' && resolution.kind !== 'ambiguous') continue;
            const details = resolution.diagnostics.map(diagnostic => diagnostic.message).join('; ');
            throw new Error(
                `Unable to resolve module "${reference.specifier}" from "${importer}": ${details}`,
            );
        }
        this.validatedModuleSources.set(importer, source);
    }

    public async resolveComponentClosure(
        name: string,
        componentInfo: MergedRegistryEntry,
        knownComponents?: Set<string>,
        publicProjection?: PublicComponentProjection,
    ): Promise<ResolvedComponentClosure> {
        if (!publicProjection) {
            throw new Error(`Public component projection is required for Registry component "${name}"`);
        }
        await this.assertPublicProjectionSources(name, publicProjection);
        const allRegistryDeps = new Set<string>();
        const files: RegistryFile[] = [];
        const componentFileDeps = new Set(componentInfo.files);
        const composableDeps = new Set(componentInfo.composables ?? []);
        const localeDeps = new Set<string>();
        const libDeps = new Set<string>();
        const typeDeps = new Set<string>();

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
                this.assertResolvableModules(code, filePath);
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
                for (const d of extractDeps(code, 'types')) {
                    const typesDir = this.paths.typesDir;
                    if (typesDir) typeDeps.add(await this.resolveExtension(d, typesDir));
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
            buildRegistryComponentIndex(
                publicProjection,
                this.componentIndexBuilder,
            ),
            name,
            'component',
            knownComponents
        );

        if (publicProjection) {
            for (const item of publicProjection.exports) {
                const match = /^(?:\.\.\/)+types\/(.+)$/.exec(item.source);
                const aliasMatch = /^@\/types\/(.+)$/.exec(item.source);
                const source = match?.[1] ?? aliasMatch?.[1];
                if (source && this.paths.typesDir) {
                    typeDeps.add(await this.resolveExtension(source, this.paths.typesDir));
                }
            }
        }
        const indexRelPath = `components/ui/${name}/index.ts`;
        files.push({
            path: indexRelPath,
            content: indexContent,
            type: getFileType(indexRelPath),
        });

        const addedComposables = new Set<string>();
        const addedTypes = new Set<string>();
        await this.processComposables(
            composableDeps,
            addedComposables,
            name,
            files,
            allRegistryDeps,
            localeDeps,
            libDeps,
            typeDeps,
            knownComponents
        );

        await this.processTypes(
            typeDeps,
            addedTypes,
            name,
            files,
            allRegistryDeps,
            localeDeps,
            composableDeps,
            libDeps,
            knownComponents,
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
                this.assertResolvableModules(code, directivePath);
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
                for (const d of extractDeps(code, 'types')) {
                    const typesDir = this.paths.typesDir;
                    if (typesDir) typeDeps.add(await this.resolveExtension(d, typesDir));
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
            typeDeps,
            knownComponents
        );
        await this.processTypes(
            typeDeps,
            addedTypes,
            name,
            files,
            allRegistryDeps,
            localeDeps,
            composableDeps,
            libDeps,
            knownComponents,
        );

        const addedLocaleDeps = new Set<string>();
        while (addedLocaleDeps.size < localeDeps.size || addedComposables.size < composableDeps.size) {
            const pendingLocales = Array.from(localeDeps).filter(l => !addedLocaleDeps.has(l));
            for (const rawLocaleName of pendingLocales) {
                const localeName = await this.resolveExtension(rawLocaleName, this.paths.localesDir);
                const localePath = path.join(this.paths.localesDir, localeName);
                if (await this.fs.pathExists(localePath)) {
                    const raw = await this.readSource(localePath);
                    this.assertResolvableModules(raw, localePath);
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
                    for (const d of extractDeps(code, 'types')) {
                        const typesDir = this.paths.typesDir;
                        if (typesDir) typeDeps.add(await this.resolveExtension(d, typesDir));
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
                typeDeps,
                knownComponents
            );
            await this.processTypes(
                typeDeps,
                addedTypes,
                name,
                files,
                allRegistryDeps,
                localeDeps,
                composableDeps,
                libDeps,
                knownComponents,
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
            this.assertResolvableModules(raw, libPath);
            const code = rewriteImports(raw, name, 'lib', knownComponents);
            assertKnownRegistryDeps(code, name, libName);
            extractRegistryDeps(code, name, knownComponents).forEach(d => allRegistryDeps.add(d));
            for (const d of extractDeps(code, 'lib')) {
                libDeps.add(await this.resolveExtension(d, this.paths.libDir));
            }
            for (const d of extractDeps(code, 'types')) {
                const typesDir = this.paths.typesDir;
                if (typesDir) typeDeps.add(await this.resolveExtension(d, typesDir));
            }

            if (this.libExclude.has(libName)) continue;

            const relPath = `lib/${libName}`;
            files.push({
                path: relPath,
                content: code,
                type: getFileType(relPath),
            });
        }

        await this.processTypes(
            typeDeps,
            addedTypes,
            name,
            files,
            allRegistryDeps,
            localeDeps,
            composableDeps,
            libDeps,
            knownComponents,
        );
        await this.processComposables(
            composableDeps,
            addedComposables,
            name,
            files,
            allRegistryDeps,
            localeDeps,
            libDeps,
            typeDeps,
            knownComponents,
        );

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
        typeDeps: Set<string>,
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
                this.assertResolvableModules(code, composablePath);
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
                for (const d of extractDeps(code, 'types')) {
                    const typesDir = this.paths.typesDir;
                    if (typesDir) typeDeps.add(await this.resolveExtension(d, typesDir));
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

    private async processTypes(
        typeDeps: Set<string>,
        addedTypes: Set<string>,
        componentName: string,
        files: RegistryFile[],
        allRegistryDeps: Set<string>,
        localeDeps: Set<string>,
        composableDeps: Set<string>,
        libDeps: Set<string>,
        knownComponents?: Set<string>,
    ): Promise<void> {
        const typesDir = this.paths.typesDir;
        if (!typesDir && typeDeps.size > 0) {
            throw new Error(`Types directory is required to resolve type dependencies for "${componentName}"`);
        }
        if (!typesDir) return;

        while (addedTypes.size < typeDeps.size) {
            const pending = Array.from(typeDeps).filter(type => !addedTypes.has(type));
            for (const rawName of pending) {
                const typeName = await this.resolveExtension(rawName, typesDir);
                const typePath = path.join(typesDir, typeName);
                if (!(await this.fs.pathExists(typePath))) {
                    throw new Error(`Type file not found at ${typePath}`);
                }

                let code = await this.readSource(typePath);
                this.assertResolvableModules(code, typePath);
                code = rewriteImports(code, componentName, 'types', knownComponents);
                assertKnownRegistryDeps(code, componentName, typeName);
                extractRegistryDeps(code, componentName, knownComponents).forEach(d => allRegistryDeps.add(d));
                for (const d of extractDeps(code, 'types')) {
                    typeDeps.add(await this.resolveExtension(d, typesDir));
                }
                for (const d of extractDeps(code, 'composables')) {
                    composableDeps.add(await this.resolveExtension(d, this.paths.composablesDir));
                }
                for (const d of extractDeps(code, 'locales')) {
                    localeDeps.add(await this.resolveExtension(d, this.paths.localesDir));
                }
                for (const d of extractDeps(code, 'lib')) {
                    libDeps.add(await this.resolveExtension(d, this.paths.libDir));
                }

                const relPath = `types/${typeName}`;
                files.push({
                    path: relPath,
                    content: code,
                    type: getFileType(relPath),
                });
                addedTypes.add(rawName);
                addedTypes.add(typeName);
            }
        }
    }
}
