import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
    COMPONENT_METADATA,
    computeRegistryIntegrity,
    validateRegistryIntegrity,
    validateRegistryItem,
    CSS_VARS,
} from 'brutx-shared-vue';
import { extractModuleSpecifiers } from 'brutx-shared-vue/scan';
import type {
    MergedRegistryEntry,
    RegistryManifest,
    RegistryFile,
    RegistryFileType,
    RegistryIndex,
    RegistryIndexItem,
    RegistryItem,
} from 'brutx-shared-vue';
import {
    findRegistryDependencyCycles,
    REGISTRY_MANIFEST_SCHEMA_URL,
    validateRegistryItemInternalImports,
} from './validate-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_COMPONENTS_DIR = path.resolve(__dirname, '../../ui/src/components');
const UI_COMPOSABLES_DIR = path.resolve(__dirname, '../../ui/src/composables');
const UI_LOCALES_DIR = path.resolve(__dirname, '../../ui/src/locales');
const UI_LIB_DIR = path.resolve(__dirname, '../../ui/src/lib');
const UI_DIRECTIVES_DIR = path.resolve(__dirname, '../../ui/src/directives');
const MANIFEST_PATH = path.resolve(__dirname, '../../ui/registry-manifest.json');
const OUTPUT_DIR = path.resolve(__dirname, '../registry');

export function loadMergedRegistry(): Record<string, MergedRegistryEntry> {
    const manifestRaw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(manifestRaw) as RegistryManifest;
    const merged: Record<string, MergedRegistryEntry> = {};

    for (const [name, meta] of Object.entries(COMPONENT_METADATA)) {
        const fileManifest = manifest[name];
        if (!fileManifest) {
            throw new Error(`Component "${name}" has metadata but is missing from registry-manifest.json. Run pnpm --filter brutx-ui-vue prebuild:scan.`);
        }
        merged[name] = {
            ...meta,
            files: [...fileManifest.files],
            composables: [...fileManifest.composables],
            directives: [...fileManifest.directives],
            lib: [...fileManifest.lib],
        };
    }

    for (const name of Object.keys(manifest)) {
        if (!COMPONENT_METADATA[name]) {
            throw new Error(`Component "${name}" is in registry-manifest.json but has no metadata in COMPONENT_METADATA. Add an entry in packages/shared/src/components.ts.`);
        }
    }

    return merged;
}

const REGISTRY: Record<string, MergedRegistryEntry> = loadMergedRegistry();

type RewriteContext = 'component' | 'composable' | 'lib' | 'directive' | 'locale';

// utils.ts is excluded from registry — consumers must create their own lib/utils.ts via CLI init.
// This file provides the cn() utility (clsx + tailwind-merge) and is project-specific.
// Excluded files' content is not published or hashed, but their imports are still
// scanned to discover transitive dependencies.
const LIB_FILE_EXCLUDE = new Set<string>(['utils.ts']);

const DIR_PREFIX_TO_BASE: Record<string, string> = {
    composables: UI_COMPOSABLES_DIR,
    locales: UI_LOCALES_DIR,
    lib: UI_LIB_DIR,
    directives: UI_DIRECTIVES_DIR,
};

function resolveExtension(rawFileName: string, baseDir: string): string {
    if (path.extname(rawFileName)) return rawFileName;
    if (fs.existsSync(path.join(baseDir, `${rawFileName}.vue`))) return `${rawFileName}.vue`;
    return `${rawFileName}.ts`;
}

const CACHE_FILE = path.resolve(__dirname, '../.registry-cache.json');
const CACHE_VERSION = 4;
const REGISTRY_SCHEMA_VERSION = 1;
const BENCH_FILE = path.resolve(__dirname, '../bench.json');

