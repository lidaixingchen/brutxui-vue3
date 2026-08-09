/**
 * Prebuild component file scanner.
 *
 * Traverses a components directory, uses extractModuleSpecifiers to discover
 * each component's file dependencies (internal files, composables, lib, directives),
 * and returns a manifest suitable for registry building.
 *
 * This replaces the hand-maintained file mapping for the
 * files/composables/directives/lib fields. Human-maintained metadata
 * (title/description/category etc.) stays in COMPONENT_METADATA.
 */
import fs from 'node:fs';
import path from 'node:path';
import { extractModuleSpecifiers } from './extract-module-specifiers.js';
import type { ComponentFileManifest } from './registry-manifest.types.js';

export type { ComponentFileManifest } from './registry-manifest.types.js';

export interface ScanOptions {
    componentsDir: string;
    composablesDir: string;
    libDir: string;
    directivesDir: string;
    /** Filenames to exclude from lib output (e.g. 'utils.ts' — consumer creates their own). */
    libExclude?: Set<string>;
}

const ALIAS_PREFIXES = {
    composables: '@/composables/',
    lib: '@/lib/',
    directives: '@/directives/',
} as const;

/** 统一为 POSIX 分隔符，避免 Windows 反斜杠干扰路径前缀比较 */
const toPosix = (p: string): string => p.replace(/\\/g, '/');

function resolveExtension(rawFileName: string, baseDir: string): string | null {
    if (path.extname(rawFileName)) return rawFileName;
    if (fs.existsSync(path.join(baseDir, `${rawFileName}.vue`))) return `${rawFileName}.vue`;
    // 校验存在性后再返回 .ts，避免干净检出下解析到不存在的文件导致 readFileSync 崩溃
    if (fs.existsSync(path.join(baseDir, `${rawFileName}.ts`))) return `${rawFileName}.ts`;
    return null;
}

const TEST_FILE_PATTERN = /\.(test|spec)\.(ts|js|tsx|jsx)$/;

/**
 * `index.ts` barrel files are auto-generated derived artifacts (produced by
 * generate-component-index.ts from this manifest). They are gitignored and may
 * not exist on a clean checkout. Skipping them here avoids:
 *   - Circular dependency (manifest → generate index.ts → manifest)
 *   - CI failures when index.ts doesn't exist yet at scan time
 * The registry build generates index.ts content inline instead.
 */
const DERIVED_BARREL_FILE = 'index.ts';

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
                stack.push(entryRel);
            } else if (entry.isFile()) {
                if (TEST_FILE_PATTERN.test(entry.name)) continue;
                if (entry.name === DERIVED_BARREL_FILE) continue;
                const ext = path.extname(entry.name);
                if (ext === '.vue' || ext === '.ts' || ext === '.css') {
                    results.push(entryRel.replace(/\\/g, '/'));
                }
            }
        }
    }
    return results.sort();
}

interface ClassifiedSpecifier {
    kind: 'composable' | 'lib' | 'directive' | 'internal' | 'cross-component' | 'other';
    name: string;
}

