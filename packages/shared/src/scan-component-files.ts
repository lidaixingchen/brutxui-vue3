/**
 * Prebuild component file scanner.
 *
 * Traverses components directory using SfcAstEngine to discover
 * each component's file dependencies (internal files, composables, lib, directives),
 * and returns a manifest suitable for registry building.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
    createModuleResolver,
    type ModuleAlias,
    type ModuleResolver,
    type ModuleResolverOptions,
} from './module-resolver.js';
import { isInsideDir, toPosixPath } from './path.js';
import type { ComponentFileManifest } from './registry-manifest.types.js';
import {
    DEFAULT_LIB_EXCLUDE,
    DEFAULT_MANIFEST_OVERRIDES,
    applyManifestOverrides,
} from './scan-manifest.js';

export type { ComponentFileManifest } from './registry-manifest.types.js';

export interface ComponentSourceDirectories {
    componentsDir: string;
    composablesDir: string;
    libDir: string;
    directivesDir: string;
    localesDir?: string;
    typesDir?: string;
}

export interface ScanOptions extends ComponentSourceDirectories {
    /** 排除的 lib 文件集合，未指定时默认使用 DEFAULT_LIB_EXCLUDE */
    libExclude?: ReadonlySet<string>;
    /**
     * 依赖覆盖清单。
     * - undefined（默认）：自动应用 DEFAULT_MANIFEST_OVERRIDES
     * - Record<...>: 应用自定义覆盖清单
     * - false: 禁用覆盖，仅返回纯 AST 扫描结果
     */
    manifestOverrides?: Record<string, Partial<Pick<ComponentFileManifest, 'directives'>>> | false;
}

export function createComponentModuleResolver(
    directories: ComponentSourceDirectories,
    fileExists?: ModuleResolverOptions['fileExists'],
): ModuleResolver {
    const sourceRoot = path.resolve(directories.componentsDir, '..');
    const sourceDirectories = {
        components: directories.componentsDir,
        composables: directories.composablesDir,
        directives: directories.directivesDir,
        lib: directories.libDir,
        locales: directories.localesDir,
        types: directories.typesDir,
    };
    const aliases: ModuleAlias[] = [
        { find: '@', replacement: sourceRoot },
        { find: '@/components/ui', replacement: path.resolve(directories.componentsDir) },
    ];
    let rootDir = sourceRoot;
    for (const [name, directory] of Object.entries(sourceDirectories)) {
        if (!directory) continue;
        const absoluteDir = path.resolve(directory);
        if (absoluteDir !== path.join(sourceRoot, name)) {
            aliases.push({ find: `@/${name}`, replacement: absoluteDir });
        }
        while (!isInsideDir(rootDir, absoluteDir)) rootDir = path.dirname(rootDir);
    }
    const tsconfigPath = path.resolve(sourceRoot, '../tsconfig.json');
    return createModuleResolver({
        rootDir,
        tsconfigPath: !fileExists && fs.existsSync(tsconfigPath) ? tsconfigPath : undefined,
        viteAliases: aliases,
        fileExists,
    });
}

export function relativeModulePath(directory: string, filename: string): string | undefined {
    const relativePath = path.relative(directory, filename);
    return relativePath && isInsideDir(directory, filename) ? toPosixPath(relativePath) : undefined;
}

const TEST_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/u;

/**
 * `index.ts` barrel files are auto-generated derived artifacts (produced by
 * generate-component-index.ts from this manifest). They are gitignored and may
 * not exist on a clean checkout. Skipping them here avoids:
 *   - Circular dependency (manifest → generate index.ts → manifest)
 *   - CI failures when index.ts doesn't exist yet at scan time
 * The registry build generates index.ts content inline instead.
 */
const DERIVED_BARREL_FILE = 'index.ts';

export function isComponentSourceFile(name: string): boolean {
    return name !== DERIVED_BARREL_FILE && !TEST_FILE_PATTERN.test(name)
        && /\.(?:vue|[cm]?tsx?|[cm]?jsx?|css)$/u.test(name);
}

