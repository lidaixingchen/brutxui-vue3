import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
    COMPONENTS,
    computeRegistryIntegrity,
    validateRegistryItem,
} from 'brutx-shared-vue';
import type {
    RegistryFile,
    RegistryFileType,
    RegistryIndex,
    RegistryIndexItem,
    RegistryItem,
} from 'brutx-shared-vue';
import { COMPONENT_FILES } from './component-files';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_COMPONENTS_DIR = path.resolve(__dirname, '../../ui/src/components');
const UI_COMPOSABLES_DIR = path.resolve(__dirname, '../../ui/src/composables');
const UI_LOCALES_DIR = path.resolve(__dirname, '../../ui/src/locales');
const UI_LIB_DIR = path.resolve(__dirname, '../../ui/src/lib');
const UI_DIRECTIVES_DIR = path.resolve(__dirname, '../../ui/src/directives');
const OUTPUT_DIR = path.resolve(__dirname, '../registry');

type RewriteContext = 'component' | 'composable' | 'lib' | 'directive';

// utils.ts is excluded from registry — consumers must create their own lib/utils.ts via CLI init.
// This file provides the cn() utility (clsx + tailwind-merge) and is project-specific.
const LIB_FILE_EXCLUDE = new Set<string>(['utils.ts']);

const CACHE_FILE = path.resolve(__dirname, '../.registry-cache.json');
const CACHE_VERSION = 2;

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