/**
 * 增量构建缓存策略（P0-4 文档化）
 *
 * 缓存位置：packages/registry/.registry-cache.json
 *   结构：Record<componentName | 'locale-zh-cn', sourceHash: string>
 *
 * 缓存键（sourceHash，见 computeSourceHash）由以下要素 sha256 而成：
 *   1. CACHE_VERSION —— 钥匙版本，提升后所有条目强制失效
 *   2. REGISTRY[name] 即 COMPONENT_METADATA 派生的 merged 条目（title/desc/category/deps/...）
 *   3. fileMapping —— registry-manifest.json 中该组件的 files/composables/directives/lib 清单
 *   4. TAILWIND_CONFIG + CSS_VARS —— 共享配置（受 shared 影响）
 *   5. 该组件传递闭包内所有源码原文（component/composable/locale/lib/directive）
 *      闭包通过 AST 扫描 import 静态派生（见 extractComponentFileDeps/extractDeps）
 *
 * 命中条件（见 run() 中 `cache[name] === sourceHash && fs.existsSync(outputPath)`）：
 *   - sourceHash 与缓存一致
 *   - 输出文件存在
 *   - validateReusableRegistryItem 通过（integrity 自洽 + 内部 import 合法）
 *   三者均满足才复用旧输出，否则重算 buildRegistryItem 并覆写。
 *
 * 失效触发：
 *   - 改 COMPONENT_METADATA / components.ts → 闭包内所有组件失效
 *   - 改任一源文件（含被传递依赖的文件）→ 依赖它的组件失效
 *   - 改 TAILWIND_CONFIG / CSS_VARS → 全部失效
 *   - 提升 CACHE_VERSION → 全部失效
 *   - registry-manifest.json 中某组件 files 列表变化 → 该组件失效
 *
 * 注意：sourceHash 包含"传递闭包源码原文"，故改 Button.vue 会让所有依赖 button
 * 的组件（dialog/popover/...）也失效——这是正确的，因为它们的 files 会嵌入
 * Button.vue 的内容。删除任一闭包内文件同样会触发"Source file not found"错误。
 *
 * 稳定契约：componentNames 已字典序遍历（见 run() L656），保证 build 顺序稳定；
 *   manifest 的 items 也按字典序存（见 buildRegistryManifest L146）。
 *   registry-manifest.json 的 integrity 字段对 items 内容求 sha256（排除
 *   buildTimestamp/gitCommit/integrity 自身），CLI 拉取后可校验完整性。
 */

export interface RegistryBuildManifest {
    $schema: string;
    name: string;
    schemaVersion: number;
    registryVersion: string;
    buildTimestamp: string | null;
    gitCommit: string | null;
    integrity: string;
    itemCount: number;
    items: Record<string, {
        integrity: string;
        fileCount: number;
        dependencies: string[];
        registryDependencies: string[];
        category?: RegistryIndexItem['category'];
        examples?: string[];
        status?: RegistryIndexItem['status'];
        replacement?: string;
    }>;
}

export interface RegistryBuildManifestOptions {
    registryVersion: string;
    schemaVersion?: number;
    buildTimestamp?: string | null;
    gitCommit?: string | null;
}

/**
 * 计算 registry-manifest 自身完整性哈希。
 * 对 items 的规范化 JSON 序列求 sha256（按 name 字典序），
 * 排除 buildTimestamp/gitCommit/integrity 本身（这些字段在两次 build 间会变）。
 * 用于 CLI 拉取 manifest 后校验其未被篡改（v2.2 补强）。
 */
function computeManifestIntegrity(
    manifest: Pick<RegistryBuildManifest, 'name' | 'schemaVersion' | 'registryVersion' | 'items'>,
): string {
    const sortedItems: Array<[string, unknown]> = Object.entries(manifest.items)
        .sort(([a], [b]) => a.localeCompare(b));
    const canonical = JSON.stringify({
        name: manifest.name,
        schemaVersion: manifest.schemaVersion,
        registryVersion: manifest.registryVersion,
        items: sortedItems,
    });
    return crypto.createHash('sha256').update(canonical).digest('hex');
}

export function buildRegistryManifest(
    index: RegistryIndex,
    options: RegistryBuildManifestOptions
): RegistryBuildManifest {
    const sortedItems = [...index.items].sort((a, b) => a.name.localeCompare(b.name));
    const items: RegistryBuildManifest['items'] = {};

    for (const item of sortedItems) {
        items[item.name] = {
            integrity: item.integrity,
            fileCount: item.files.length,
            dependencies: [...item.dependencies].sort(),
            registryDependencies: [...item.registryDependencies].sort(),
            category: item.category,
            examples: [...(item.examples ?? [])].sort(),
            status: item.status,
            replacement: item.replacement,
        };
    }

    const baseManifest = {
        $schema: REGISTRY_MANIFEST_SCHEMA_URL,
        name: index.name,
        schemaVersion: options.schemaVersion ?? index.schemaVersion,
        registryVersion: options.registryVersion,
        buildTimestamp: options.buildTimestamp ?? null,
        gitCommit: options.gitCommit ?? null,
        itemCount: sortedItems.length,
        items,
    };

    const integrity = computeManifestIntegrity(baseManifest);

    return {
        ...baseManifest,
        integrity,
    };
}

export function assertRegistryDependencyGraph(
    items: Array<Pick<RegistryIndexItem, 'name' | 'registryDependencies'>>
): void {
    const cycles = findRegistryDependencyCycles(items);

    if (cycles.length > 0) {
        throw new Error(`Registry dependency cycle detected: ${cycles.map(cycle => cycle.join(' -> ')).join('; ')}`);
    }
}

