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
 * Also outputs packages/ui/exports-manifest.json: a derived projection of the
 * explicit API contract, including source and artifact mappings consumed by
 * Vite, exports generation and read-only checks.
 *
 * Convention-based overrides cover dependencies that AST scanning cannot discover
 * (no import link between source files, e.g. loading directive).
 *
 * Usage: pnpm prebuild:scan
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    type RegistryManifest,
} from 'brutx-shared-vue';
import {
    assertApiContractSourceExports,
    buildApiExportsManifest,
    type ApiExportsManifest,
} from 'brutx-shared-vue/api-contract';
import {
    compareGeneratedOutputs,
    type GeneratedOutput,
    withGenerateLock,
    writeGeneratedOutputs,
} from 'brutx-shared-vue/generation';
import { scanComponentFiles } from 'brutx-shared-vue/scan';
import { API_CONTRACT } from '../api-contract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

export interface ScanGeneration {
    manifest: RegistryManifest;
    exportsManifest: ApiExportsManifest;
    outputs: GeneratedOutput[];
}

export function collectScanGeneration(packageRoot: string = PACKAGE_ROOT): ScanGeneration {
    const uiSrcDir = path.resolve(packageRoot, 'src');
    const options = {
        componentsDir: path.join(uiSrcDir, 'components'),
        composablesDir: path.join(uiSrcDir, 'composables'),
        libDir: path.join(uiSrcDir, 'lib'),
        directivesDir: path.join(uiSrcDir, 'directives'),
    };

    const manifest = scanComponentFiles(options);
    const output = JSON.stringify(manifest, null, 2) + '\n';
    const exportsManifest = buildApiExportsManifest(API_CONTRACT);
    assertApiContractSourceExports(API_CONTRACT, {
        packageRoot,
        tsconfigPath: path.resolve(packageRoot, 'tsconfig.json'),
    });
    const exportsOutput = JSON.stringify(exportsManifest, null, 2) + '\n';

    return {
        manifest,
        exportsManifest,
        outputs: [
            { relativePath: 'registry-manifest.json', content: output },
            { relativePath: 'exports-manifest.json', content: exportsOutput },
        ],
    };
}

function runStandalone(): void {
    const isCheckMode = process.argv.includes('--check');
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v') || process.env.BRUTX_VERBOSE === '1';
    const { manifest, outputs } = collectScanGeneration();
    const componentCount = Object.keys(manifest).length;
    const differences = compareGeneratedOutputs(PACKAGE_ROOT, outputs);

    if (isCheckMode) {
        if (differences.length === 0) {
            console.log(`✓ Manifests up-to-date (${componentCount} components)`);
            return;
        }
        console.error('✗ manifest 生成内容与磁盘不一致');
        for (const difference of differences) console.error(`  - ${difference.relativePath} (${difference.kind})`);
        throw new Error('UI manifest 生成检查失败');
    }

    writeGeneratedOutputs(PACKAGE_ROOT, outputs);

    if (isVerbose) {
        console.log(`📦 Found ${componentCount} components.`);
        console.log(`✓ Written to ${path.relative(process.cwd(), path.resolve(PACKAGE_ROOT, 'registry-manifest.json'))}`);
        const totalFiles = Object.values(manifest).reduce((sum, m) => sum + m.files.length, 0);
        const totalComposables = Object.values(manifest).reduce((sum, m) => sum + m.composables.length, 0);
        const totalDirectives = Object.values(manifest).reduce((sum, m) => sum + m.directives.length, 0);
        const totalLib = Object.values(manifest).reduce((sum, m) => sum + m.lib.length, 0);
        console.log(`  Files: ${totalFiles}, Composables: ${totalComposables}, Directives: ${totalDirectives}, Lib: ${totalLib}`);
        console.log(`✓ Written to ${path.relative(process.cwd(), path.resolve(PACKAGE_ROOT, 'exports-manifest.json'))}`);
    } else if (differences.length > 0) {
        console.log(`✓ Updated registry-manifest.json & exports-manifest.json (${componentCount} components)`);
    } else {
        console.log(`✓ Manifests up-to-date (${componentCount} components)`);
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    const runPromise = process.argv.includes('--check')
        ? Promise.resolve().then(runStandalone)
        : withGenerateLock(
            { packageName: 'brutx-ui-vue', cacheDir: path.resolve(PACKAGE_ROOT, 'node_modules', '.cache') },
            runStandalone,
        )
    runPromise.catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