function listComponentFiles(componentDir: string): string[] {
    const results: string[] = [];
    const stack: string[] = ['.'];
    while (stack.length > 0) {
        const rel = stack.pop()!;
        const abs = path.join(componentDir, rel);
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(abs, { withFileTypes: true });
        } catch {
            continue;
        }
        for (const entry of entries) {
            const entryRel = rel === '.' ? entry.name : path.join(rel, entry.name);
            if (entry.isDirectory()) {
                if (isComponentSourceDirectory(entry.name)) stack.push(entryRel);
            } else if (entry.isFile() && isComponentSourceFile(entryRel)) {
                results.push(toPosixPath(entryRel));
            }
        }
    }
    return results.sort();
}

function scanComponent(
    componentName: string,
    options: ScanOptions,
    moduleResolver: ModuleResolver,
): ComponentFileManifest {
    const componentDir = path.join(options.componentsDir, componentName);
    const diskFiles = listComponentFiles(componentDir);
    const internalFiles = new Set<string>(diskFiles);
    const composables = new Set<string>();
    const lib = new Set<string>();
    const directives = new Set<string>();

    const libExclude = options.libExclude ?? DEFAULT_LIB_EXCLUDE;
    for (const file of internalFiles) {
        if (file.endsWith('.css') || !isComponentSourceFile(file)) continue;
        const filename = path.resolve(componentDir, file);
        const content = fs.readFileSync(filename, 'utf-8');
        const { analysis } = moduleResolver.analyze(content, filename);
        if (analysis.completeness === 'invalid') {
            const errMsgs = analysis.diagnostics.map(d => d.message).join('; ');
            throw new Error(`Failed to parse file "${file}" in component "${componentName}": ${errMsgs}`);
        }

        for (const { specifier } of analysis.dependencies) {
            const resolved = moduleResolver.resolve(filename, specifier);
            if (resolved.kind !== 'internal' || !resolved.resolvedPath) continue;
            const target = resolved.resolvedPath;
            const localFile = relativeModulePath(componentDir, target);
            if (localFile) {
                if (localFile !== DERIVED_BARREL_FILE && !TEST_FILE_PATTERN.test(localFile)) {
                    internalFiles.add(localFile);
                }
                continue;
            }

            const composable = relativeModulePath(options.composablesDir, target);
            if (composable) composables.add(composable);
            const libFile = relativeModulePath(options.libDir, target);
            if (libFile && !libExclude.has(libFile)) lib.add(libFile);
            const directive = relativeModulePath(options.directivesDir, target);
            if (directive) directives.add(directive);
        }
    }

    return {
        files: Array.from(internalFiles).sort(),
        composables: Array.from(composables).sort(),
        directives: Array.from(directives).sort(),
        lib: Array.from(lib).sort(),
    };
}

/** componentsDir 下不应被当作组件扫描的已知非组件目录（测试/依赖/元数据） */
const IGNORED_DIR_NAMES = new Set(['node_modules', '__tests__', '__snapshots__']);

export function isComponentSourceDirectory(name: string): boolean {
    return !name.startsWith('.') && !IGNORED_DIR_NAMES.has(name);
}

export function scanComponentFiles(options: ScanOptions): Record<string, ComponentFileManifest> {
    // 显式校验路径存在且为目录：existsSync 对普通文件也返回 true，但 readdirSync 会抛 ENOTDIR，
    // 用 statSync().isDirectory() 区分「不存在」与「不是目录」，报错更清晰
    let componentsDirIsDirectory = false;
    try {
        componentsDirIsDirectory = fs.statSync(options.componentsDir).isDirectory();
    } catch {
        // statSync 抛错说明路径不存在，保持 false
    }
    if (!componentsDirIsDirectory) {
        throw new Error(`[scan-component-files] Components directory not found or is not a directory: ${options.componentsDir}`);
    }

    const manifest: Record<string, ComponentFileManifest> = {};
    const entries = fs.readdirSync(options.componentsDir, { withFileTypes: true });
    const componentDirs = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        // 过滤隐藏目录（.DS_Store 等）与已知非组件目录，避免污染 manifest 或读取到非源码文件抛异常
        .filter(isComponentSourceDirectory)
        .sort();

    const moduleResolver = createComponentModuleResolver(options);
    for (const dir of componentDirs) {
        manifest[dir] = scanComponent(dir, options, moduleResolver);
    }

    if (options.manifestOverrides !== false) {
        applyManifestOverrides(manifest, options.manifestOverrides ?? DEFAULT_MANIFEST_OVERRIDES);
    }

    return manifest;
}