function classifySpecifier(
    specifier: string,
    componentName: string,
    options: ScanOptions,
    importingFile: string,
): ClassifiedSpecifier {
    // @/ alias patterns
    if (specifier.startsWith(ALIAS_PREFIXES.composables)) {
        const name = specifier.slice(ALIAS_PREFIXES.composables.length).split(/[?#]/)[0];
        return { kind: 'composable', name };
    }
    if (specifier.startsWith(ALIAS_PREFIXES.lib)) {
        const name = specifier.slice(ALIAS_PREFIXES.lib.length).split(/[?#]/)[0];
        return { kind: 'lib', name };
    }
    if (specifier.startsWith(ALIAS_PREFIXES.directives)) {
        const name = specifier.slice(ALIAS_PREFIXES.directives.length).split(/[?#]/)[0];
        return { kind: 'directive', name };
    }
    const compAliasPrefix = `@/components/ui/${componentName}/`;
    if (specifier.startsWith(compAliasPrefix)) {
        const name = specifier.slice(compAliasPrefix.length).split(/[?#]/)[0];
        return { kind: 'internal', name };
    }
    const crossCompPrefix = '@/components/ui/';
    if (specifier.startsWith(crossCompPrefix)) {
        const rest = specifier.slice(crossCompPrefix.length);
        const depName = rest.split('/')[0];
        if (depName !== componentName) {
            return { kind: 'cross-component', name: depName };
        }
        const filePart = rest.slice(`${depName}/`.length).split(/[?#]/)[0];
        return { kind: 'internal', name: filePart };
    }

    // Relative import patterns (source code uses ../ and ./)
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
        return classifyRelativeSpecifier(specifier, componentName, options, importingFile);
    }

    return { kind: 'other', name: specifier };
}

/**
 * 相对导入分类：基于导入文件所在目录做路径规范化，而非字符串前缀匹配。
 *
 * 相比前缀匹配，能正确处理：
 * - 子目录内指向组件根的 `../`（如 `sub/Foo.ts` 导入 `../Button.vue` → 组件内部文件）；
 * - 跨层导入（如 `../../composables/useX` → composables 兄弟目录）；
 * 从而避免内部依赖被误判为 cross-component / 被丢进 other 而遍历不完整。
 */
function classifyRelativeSpecifier(
    specifier: string,
    componentName: string,
    options: ScanOptions,
    importingFile: string,
): ClassifiedSpecifier {
    // 统一用 path.resolve 归一化：传入相对 componentsDir 时基于同一 cwd 转绝对，
    // 避免 path.join（保持相对）与 path.resolve（转绝对）混用导致前缀判断整体失配
    const componentsDir = toPosix(path.resolve(options.componentsDir));
    const composablesDir = toPosix(path.resolve(options.composablesDir));
    const libDir = toPosix(path.resolve(options.libDir));
    const directivesDir = toPosix(path.resolve(options.directivesDir));
    const componentRoot = toPosix(path.resolve(options.componentsDir, componentName));
    const importingDir = toPosix(path.dirname(path.resolve(options.componentsDir, componentName, importingFile)));
    const resolved = toPosix(path.resolve(importingDir, specifier)).split(/[?#]/)[0];

    if (resolved === componentRoot || resolved.startsWith(`${componentRoot}/`)) {
        const name = resolved === componentRoot ? '' : resolved.slice(componentRoot.length + 1);
        return { kind: 'internal', name };
    }

    // 先匹配更具体的公共目录（composables/lib/directives），再匹配兄弟组件目录——
    // 若未来公共目录被置于 componentsDir 内部，避免被 componentsDir 分支误标为 cross-component
    if (resolved.startsWith(`${composablesDir}/`)) {
        return { kind: 'composable', name: relativeTo(resolved, composablesDir) };
    }
    if (resolved.startsWith(`${libDir}/`)) {
        return { kind: 'lib', name: relativeTo(resolved, libDir) };
    }
    if (resolved.startsWith(`${directivesDir}/`)) {
        return { kind: 'directive', name: relativeTo(resolved, directivesDir) };
    }

    // 兄弟组件：componentsDir 下的其它组件目录（当前组件已由上面的 componentRoot 分支接管）
    if (resolved.startsWith(`${componentsDir}/`)) {
        const rest = resolved.slice(componentsDir.length + 1);
        return { kind: 'cross-component', name: rest.split('/')[0] ?? '' };
    }

    return { kind: 'other', name: specifier };
}

/** 返回 resolved 相对 dir（去前导分隔符）的路径，供 resolveExtension 复用 */
function relativeTo(resolved: string, dir: string): string {
    return resolved.slice(toPosix(dir).length).replace(/^\/+/, '');
}

function scanComponent(
    componentName: string,
    options: ScanOptions,
): ComponentFileManifest {
    const componentDir = path.join(options.componentsDir, componentName);
    const diskFiles = listComponentFiles(componentDir);
    const internalFiles = new Set<string>(diskFiles);
    const composables = new Set<string>();
    const lib = new Set<string>();
    const directives = new Set<string>();

    const queue = [...diskFiles];
    const visited = new Set<string>();

    // 用游标代替 queue.shift()：数组头部出队是 O(n)，文件较多时整体退化为 O(n²)；
    // 遍历顺序不影响结果正确性，游标即可
    let cursor = 0;
    while (cursor < queue.length) {
        const file = queue[cursor];
        cursor += 1;
        if (visited.has(file)) continue;
        visited.add(file);

        const ext = path.extname(file);
        if (ext !== '.vue' && ext !== '.ts') continue;

        const filePath = path.join(componentDir, file);
        // 干净检出下派生文件（如 index.ts）可能不存在，跳过而非崩溃
        if (!fs.existsSync(filePath)) continue;
        const content = fs.readFileSync(filePath, 'utf-8');

        for (const specifier of extractModuleSpecifiers(content)) {
            const classified = classifySpecifier(specifier, componentName, options, file);
            switch (classified.kind) {
                case 'composable': {
                    const resolved = resolveExtension(classified.name, options.composablesDir);
                    if (resolved !== null) composables.add(resolved);
                    break;
                }
                case 'lib': {
                    const resolved = resolveExtension(classified.name, options.libDir);
                    if (resolved !== null && !options.libExclude?.has(resolved)) {
                        lib.add(resolved);
                    }
                    break;
                }
                case 'directive': {
                    const resolved = resolveExtension(classified.name, options.directivesDir);
                    if (resolved !== null) directives.add(resolved);
                    break;
                }
                case 'internal': {
                    const resolved = resolveExtension(classified.name, componentDir);
                    if (resolved === null) {
                        // 排除已知良性场景后告警，避免误报：
                        // - name 为空：@/components/ui/{componentName} 自引用，目标正是派生 barrel index.ts（干净检出下刻意不存在）
                        // - basename 为 index：同样指向派生 barrel
                        const baseName = path.basename(classified.name, path.extname(classified.name));
                        if (classified.name !== '' && baseName !== 'index') {
                            console.warn(`[scan-component-files] Failed to resolve internal import "${classified.name}" in component "${componentName}"`);
                        }
                        break;
                    }
                    // 派生 barrel（index.ts）已由 listComponentFiles 递归跳过（任意层级），
                    // 这里用 basename 同样过滤，避免 sub/index 这类内部导入绕过过滤被重新加入扫描队列
                    // （干净检出下不存在、readFileSync 崩溃）
                    if (path.basename(resolved) !== DERIVED_BARREL_FILE && !internalFiles.has(resolved)) {
                        internalFiles.add(resolved);
                        queue.push(resolved);
                    }
                    break;
                }
                case 'cross-component':
                case 'other':
                    break;
            }
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
const NON_COMPONENT_DIR_NAMES = new Set(['node_modules', '__tests__', '__snapshots__']);

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
        .filter((name) => !name.startsWith('.') && !NON_COMPONENT_DIR_NAMES.has(name))
        .sort();

    for (const dir of componentDirs) {
        manifest[dir] = scanComponent(dir, options);
    }

    return manifest;
}
