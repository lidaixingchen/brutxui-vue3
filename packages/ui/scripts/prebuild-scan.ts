/**
 * Prebuild scan: generates registry-manifest.json from source code.
 *
 * Scans packages/ui/src/components/ using AST-based dependency discovery,
 * outputs packages/ui/registry-manifest.json (source-side, not in dist).
 *
 * This manifest replaces the hand-maintained files/composables/directives fields
 * previously in COMPONENT_FILES. Human-maintained metadata (title/description/category etc.)
 * remains in COMPONENT_METADATA.
 *
 * Also outputs packages/ui/exports-manifest.json: a flat list of all component
 * names, composable files, and directive files. Consumed by generate-exports.ts
 * and generate-component-index.ts.
 *
 * Manual overrides below cover convention-based dependencies that AST scanning
 * cannot discover (no import link between source files).
 *
 * Usage: pnpm prebuild:scan
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanComponentFiles, type ComponentFileManifest } from 'brutx-shared-vue/scan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UI_SRC_DIR = path.resolve(__dirname, '..', 'src');
const OUTPUT_FILE = path.resolve(__dirname, '..', 'registry-manifest.json');
const EXPORTS_MANIFEST_FILE = path.resolve(__dirname, '..', 'exports-manifest.json');

interface ExportsManifest {
    components: string[];
    composables: string[];
    directives: string[];
}

const TEST_FILE_PATTERN = /\.(test|spec)\.(ts|js|tsx|jsx)$/;

/**
 * List public source files in a directory (excluding tests and index.ts aggregator).
 * Returns filenames relative to the directory (e.g. 'useToast.ts').
 */
function listPublicSourceFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const result: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        if (TEST_FILE_PATTERN.test(entry.name)) continue;
        if (entry.name === 'index.ts') continue;
        if (entry.name.endsWith('.ts')) {
            result.push(entry.name);
        }
    }
    return result.sort();
}

const LIB_EXCLUDE = new Set<string>(['utils.ts']);

/**
 * Convention-based dependencies that AST scanning cannot discover.
 *
 * The loading directive (v-loading) is packaged with Loading.vue but not
 * imported by it — it's registered externally by consumers. This is the only
 * such case in the codebase; keep this list minimal and documented.
 */
const MANIFEST_OVERRIDES: Record<string, Partial<ComponentFileManifest>> = {
    loading: {
        directives: ['loading.ts'],
    },
};

function applyOverrides(manifest: Record<string, ComponentFileManifest>): void {
    for (const [name, override] of Object.entries(MANIFEST_OVERRIDES)) {
        if (!manifest[name]) continue;
        if (override.directives) {
            const existing = new Set(manifest[name].directives);
            for (const d of override.directives) existing.add(d);
            manifest[name].directives = Array.from(existing).sort();
        }
    }
}

function buildExportsManifest(manifest: Record<string, ComponentFileManifest>): ExportsManifest {
    return {
        components: Object.keys(manifest).sort(),
        composables: listPublicSourceFiles(path.join(UI_SRC_DIR, 'composables')),
        directives: listPublicSourceFiles(path.join(UI_SRC_DIR, 'directives')),
    };
}

function main(): void {
    const options = {
        componentsDir: path.join(UI_SRC_DIR, 'components'),
        composablesDir: path.join(UI_SRC_DIR, 'composables'),
        libDir: path.join(UI_SRC_DIR, 'lib'),
        directivesDir: path.join(UI_SRC_DIR, 'directives'),
        libExclude: LIB_EXCLUDE,
    };

    console.log('🔍 Scanning component files...');
    const manifest = scanComponentFiles(options);
    applyOverrides(manifest);
    const componentCount = Object.keys(manifest).length;
    console.log(`📦 Found ${componentCount} components.`);

    const output = JSON.stringify(manifest, null, 2) + '\n';
    fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
    console.log(`✓ Written to ${path.relative(process.cwd(), OUTPUT_FILE)}`);

    const totalFiles = Object.values(manifest).reduce((sum, m) => sum + m.files.length, 0);
    const totalComposables = Object.values(manifest).reduce((sum, m) => sum + m.composables.length, 0);
    const totalDirectives = Object.values(manifest).reduce((sum, m) => sum + m.directives.length, 0);
    const totalLib = Object.values(manifest).reduce((sum, m) => sum + m.lib.length, 0);
    console.log(`  Files: ${totalFiles}, Composables: ${totalComposables}, Directives: ${totalDirectives}, Lib: ${totalLib}`);

    const exportsManifest = buildExportsManifest(manifest);
    const exportsOutput = JSON.stringify(exportsManifest, null, 2) + '\n';
    fs.writeFileSync(EXPORTS_MANIFEST_FILE, exportsOutput, 'utf-8');
    console.log(`✓ Written to ${path.relative(process.cwd(), EXPORTS_MANIFEST_FILE)}`);
    console.log(`  Components: ${exportsManifest.components.length}, Composables: ${exportsManifest.composables.length}, Directives: ${exportsManifest.directives.length}`);
}

main();