function computeSourceHash(name: string, fileMapping: { files: string[]; composables?: string[]; directives?: string[] }): string {
    const parts: string[] = [JSON.stringify({
        cacheVersion: CACHE_VERSION,
        componentInfo: COMPONENTS[name] ?? null,
        fileMapping,
        tailwind: TAILWIND_CONFIG,
        cssVars: CSS_VARS,
    })];
    const libDeps = new Set<string>();

    for (const fileName of fileMapping.files) {
        const filePath = path.join(UI_COMPONENTS_DIR, name, fileName);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Source file not found: ${filePath}`);
        }
        const code = readComponentSource(filePath);
        parts.push(code);
        const rewritten = rewriteImports(code, name, 'component');
        extractDeps(rewritten, 'lib').forEach(d => libDeps.add(d));
    }
    for (const composableName of fileMapping.composables ?? []) {
        const composablePath = path.join(UI_COMPOSABLES_DIR, composableName);
        if (!fs.existsSync(composablePath)) {
            throw new Error(`Composable file not found: ${composablePath}`);
        }
        const code = readComponentSource(composablePath);
        parts.push(code);
        const rewritten = rewriteImports(code, name, 'composable');
        extractDeps(rewritten, 'lib').forEach(d => libDeps.add(d));
    }
    for (const directiveName of fileMapping.directives ?? []) {
        const directivePath = path.join(UI_DIRECTIVES_DIR, directiveName);
        if (!fs.existsSync(directivePath)) {
            throw new Error(`Directive file not found: ${directivePath}`);
        }
        const code = readComponentSource(directivePath);
        parts.push(code);
        const rewritten = rewriteImports(code, name, 'directive');
        extractDeps(rewritten, 'lib').forEach(d => libDeps.add(d));
    }

    for (const libName of libDeps) {
        if (LIB_FILE_EXCLUDE.has(libName)) continue;
        const libPath = path.join(UI_LIB_DIR, libName);
        if (fs.existsSync(libPath)) {
            parts.push(readComponentSource(libPath));
        }
    }

    return crypto.createHash('sha256').update(parts.join('\0')).digest('hex');
}

function readComponentSource(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
}

export function rewriteImports(code: string, componentName: string, context: RewriteContext = 'component'): string {
    // Rewrite relative imports from composable/lib files to @/ aliases
    code = code.replace(/['"]\.\.\/composables\/([^'"]+)['"]/g, "'@/composables/$1'");
    code = code.replace(/['"]\.\.\/lib\/([^'"]+)['"]/g, "'@/lib/$1'");
    code = code.replace(/['"]\.\.\/locales\/([^'"]+)['"]/g, "'@/locales/$1'");

    code = code.replace(
        /['"]\.\.\/components\/([a-zA-Z0-9-]+)\/([^'"]+)['"]/g,
        (m, comp, rest) => (COMPONENT_FILES[comp] ? `'@/components/ui/${comp}/${rest}'` : m)
    );

    // Rewrite cross-component imports: ../{component}/{file} → @/components/ui/{component}/{file}
    // Extract the component name directly from the path to avoid filename collision issues.
    code = code.replace(
        /(['"])\.\.\/([a-zA-Z0-9-]+)\/([^'"]+)\1/g,
        (m, quote, comp, rest) => (COMPONENT_FILES[comp] ? `${quote}@/components/ui/${comp}/${rest}${quote}` : m)
    );

    // Rewrite same-directory imports: ./{file} → @/<context-dir>/{file}
    // Context determines the target alias directory so same-directory imports in
    // composables/libs/directives aren't misrouted to @/components/ui/{componentName}/.
    const contextAliasPrefix: Record<RewriteContext, string> = {
        component: `@/components/ui/${componentName}/`,
        composable: '@/composables/',
        lib: '@/lib/',
        directive: '@/directives/',
    };
    code = code.replace(
        /(['"])\.\/([^'"]+)\1/g,
        `$1${contextAliasPrefix[context]}$2$1`
    );

    return code;
}

export function extractDeps(code: string, dirPrefix: string): string[] {
    const deps = new Set<string>();
    const pattern = new RegExp(`@/${dirPrefix}/([^'";\\s]+)`, 'g');
    for (const match of code.matchAll(pattern)) {
        const fileName = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
        deps.add(fileName);
    }
    return Array.from(deps);
}

export function getFileType(filePath: string): RegistryFileType {
    if (filePath.endsWith('.vue')) return 'registry:ui';
    if (filePath.endsWith('.css')) return 'registry:ui';
    if (filePath.includes('-variants') || filePath.includes('-types') || filePath.includes('-key')) return 'registry:lib';
    if (filePath.startsWith('composables/')) return 'registry:hook';
    if (filePath.startsWith('locales/')) return 'registry:lib';
    if (filePath.startsWith('lib/')) return 'registry:lib';
    if (filePath.startsWith('directives/')) return 'registry:directive';
    return 'registry:ui';
}

export function extractRegistryDeps(code: string, componentName: string): string[] {
    const deps = new Set<string>();
    const matches = code.match(/@\/components\/ui\/([a-zA-Z0-9-]+)/g);
    if (matches) {
        for (const match of matches) {
            const depName = match.replace('@/components/ui/', '');
            if (depName !== componentName && COMPONENT_FILES[depName]) {
                deps.add(depName);
            }
        }
    }
    return Array.from(deps);
}

const TAILWIND_CONFIG = {
    config: {
        theme: {
            extend: {
                borderWidth: {
                    '3': 'var(--brutal-border-width, 3px)'
                },
                borderColor: {
                    brutal: 'var(--brutal-border-color, #000000)'
                },
                borderRadius: {
                    brutal: 'var(--brutal-radius, 0px)'
                },
                colors: {
                    'brutal-bg': 'var(--brutal-bg)',
                    'brutal-fg': 'var(--brutal-fg)',
                    'brutal-primary': 'var(--brutal-primary)',
                    'brutal-secondary': 'var(--brutal-secondary)',
                    'brutal-accent': 'var(--brutal-accent)',
                    'brutal-destructive': 'var(--brutal-destructive)',
                    'brutal-success': 'var(--brutal-success)',
                    'brutal-muted': 'var(--brutal-muted)',
                    'brutal-ring': 'var(--brutal-ring)',
                    'brutal-info': 'var(--brutal-info)',
                    'brutal-muted-foreground': 'var(--brutal-muted-foreground)',
                    'brutal-overlay': 'var(--brutal-overlay)',
                    'brutal-placeholder': 'var(--brutal-placeholder)'
                },
                boxShadow: {
                    brutal: 'var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-shadow-color, #000000)',
                    'brutal-sm': 'calc(var(--brutal-shadow-offset-x, 4px) / 2) calc(var(--brutal-shadow-offset-y, 4px) / 2) 0px 0px var(--brutal-shadow-color, #000000)',
                    'brutal-lg': 'calc(var(--brutal-shadow-offset-x, 4px) * 1.5) calc(var(--brutal-shadow-offset-y, 4px) * 1.5) 0px 0px var(--brutal-shadow-color, #000000)',
                    'brutal-xl': 'calc(var(--brutal-shadow-offset-x, 4px) * 2) calc(var(--brutal-shadow-offset-y, 4px) * 2) 0px 0px var(--brutal-shadow-color, #000000)',
                    'brutal-primary': 'var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-primary)',
                    'brutal-secondary': 'var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-secondary)'
                }
            }
        }
    }
};

const CSS_VARS = {
    light: {
        'brutal-border-width': '3px',
        'brutal-border-color': '#000000',
        'brutal-shadow-offset-x': '4px',
        'brutal-shadow-offset-y': '4px',
        'brutal-shadow-color': '#000000',
        'brutal-radius': '0px',
        'brutal-pressed-offset': '2px',
        'brutal-bg': '#ffffff',
        'brutal-fg': '#000000',
        'brutal-primary': '#FF6B6B',
        'brutal-secondary': '#4ECDC4',
        'brutal-accent': '#FFE66D',
        'brutal-destructive': '#EF476F',
        'brutal-success': '#7FB069',
        'brutal-muted': '#f3f4f6',
        'brutal-ring': '#000000',
        'brutal-info': '#4A90D9',
        'brutal-muted-foreground': '#4B5563',
        'brutal-overlay': 'rgba(0, 0, 0, 0.5)',
        'brutal-placeholder': '#9CA3AF'
    },
    dark: {
        'brutal-border-width': '3px',
        'brutal-border-color': '#ffffff',
        'brutal-shadow-offset-x': '4px',
        'brutal-shadow-offset-y': '4px',
        'brutal-shadow-color': '#ffffff',
        'brutal-radius': '0px',
        'brutal-pressed-offset': '2px',
        'brutal-bg': '#141414',
        'brutal-fg': '#ffffff',
        'brutal-primary': '#FF6B6B',
        'brutal-secondary': '#4ECDC4',
        'brutal-accent': '#FFE66D',
        'brutal-destructive': '#EF476F',
        'brutal-success': '#7FB069',
        'brutal-muted': '#1e1e1e',
        'brutal-ring': '#ffffff',
        'brutal-info': '#3B82F6',
        'brutal-muted-foreground': '#9CA3AF',
        'brutal-overlay': 'rgba(0, 0, 0, 0.7)',
        'brutal-placeholder': '#6B7280'
    }
};

export async function run() {
    console.log('🚀 Starting registry build...');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const cache = loadCache();
    const newCache: Record<string, string> = {};
    const componentNames = Object.keys(COMPONENT_FILES);
    console.log(`📦 Found ${componentNames.length} components to process.`);
    let errorCount = 0;

    const registryIndex = {
        $schema: 'https://ui.shadcn.com/schema/registry.json',
        name: 'brutx-vue',
        homepage: 'https://lidaixingchen.github.io/brutxui-vue3/',
        items: [] as RegistryIndexItem[]
    } satisfies RegistryIndex;

    const LOCALE_FILES = ['zh-CN.ts', 'types.ts'];
    const localeFiles: RegistryFile[] = [];
    const localeHashParts: string[] = [];
    for (const localeFile of LOCALE_FILES) {
        const localePath = path.join(UI_LOCALES_DIR, localeFile);
        if (fs.existsSync(localePath)) {
            const code = readComponentSource(localePath);
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
            validateRegistryItem(existingLocaleItem, { name: 'locale-zh-cn', requireSchema: true });
            registryIndex.items.push({
                name: existingLocaleItem.name,
                type: existingLocaleItem.type,
                title: existingLocaleItem.title,
                description: existingLocaleItem.description,
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
        } catch { /* fall through to rebuild */ }
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
        try {
            const componentInfo = COMPONENTS[name];
            const fileMapping = COMPONENT_FILES[name];

            if (!fileMapping) {
                throw new Error(`No file mapping found for component "${name}"`);
            }

            const sourceHash = computeSourceHash(name, fileMapping);
            const outputPath = path.join(OUTPUT_DIR, `${name}.json`);

            if (cache[name] === sourceHash && fs.existsSync(outputPath)) {
                try {
                    const existingItem = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
                    validateRegistryItem(existingItem, { name, requireSchema: true });
                    registryIndex.items.push({
                        name: existingItem.name,
                        type: existingItem.type,
                        title: existingItem.title,
                        description: existingItem.description,
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
                    continue;
                } catch { /* fall through to rebuild */ }
            }

            const allRegistryDeps = new Set<string>();
            const files: RegistryFile[] = [];
            const composableDeps = new Set(fileMapping.composables ?? []);
            const localeDeps = new Set<string>();
            const libDeps = new Set<string>();

            for (const fileName of fileMapping.files) {
                const filePath = path.join(UI_COMPONENTS_DIR, name, fileName);

                if (!fs.existsSync(filePath)) {
                    throw new Error(`Source file not found at ${filePath}`);
                }

                let code = readComponentSource(filePath);
                code = rewriteImports(code, name, 'component');

                const deps = extractRegistryDeps(code, name);
                deps.forEach(d => allRegistryDeps.add(d));
                extractDeps(code, 'composables').forEach(d => composableDeps.add(d));
                extractDeps(code, 'locales').forEach(d => localeDeps.add(d));
                extractDeps(code, 'lib').forEach(d => libDeps.add(d));

                files.push({
                    path: `components/ui/${name}/${fileName}`,
                    content: code,
                    type: getFileType(`components/ui/${name}/${fileName}`)
                });
            }

            const addedComposables = new Set<string>();
            while (addedComposables.size < composableDeps.size) {
                const pendingComposables = Array.from(composableDeps).filter((composableName) => !addedComposables.has(composableName));

                for (const composableName of pendingComposables) {
                    const composablePath = path.join(UI_COMPOSABLES_DIR, composableName);

                    if (!fs.existsSync(composablePath)) {
                        throw new Error(`Composable file not found at ${composablePath}`);
                    }

                    let code = readComponentSource(composablePath);
                    code = rewriteImports(code, name, 'composable');
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

            for (const directiveName of fileMapping.directives ?? []) {
                const directivePath = path.join(UI_DIRECTIVES_DIR, directiveName);

                if (!fs.existsSync(directivePath)) {
                    throw new Error(`Directive file not found at ${directivePath}`);
                }

                let code = readComponentSource(directivePath);
                code = rewriteImports(code, name, 'directive');
                const deps = extractRegistryDeps(code, name);
                deps.forEach(d => allRegistryDeps.add(d));
                extractDeps(code, 'composables').forEach(d => composableDeps.add(d));
                extractDeps(code, 'locales').forEach(d => localeDeps.add(d));
                extractDeps(code, 'lib').forEach(d => libDeps.add(d));

                files.push({
                    path: `directives/${directiveName}`,
                    content: code,
                    type: getFileType(`directives/${directiveName}`)
                });
            }

            if (localeDeps.size > 0) {
                allRegistryDeps.add('locale-zh-cn');
            }

            for (const libName of libDeps) {
                if (LIB_FILE_EXCLUDE.has(libName)) continue;

                const libPath = path.join(UI_LIB_DIR, libName);

                if (!fs.existsSync(libPath)) {
                    throw new Error(`Lib file not found at ${libPath}`);
                }

                const code = rewriteImports(readComponentSource(libPath), name, 'lib');

                files.push({
                    path: `lib/${libName}`,
                    content: code,
                    type: getFileType(`lib/${libName}`)
                });
            }

            const title = name
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            const description = componentInfo?.description
                || `A highly customizable neo-brutalist ${title} component built with Brutx design tokens for Vue 3.`;

            const integrity = computeRegistryIntegrity(files);

            const registryItem = {
                $schema: 'https://ui.shadcn.com/schema/registry-item.json',
                name: name,
                type: 'registry:ui',
                title: title,
                description: description,
                dependencies: componentInfo?.dependencies || [],
                registryDependencies: Array.from(allRegistryDeps),
                files,
                tailwind: TAILWIND_CONFIG,
                cssVars: CSS_VARS,
                integrity
            } satisfies RegistryItem;

            fs.writeFileSync(outputPath, JSON.stringify(registryItem, null, 2), 'utf-8');
            console.log(`✓ Generated ${name}.json (${files.length} files, Registry dependencies: [${Array.from(allRegistryDeps).join(', ')}])`);
            newCache[name] = sourceHash;

            registryIndex.items.push({
                name: name,
                type: 'registry:ui',
                title: title,
                description: description,
                dependencies: componentInfo?.dependencies || [],
                registryDependencies: Array.from(allRegistryDeps),
                files: files.map(f => ({
                    path: f.path,
                    type: f.type
                })),
                tailwind: TAILWIND_CONFIG,
                cssVars: CSS_VARS,
                integrity
            });
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

    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(registryIndex, null, 2), 'utf-8');
    console.log('✓ Generated index.json');

    saveCache(newCache);

    if (errorCount > 0) {
        console.warn(`⚠ Registry build completed with ${errorCount} component error(s). Failed components are excluded from index.json.`);
    }

    console.log('🎉 Registry built!');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    run().catch(console.error);
}
