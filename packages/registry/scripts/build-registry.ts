import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { COMPONENTS } from 'brutx-shared-vue';
import { COMPONENT_FILES } from './component-files';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_COMPONENTS_DIR = path.resolve(__dirname, '../../ui/src/components');
const UI_COMPOSABLES_DIR = path.resolve(__dirname, '../../ui/src/composables');
const UI_LOCALES_DIR = path.resolve(__dirname, '../../ui/src/locales');
const UI_LIB_DIR = path.resolve(__dirname, '../../ui/src/lib');
const OUTPUT_DIR = path.resolve(__dirname, '../registry');

const LIB_FILE_EXCLUDE = new Set<string>(['utils.ts']);

function readComponentSource(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
}

function rewriteImports(code: string, componentName: string): string {
    code = code.replace(/['"]\.\.\/lib\/([^'"]+)['"]/g, "'@/lib/$1'");
    code = code.replace(/['"]\.\.\/\.\.\/lib\/([^'"]+)['"]/g, "'@/lib/$1'");
    code = code.replace(/['"]\.\.\/composables\/([^'"]+)['"]/g, "'@/composables/$1'");
    code = code.replace(/['"]\.\.\/\.\.\/composables\/([^'"]+)['"]/g, "'@/composables/$1'");
    code = code.replace(/['"]\.\.\/locales\/([^'"]+)['"]/g, "'@/locales/$1'");
    code = code.replace(/['"]\.\.\/\.\.\/locales\/([^'"]+)['"]/g, "'@/locales/$1'");
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

    // Rewrite same-directory imports: ./{file} → @/components/ui/{componentName}/{file}
    // Use the current component name to avoid collisions between components sharing file names (e.g. types.ts).
    code = code.replace(
        /(['"])\.\/([^'"]+)\1/g,
        `$1@/components/ui/${componentName}/$2$1`
    );

    return code;
}

function extractComposableDeps(code: string): string[] {
    const deps = new Set<string>();
    const patterns = [
        /@\/composables\/([^'";\s]+)/g,
        /\.\.\/\.\.\/composables\/([^'";\s]+)/g,
        /\.\.\/composables\/([^'";\s]+)/g,
    ];

    for (const pattern of patterns) {
        for (const match of code.matchAll(pattern)) {
            const fileName = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
            deps.add(fileName);
        }
    }

    return Array.from(deps);
}

function extractLibDeps(code: string): string[] {
    const deps = new Set<string>();
    const patterns = [
        /@\/lib\/([^'";\s]+)/g,
        /\.\.\/\.\.\/lib\/([^'";\s]+)/g,
        /\.\.\/lib\/([^'";\s]+)/g,
    ];

    for (const pattern of patterns) {
        for (const match of code.matchAll(pattern)) {
            const fileName = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
            deps.add(fileName);
        }
    }

    return Array.from(deps);
}

function extractLocaleDeps(code: string): string[] {
    const deps = new Set<string>();
    const patterns = [
        /@\/locales\/([^'";\s]+)/g,
        /\.\.\/\.\.\/locales\/([^'";\s]+)/g,
        /\.\.\/locales\/([^'";\s]+)/g,
    ];

    for (const pattern of patterns) {
        for (const match of code.matchAll(pattern)) {
            const fileName = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
            deps.add(fileName);
        }
    }

    return Array.from(deps);
}

function extractRegistryDeps(code: string, componentName: string): string[] {
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

interface RegistryIndexFile {
    path: string;
    type: string;
}

interface RegistryIndexItem {
    name: string;
    type: string;
    title: string;
    description: string;
    dependencies: string[];
    registryDependencies: string[];
    files: RegistryIndexFile[];
    tailwind: typeof TAILWIND_CONFIG;
    cssVars: typeof CSS_VARS;
}

interface RegistryIndex {
    name: string;
    homepage: string;
    items: RegistryIndexItem[];
}

async function run() {
    console.log('🚀 Starting registry build...');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const componentNames = Object.keys(COMPONENT_FILES);
    console.log(`📦 Found ${componentNames.length} components to process.`);
    let errorCount = 0;

    const registryIndex: RegistryIndex = {
        name: 'brutx-vue',
        homepage: 'https://lidaixingchen.github.io/brutxui-vue3/',
        items: []
    };

    for (const name of componentNames) {
        try {
            const componentInfo = COMPONENTS[name];
            const fileMapping = COMPONENT_FILES[name];

            if (!fileMapping) {
                throw new Error(`No file mapping found for component "${name}"`);
            }

            const allRegistryDeps = new Set<string>();
            const files: { path: string; content: string; type: string }[] = [];
            const composableDeps = new Set(fileMapping.composables ?? []);
            const localeDeps = new Set(fileMapping.locales ?? []);
            const libDeps = new Set<string>();

            for (const fileName of fileMapping.files) {
                const filePath = path.join(UI_COMPONENTS_DIR, name, fileName);

                if (!fs.existsSync(filePath)) {
                    throw new Error(`Source file not found at ${filePath}`);
                }

                let code = readComponentSource(filePath);
                code = rewriteImports(code, name);

                const deps = extractRegistryDeps(code, name);
                deps.forEach(d => allRegistryDeps.add(d));
                extractComposableDeps(code).forEach(d => composableDeps.add(d));
                extractLocaleDeps(code).forEach(d => localeDeps.add(d));
                extractLibDeps(code).forEach(d => libDeps.add(d));

                files.push({
                    path: `components/ui/${name}/${fileName}`,
                    content: code,
                    type: 'registry:ui'
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
                    code = rewriteImports(code, name);
                    extractComposableDeps(code).forEach(d => composableDeps.add(d));
                    extractLocaleDeps(code).forEach(d => localeDeps.add(d));
                    extractLibDeps(code).forEach(d => libDeps.add(d));

                    files.push({
                        path: `composables/${composableName}`,
                        content: code,
                        type: 'registry:ui'
                    });
                    addedComposables.add(composableName);
                }
            }

            for (const localeName of localeDeps) {
                const localePath = path.join(UI_LOCALES_DIR, localeName);

                if (!fs.existsSync(localePath)) {
                    throw new Error(`Locale file not found at ${localePath}`);
                }

                const code = rewriteImports(readComponentSource(localePath), name);

                files.push({
                    path: `locales/${localeName}`,
                    content: code,
                    type: 'registry:ui'
                });
            }

            for (const libName of libDeps) {
                if (LIB_FILE_EXCLUDE.has(libName)) continue;

                const libPath = path.join(UI_LIB_DIR, libName);

                if (!fs.existsSync(libPath)) {
                    throw new Error(`Lib file not found at ${libPath}`);
                }

                const code = rewriteImports(readComponentSource(libPath), name);

                files.push({
                    path: `lib/${libName}`,
                    content: code,
                    type: 'registry:ui'
                });
            }

            const title = name
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            const description = `A highly customizable neo-brutalist ${title} component built with Brutx design tokens for Vue 3.`;

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
                cssVars: CSS_VARS
            };

            const outputPath = path.join(OUTPUT_DIR, `${name}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(registryItem, null, 2), 'utf-8');
            console.log(`✓ Generated ${name}.json (${files.length} files, Registry dependencies: [${Array.from(allRegistryDeps).join(', ')}])`);

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
                cssVars: CSS_VARS
            });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error(`✗ Failed to process component ${name}:`, errorMessage);
            errorCount++;
        }
    }

    if (errorCount > 0) {
        throw new Error(`Registry build failed with ${errorCount} component error(s).`);
    }

    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(registryIndex, null, 2), 'utf-8');
    console.log('✓ Generated index.json');
    console.log('🎉 Registry built successfully!');
}

run().catch(console.error);