function validateReusableRegistryItem(data: unknown, name: string): asserts data is RegistryItem {
    validateRegistryItem(data, { name, requireSchema: true });
    validateRegistryIntegrity(data, name);

    const importErrors = validateRegistryItemInternalImports(data);
    if (importErrors.length > 0) {
        throw new Error(importErrors.join('; '));
    }
}

function loadCache(): Record<string, string> {
    if (fs.existsSync(CACHE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        } catch { return {}; }
    }
    return {};
}

function saveCache(cache: Record<string, string>): void {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

function removeStaleRegistryFiles(expectedFiles: Set<string>): void {
    for (const fileName of fs.readdirSync(OUTPUT_DIR)) {
        if (!fileName.endsWith('.json') || expectedFiles.has(fileName)) continue;

        fs.unlinkSync(path.join(OUTPUT_DIR, fileName));
        console.log(`  Removed stale ${fileName}`);
    }
}

export function computeSourceHash(name: string, fileMapping: { files: string[]; composables?: string[]; directives?: string[] }): string {
    const parts: string[] = [JSON.stringify({
        cacheVersion: CACHE_VERSION,
        componentInfo: REGISTRY[name] ?? null,
        fileMapping,
        tailwind: TAILWIND_CONFIG,
        cssVars: CSS_VARS,
    })];
    const componentDeps = new Set(fileMapping.files);
    const addedComponentDeps = new Set<string>();
    const composableDeps = new Set(fileMapping.composables ?? []);
    const addedComposableDeps = new Set<string>();
    const localeDeps = new Set<string>();
    const libDeps = new Set<string>();

    const addComponentFile = (fileName: string) => {
        const filePath = path.join(UI_COMPONENTS_DIR, name, fileName);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Source file not found: ${filePath}`);
        }
        const code = readComponentSource(filePath);
        parts.push(code);
        const rewritten = rewriteImports(code, name, 'component');
        extractComponentFileDeps(rewritten, name).forEach(d => componentDeps.add(d));
        extractDeps(rewritten, 'composables').forEach(d => composableDeps.add(d));
        extractDeps(rewritten, 'locales').forEach(d => localeDeps.add(d));
        extractDeps(rewritten, 'lib').forEach(d => libDeps.add(d));
        addedComponentDeps.add(fileName);
    };
    const addComposableFile = (composableName: string) => {
        const composablePath = path.join(UI_COMPOSABLES_DIR, composableName);
        if (!fs.existsSync(composablePath)) {
            throw new Error(`Composable file not found: ${composablePath}`);
        }
        const code = readComponentSource(composablePath);
        parts.push(code);
        const rewritten = rewriteImports(code, name, 'composable');
        extractDeps(rewritten, 'composables').forEach(d => composableDeps.add(d));
        extractDeps(rewritten, 'locales').forEach(d => localeDeps.add(d));
        extractDeps(rewritten, 'lib').forEach(d => libDeps.add(d));
        addedComposableDeps.add(composableName);
    };

    while (addedComponentDeps.size < componentDeps.size) {
        const pendingComponentDeps = Array.from(componentDeps).filter(fileName => !addedComponentDeps.has(fileName));
        for (const fileName of pendingComponentDeps) {
            addComponentFile(fileName);
        }
    }
    const directiveDeps = new Set<string>(fileMapping.directives ?? []);
    const addedDirectiveDeps = new Set<string>();
    while (addedDirectiveDeps.size < directiveDeps.size) {
        const pendingDirectiveDeps = Array.from(directiveDeps).filter(d => !addedDirectiveDeps.has(d));
        for (const directiveName of pendingDirectiveDeps) {
            const directivePath = path.join(UI_DIRECTIVES_DIR, directiveName);
            if (!fs.existsSync(directivePath)) {
                throw new Error(`Directive file not found: ${directivePath}`);
            }
            const code = readComponentSource(directivePath);
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
            addComposableFile(composableName);
        }

        const pendingLocaleDeps = Array.from(localeDeps).filter(localeName => !addedLocaleDeps.has(localeName));
        for (const localeName of pendingLocaleDeps) {
            const localePath = path.join(UI_LOCALES_DIR, localeName);
            if (fs.existsSync(localePath)) {
                const code = readComponentSource(localePath);
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
        const libPath = path.join(UI_LIB_DIR, libName);
        if (!fs.existsSync(libPath)) {
            throw new Error(`Lib file not found: ${libPath}`);
        }
        const code = readComponentSource(libPath);
        const rewritten = rewriteImports(code, name, 'lib');
        extractDeps(rewritten, 'lib').forEach(d => libDeps.add(d));

        if (LIB_FILE_EXCLUDE.has(libName)) continue;
        parts.push(code);
    }

    return crypto.createHash('sha256').update(parts.join('\0')).digest('hex');
}

function readComponentSource(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
}

export function rewriteImports(code: string, componentName: string, context: RewriteContext = 'component'): string {
    // Rewrite relative imports from composable/lib files to @/ aliases
    code = code.replace(/(['"])\.\.\/composables\/([^'"]+)\1/g, (_m, q, rest) => `${q}@/composables/${rest}${q}`);
    code = code.replace(/(['"])\.\.\/lib\/([^'"]+)\1/g, (_m, q, rest) => `${q}@/lib/${rest}${q}`);
    code = code.replace(/(['"])\.\.\/locales\/([^'"]+)\1/g, (_m, q, rest) => `${q}@/locales/${rest}${q}`);

    code = code.replace(
        /(['"])\.\.\/components\/([a-zA-Z0-9-]+)\/([^'"]+)\1/g,
        (m, quote, comp, rest) => (REGISTRY[comp] ? `${quote}@/components/ui/${comp}/${rest}${quote}` : m)
    );

    // Rewrite cross-component imports: ../{component}/{file} → @/components/ui/{component}/{file}
    // Extract the component name directly from the path to avoid filename collision issues.
    code = code.replace(
        /(['"])\.\.\/([a-zA-Z0-9-]+)\/([^'"]+)\1/g,
        (m, quote, comp, rest) => (REGISTRY[comp] ? `${quote}@/components/ui/${comp}/${rest}${quote}` : m)
    );

    // Rewrite same-directory imports: ./{file} → @/<context-dir>/{file}
    // Context determines the target alias directory so same-directory imports in
    // composables/libs/directives aren't misrouted to @/components/ui/{componentName}/.
    // Only apply within <script> blocks for Vue files to avoid rewriting
    // CSS url('./...') or template attribute strings.
    const contextAliasPrefix: Record<RewriteContext, string> = {
        component: `@/components/ui/${componentName}/`,
        composable: '@/composables/',
        lib: '@/lib/',
        directive: '@/directives/',
        locale: '@/locales/',
    };
    const sameDirReplace = (block: string): string =>
        block.replace(
            /(['"])\.\/([^'"]+)\1/g,
            `$1${contextAliasPrefix[context]}$2$1`
        );

    if (/<script\b/i.test(code)) {
        code = code.replace(
            /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi,
            (_m, openTag: string, scriptContent: string, closeTag: string) =>
                `${openTag}${sameDirReplace(scriptContent)}${closeTag}`
        );
    } else {
        code = sameDirReplace(code);
    }

    return code;
}

export function extractDeps(code: string, dirPrefix: string): string[] {
    const deps = new Set<string>();
    const aliasPrefix = `@/${dirPrefix}/`;
    const baseDir = DIR_PREFIX_TO_BASE[dirPrefix];

    for (const specifier of extractModuleSpecifiers(code)) {
        if (!specifier.startsWith(aliasPrefix)) continue;

        const rawFileName = specifier.slice(aliasPrefix.length).split(/[?#]/)[0];
        const fileName = resolveExtension(rawFileName, baseDir);
        deps.add(fileName);
    }
    return Array.from(deps);
}

export function getFileType(filePath: string): RegistryFileType {
    const fileName = path.basename(filePath);

    if (filePath.endsWith('.vue')) return 'registry:ui';
    if (filePath.startsWith('composables/')) return 'registry:hook';
    if (filePath.startsWith('locales/')) return 'registry:lib';
    if (filePath.startsWith('lib/')) return 'registry:lib';
    if (filePath.startsWith('directives/')) return 'registry:directive';
    if (filePath.endsWith('.css')) return 'registry:ui';
    if (fileName.includes('-variants') || fileName.includes('-types') || fileName.includes('-key') || fileName === 'types.ts') return 'registry:lib';
    return 'registry:ui';
}

export function extractRegistryDeps(code: string, componentName: string): string[] {
    const deps = new Set<string>();
    const prefix = '@/components/ui/';

    for (const specifier of extractModuleSpecifiers(code)) {
        if (!specifier.startsWith(prefix)) continue;

        const depName = specifier.slice(prefix.length).split('/')[0];
        if (depName !== componentName && REGISTRY[depName]) {
            deps.add(depName);
        }
    }

    return Array.from(deps);
}

export function extractComponentFileDeps(code: string, componentName: string): string[] {
    const deps = new Set<string>();
    const prefix = `@/components/ui/${componentName}/`;
    const baseDir = path.join(UI_COMPONENTS_DIR, componentName);

    for (const specifier of extractModuleSpecifiers(code)) {
        if (!specifier.startsWith(prefix)) continue;

        const rawFileName = specifier.slice(prefix.length).split(/[?#]/)[0];
        const fileName = resolveExtension(rawFileName, baseDir);
        deps.add(fileName);
    }

    return Array.from(deps);
}

export function extractUnknownRegistryDeps(code: string): string[] {
    const deps = new Set<string>();
    const prefix = '@/components/ui/';

    for (const specifier of extractModuleSpecifiers(code)) {
        if (!specifier.startsWith(prefix)) continue;

        const depName = specifier.slice(prefix.length).split('/')[0];
        if (depName && !REGISTRY[depName]) {
            deps.add(depName);
        }
    }

    return Array.from(deps);
}

export function assertKnownRegistryDeps(code: string, ownerName: string, sourceLabel: string): string[] {
    const unknownDeps = extractUnknownRegistryDeps(code);
    if (unknownDeps.length > 0) {
        throw new Error(`Unknown registry component import(s) in "${ownerName}" (${sourceLabel}): ${unknownDeps.join(', ')}`);
    }

    return extractRegistryDeps(code, ownerName);
}

const TAILWIND_CONFIG = {};

function processComposables(
    composableDeps: Set<string>,
    addedComposables: Set<string>,
    name: string,
    files: RegistryFile[],
    allRegistryDeps: Set<string>,
    localeDeps: Set<string>,
    libDeps: Set<string>
): void {
    while (addedComposables.size < composableDeps.size) {
        const pendingComposables = Array.from(composableDeps).filter(
            composableName => !addedComposables.has(composableName)
        );

        for (const composableName of pendingComposables) {
            const composablePath = path.join(UI_COMPOSABLES_DIR, composableName);

            if (!fs.existsSync(composablePath)) {
                throw new Error(`Composable file not found at ${composablePath}`);
            }

            let code = readComponentSource(composablePath);
            code = rewriteImports(code, name, 'composable');
            assertKnownRegistryDeps(code, name, composableName).forEach(d => allRegistryDeps.add(d));
            extractDeps(code, 'composables').forEach(d => composableDeps.add(d));
            extractDeps(code, 'locales').forEach(d => localeDeps.add(d));
            extractDeps(code, 'lib').forEach(d => libDeps.add(d));

            files.push({
                path: `composables/${composableName}`,
                content: code,
                type: getFileType(`composables/${composableName}`)
            });
            addedComposables.add(composableName);
        }
    }
}

export function buildRegistryItem(name: string): RegistryItem {
    const componentInfo = REGISTRY[name];
    if (!componentInfo) {
        throw new Error(`No file mapping found for component "${name}"`);
    }

    const allRegistryDeps = new Set<string>();
    const files: RegistryFile[] = [];
    const componentFileDeps = new Set(componentInfo.files);
    const composableDeps = new Set(componentInfo.composables ?? []);
    const localeDeps = new Set<string>();
    const libDeps = new Set<string>();

    const addedComponentFiles = new Set<string>();
    while (addedComponentFiles.size < componentFileDeps.size) {
        const pendingComponentFiles = Array.from(componentFileDeps).filter(
            fileName => !addedComponentFiles.has(fileName)
        );

        for (const fileName of pendingComponentFiles) {
            const filePath = path.join(UI_COMPONENTS_DIR, name, fileName);

            if (!fs.existsSync(filePath)) {
                throw new Error(`Source file not found at ${filePath}`);
            }

            let code = readComponentSource(filePath);
            code = rewriteImports(code, name, 'component');

            assertKnownRegistryDeps(code, name, fileName).forEach(d => allRegistryDeps.add(d));
            extractComponentFileDeps(code, name).forEach(d => componentFileDeps.add(d));
            extractDeps(code, 'composables').forEach(d => composableDeps.add(d));
            extractDeps(code, 'locales').forEach(d => localeDeps.add(d));
            extractDeps(code, 'lib').forEach(d => libDeps.add(d));

            files.push({
                path: `components/ui/${name}/${fileName}`,
                content: code,
                type: getFileType(`components/ui/${name}/${fileName}`)
            });
            addedComponentFiles.add(fileName);
        }
    }

    const addedComposables = new Set<string>();
    processComposables(composableDeps, addedComposables, name, files, allRegistryDeps, localeDeps, libDeps);

    const addedDirectives = new Set<string>();
    const directiveDeps = new Set<string>(componentInfo.directives ?? []);
    while (addedDirectives.size < directiveDeps.size) {
        const pendingDirectives = Array.from(directiveDeps).filter(d => !addedDirectives.has(d));
        for (const directiveName of pendingDirectives) {
            const directivePath = path.join(UI_DIRECTIVES_DIR, directiveName);

            if (!fs.existsSync(directivePath)) {
                throw new Error(`Directive file not found at ${directivePath}`);
            }

            let code = readComponentSource(directivePath);
            code = rewriteImports(code, name, 'directive');
            assertKnownRegistryDeps(code, name, directiveName).forEach(d => allRegistryDeps.add(d));
            extractDeps(code, 'composables').forEach(d => composableDeps.add(d));
            extractDeps(code, 'locales').forEach(d => localeDeps.add(d));
            extractDeps(code, 'lib').forEach(d => libDeps.add(d));
            extractDeps(code, 'directives').forEach(d => directiveDeps.add(d));

            files.push({
                path: `directives/${directiveName}`,
                content: code,
                type: getFileType(`directives/${directiveName}`)
            });
            addedDirectives.add(directiveName);
        }
    }

    processComposables(composableDeps, addedComposables, name, files, allRegistryDeps, localeDeps, libDeps);

    const addedLocaleDeps = new Set<string>();
    while (addedLocaleDeps.size < localeDeps.size || (addedComposables.size < composableDeps.size)) {
        const pendingLocaleDeps = Array.from(localeDeps).filter(localeName => !addedLocaleDeps.has(localeName));
        for (const localeName of pendingLocaleDeps) {
            const localePath = path.join(UI_LOCALES_DIR, localeName);
            if (fs.existsSync(localePath)) {
                const code = rewriteImports(readComponentSource(localePath), name, 'locale');
                extractDeps(code, 'locales').forEach(d => localeDeps.add(d));
                extractDeps(code, 'composables').forEach(d => composableDeps.add(d));
                extractDeps(code, 'lib').forEach(d => libDeps.add(d));
            }
            addedLocaleDeps.add(localeName);
        }
        processComposables(composableDeps, addedComposables, name, files, allRegistryDeps, localeDeps, libDeps);
    }

    if (localeDeps.size > 0) {
        allRegistryDeps.add('locale-zh-cn');
    }

    for (const libName of libDeps) {
        const libPath = path.join(UI_LIB_DIR, libName);

        if (!fs.existsSync(libPath)) {
            throw new Error(`Lib file not found at ${libPath}`);
        }

        const code = rewriteImports(readComponentSource(libPath), name, 'lib');
        assertKnownRegistryDeps(code, name, libName).forEach(d => allRegistryDeps.add(d));
        extractDeps(code, 'lib').forEach(d => libDeps.add(d));

        if (LIB_FILE_EXCLUDE.has(libName)) continue;

        files.push({
            path: `lib/${libName}`,
            content: code,
            type: getFileType(`lib/${libName}`)
        });
    }

    const integrity = computeRegistryIntegrity(files);

    return {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name,
        type: 'registry:ui',
        title: componentInfo.title,
        description: componentInfo.description,
        category: componentInfo.category,
        examples: componentInfo.examples,
        status: componentInfo.status,
        replacement: componentInfo.replacement,
        dependencies: componentInfo.dependencies || [],
        registryDependencies: Array.from(allRegistryDeps),
        files,
        tailwind: TAILWIND_CONFIG,
        cssVars: CSS_VARS,
        integrity,
    } satisfies RegistryItem;
}

export async function run() {
    console.log('🚀 Starting registry build...');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const cache = loadCache();
    const newCache: Record<string, string> = {};
    // 字典序遍历：让 registry build 顺序成为稳定契约，doctor 漂移检测重算 integrity 时
    // 可与 manifest 的 files 顺序对齐（manifest 不再 .sort()，按此序存储）。
    const componentNames = Object.keys(REGISTRY).sort();
    console.log(`📦 Found ${componentNames.length} components to process.`);
    let errorCount = 0;
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')) as { version: string };

    // P0-4 性能基准：--bench flag 或 BRUTX_BENCH=1 时收集每组件/locale 耗时，末尾写入 bench.json
    const benchEnabled = process.argv.includes('--bench') || process.env.BRUTX_BENCH === '1';
    const timings: Array<{ name: string; ms: number; fileCount: number; cached: boolean }> = [];
    const benchStart = benchEnabled ? process.hrtime.bigint() : 0n;

    const registryIndex = {
        $schema: 'https://ui.shadcn.com/schema/registry.json',
        name: 'brutx-vue',
        homepage: 'https://lidaixingchen.github.io/brutxui-vue3/',
        schemaVersion: REGISTRY_SCHEMA_VERSION,
        registryVersion: packageJson.version,
        items: [] as RegistryIndexItem[]
    } satisfies RegistryIndex;

    const LOCALE_FILES = ['zh-CN.ts', 'types.ts'];
    const localeFiles: RegistryFile[] = [];
    const localeHashParts: string[] = [];
    for (const localeFile of LOCALE_FILES) {
        const localePath = path.join(UI_LOCALES_DIR, localeFile);
        if (fs.existsSync(localePath)) {
            const code = rewriteImports(readComponentSource(localePath), 'locale', 'locale');
            localeFiles.push({
                path: `locales/${localeFile}`,
                content: code,
                type: 'registry:lib'
            });
            localeHashParts.push(code);
        }
    }

    const localeHash = crypto.createHash('sha256').update([
        JSON.stringify({
            cacheVersion: CACHE_VERSION,
            tailwind: TAILWIND_CONFIG,
            cssVars: CSS_VARS,
        }),
        ...localeHashParts,
    ].join('\0')).digest('hex');
    const localeOutputPath = path.join(OUTPUT_DIR, 'locale-zh-cn.json');

    if (cache['locale-zh-cn'] === localeHash && fs.existsSync(localeOutputPath) && localeFiles.length > 0) {
        try {
            const existingLocaleItem = JSON.parse(fs.readFileSync(localeOutputPath, 'utf-8'));
            validateReusableRegistryItem(existingLocaleItem, 'locale-zh-cn');
            registryIndex.items.push({
                name: existingLocaleItem.name,
                type: existingLocaleItem.type,
                title: existingLocaleItem.title,
                description: existingLocaleItem.description,
                status: existingLocaleItem.status,
                replacement: existingLocaleItem.replacement,
                dependencies: existingLocaleItem.dependencies,
                registryDependencies: existingLocaleItem.registryDependencies,
                files: existingLocaleItem.files.map((f: RegistryFile) => ({
                    path: f.path,
                    type: f.type
                })),
                tailwind: TAILWIND_CONFIG,
                cssVars: CSS_VARS,
                integrity: existingLocaleItem.integrity
            });
            newCache['locale-zh-cn'] = localeHash;
            console.log('⊘ Skipped locale-zh-cn (unchanged)');
        } catch (cacheErr) {
            console.warn(`⚠ Cache reuse for locale-zh-cn failed, rebuilding: ${cacheErr instanceof Error ? cacheErr.message : cacheErr}`);
        }
    } else if (localeFiles.length > 0) {
        const localeIntegrity = computeRegistryIntegrity(localeFiles);

        const localeItem = {
            $schema: 'https://ui.shadcn.com/schema/registry-item.json',
            name: 'locale-zh-cn',
            type: 'registry:lib',
            title: 'Locale Zh CN',
            description: 'Chinese (Simplified) locale data files for BrutxUI components.',
            dependencies: [] as string[],
            registryDependencies: [] as string[],
            files: localeFiles,
            tailwind: TAILWIND_CONFIG,
            cssVars: CSS_VARS,
            integrity: localeIntegrity
        } satisfies RegistryItem;

        fs.writeFileSync(localeOutputPath, JSON.stringify(localeItem, null, 2), 'utf-8');
        console.log(`✓ Generated locale-zh-cn.json (${localeFiles.length} files)`);
        newCache['locale-zh-cn'] = localeHash;

        registryIndex.items.push({
            name: 'locale-zh-cn',
            type: 'registry:lib',
            title: 'Locale Zh CN',
            description: 'Chinese (Simplified) locale data files for BrutxUI components.',
            dependencies: [],
            registryDependencies: [],
            files: localeFiles.map(f => ({ path: f.path, type: f.type })),
            tailwind: TAILWIND_CONFIG,
            cssVars: CSS_VARS,
            integrity: localeIntegrity
        });
    }

    for (const name of componentNames) {
        const itemStart = benchEnabled ? process.hrtime.bigint() : 0n;
        try {
            const componentInfo = REGISTRY[name];
            const fileMapping = componentInfo;

            if (!fileMapping) {
                throw new Error(`No file mapping found for component "${name}"`);
            }

            const sourceHash = computeSourceHash(name, fileMapping);
            const outputPath = path.join(OUTPUT_DIR, `${name}.json`);

            if (cache[name] === sourceHash && fs.existsSync(outputPath)) {
                try {
                    const existingItem = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
                    validateReusableRegistryItem(existingItem, name);
                    registryIndex.items.push({
                        name: existingItem.name,
                        type: existingItem.type,
                        title: existingItem.title,
                        description: existingItem.description,
                        category: existingItem.category,
                        examples: existingItem.examples,
                        status: existingItem.status,
                        replacement: existingItem.replacement,
                        dependencies: existingItem.dependencies,
                        registryDependencies: existingItem.registryDependencies,
                        files: existingItem.files.map((f: RegistryFile) => ({
                            path: f.path,
                            type: f.type
                        })),
                        tailwind: TAILWIND_CONFIG,
                        cssVars: CSS_VARS,
                        integrity: existingItem.integrity
                    });
                    newCache[name] = sourceHash;
                    console.log(`⊘ Skipped ${name} (unchanged)`);
                    if (benchEnabled) {
                        timings.push({ name, ms: Number(process.hrtime.bigint() - itemStart) / 1e6, fileCount: existingItem.files.length, cached: true });
                    }
                    continue;
                } catch (cacheErr) {
                    console.warn(`⚠ Cache reuse for ${name} failed, rebuilding: ${cacheErr instanceof Error ? cacheErr.message : cacheErr}`);
                }
            }

            const registryItem = buildRegistryItem(name);

            fs.writeFileSync(outputPath, JSON.stringify(registryItem, null, 2), 'utf-8');
            console.log(`✓ Generated ${name}.json (${registryItem.files.length} files, Registry dependencies: [${registryItem.registryDependencies.join(', ')}])`);
            newCache[name] = sourceHash;

            registryIndex.items.push({
                name: registryItem.name,
                type: registryItem.type,
                title: registryItem.title,
                description: registryItem.description,
                category: registryItem.category,
                examples: registryItem.examples,
                status: registryItem.status,
                replacement: registryItem.replacement,
                dependencies: registryItem.dependencies,
                registryDependencies: registryItem.registryDependencies,
                files: registryItem.files.map(f => ({
                    path: f.path,
                    type: f.type
                })),
                tailwind: registryItem.tailwind,
                cssVars: registryItem.cssVars,
                integrity: registryItem.integrity
            });
            if (benchEnabled) {
                timings.push({ name, ms: Number(process.hrtime.bigint() - itemStart) / 1e6, fileCount: registryItem.files.length, cached: false });
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error(`✗ Failed to process component ${name}:`, errorMessage);
            const stalePath = path.join(OUTPUT_DIR, `${name}.json`);
            if (fs.existsSync(stalePath)) {
                fs.unlinkSync(stalePath);
                console.log(`  Removed stale ${name}.json`);
            }
            errorCount++;
        }
    }

    assertRegistryDependencyGraph(registryIndex.items);

    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(registryIndex, null, 2), 'utf-8');
    console.log('✓ Generated index.json');

    const manifest = buildRegistryManifest(registryIndex, {
        registryVersion: packageJson.version,
        schemaVersion: REGISTRY_SCHEMA_VERSION,
        buildTimestamp: process.env.BRUTX_REGISTRY_BUILD_TIMESTAMP ?? null,
        gitCommit: process.env.GITHUB_SHA ?? process.env.COMMIT_SHA ?? null,
    });
    const manifestPath = path.join(OUTPUT_DIR, 'registry-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log('✓ Generated registry-manifest.json');

    removeStaleRegistryFiles(new Set([
        'index.json',
        'registry-manifest.json',
        ...registryIndex.items.map(item => `${item.name}.json`),
    ]));

    saveCache(newCache);

    if (benchEnabled) {
        const totalMs = Number(process.hrtime.bigint() - benchStart) / 1e6;
        // 按耗时降序，便于一眼定位瓶颈组件
        const sortedTimings = [...timings].sort((a, b) => b.ms - a.ms);
        const cachedCount = sortedTimings.filter(t => t.cached).length;
        const rebuiltCount = sortedTimings.length - cachedCount;
        const benchReport = {
            totalMs,
            itemCount: sortedTimings.length,
            cachedCount,
            rebuiltCount,
            items: sortedTimings,
        };
        fs.writeFileSync(BENCH_FILE, JSON.stringify(benchReport, null, 2), 'utf-8');
        console.log(`📊 Bench: ${sortedTimings.length} items, ${cachedCount} cached, ${rebuiltCount} rebuilt, total ${totalMs.toFixed(2)}ms`);
        console.log(`📊 Slowest 5: ${sortedTimings.slice(0, 5).map(t => `${t.name}=${t.ms.toFixed(1)}ms`).join(', ')}`);
        console.log(`📊 Written to ${path.relative(process.cwd(), BENCH_FILE)}`);
    }

    if (errorCount > 0) {
        console.warn(`⚠ Registry build completed with ${errorCount} component error(s). Failed components are excluded from index.json.`);
        if (!isVitestRuntime) {
            process.exitCode = 1;
        }
    }

    console.log('🎉 Registry built!');
}

const isVitestRuntime = process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined;

if (!isVitestRuntime && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    run().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
