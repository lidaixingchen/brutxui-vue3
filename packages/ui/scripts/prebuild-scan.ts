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
 * Manual overrides (manifest-shared.ts) cover convention-based dependencies that
 * AST scanning cannot discover (no import link between source files).
 *
 * Usage: pnpm prebuild:scan
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanComponentFiles, type ComponentFileManifest } from 'brutx-shared-vue/scan';
import { applyManifestOverrides, LIB_EXCLUDE } from './manifest-shared';

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

function buildExportsManifest(manifest: Record<string, ComponentFileManifest>): ExportsManifest {
    return {
        components: Object.keys(manifest).sort(),
        composables: listPublicSourceFiles(path.join(UI_SRC_DIR, 'composables')),
        directives: listPublicSourceFiles(path.join(UI_SRC_DIR, 'directives')),
    };
}

function readFileIfExists(filePath: string): string {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
}

function main(): void {
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v') || process.env.BRUTX_VERBOSE === '1';
    const options = {
        componentsDir: path.join(UI_SRC_DIR, 'components'),
        composablesDir: path.join(UI_SRC_DIR, 'composables'),
        libDir: path.join(UI_SRC_DIR, 'lib'),
        directivesDir: path.join(UI_SRC_DIR, 'directives'),
        libExclude: LIB_EXCLUDE,
    };

    if (isVerbose) {
        console.log('🔍 Scanning component files...');
    }
    const manifest = scanComponentFiles(options);
    applyManifestOverrides(manifest);
    const componentCount = Object.keys(manifest).length;

    const output = JSON.stringify(manifest, null, 2) + '\n';
    const existingOutput = readFileIfExists(OUTPUT_FILE);
    const manifestChanged = output !== existingOutput;
    if (manifestChanged) {
        fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
    }

    const exportsManifest = buildExportsManifest(manifest);
    const exportsOutput = JSON.stringify(exportsManifest, null, 2) + '\n';
    const existingExports = readFileIfExists(EXPORTS_MANIFEST_FILE);
    const exportsChanged = exportsOutput !== existingExports;
    if (exportsChanged) {
        fs.writeFileSync(EXPORTS_MANIFEST_FILE, exportsOutput, 'utf-8');
    }

    if (isVerbose) {
        console.log(`📦 Found ${componentCount} components.`);
        console.log(`✓ Written to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
        const totalFiles = Object.values(manifest).reduce((sum, m) => sum + m.files.length, 0);
        const totalComposables = Object.values(manifest).reduce((sum, m) => sum + m.composables.length, 0);
        const totalDirectives = Object.values(manifest).reduce((sum, m) => sum + m.directives.length, 0);
        const totalLib = Object.values(manifest).reduce((sum, m) => sum + m.lib.length, 0);
        console.log(`  Files: ${totalFiles}, Composables: ${totalComposables}, Directives: ${totalDirectives}, Lib: ${totalLib}`);
        console.log(`✓ Written to ${path.relative(process.cwd(), EXPORTS_MANIFEST_FILE)}`);
        console.log(`  Components: ${exportsManifest.components.length}, Composables: ${exportsManifest.composables.length}, Directives: ${exportsManifest.directives.length}`);
    } else if (manifestChanged || exportsChanged) {
        const updatedNames = [
            manifestChanged ? 'registry-manifest.json' : null,
            exportsChanged ? 'exports-manifest.json' : null,
        ].filter(Boolean).join(' & ');
        console.log(`✓ Updated ${updatedNames} (${componentCount} components)`);
    } else {
        console.log(`✓ Manifests up-to-date (${componentCount} components)`);
    }
}

main();
