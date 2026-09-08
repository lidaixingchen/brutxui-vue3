import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PACKAGE_ROOT, 'dist');

const FORBIDDEN_DEPENDENCIES = [
    'typescript',
    '@vue/compiler-sfc',
    '@vue/compiler-dom',
    '@vue/compiler-core',
    'vue-component-meta',
    'magic-string',
    'brutx-shared-vue/ast',
    'brutx-shared-vue/scan',
    'brutx-shared-vue/fs',
    'brutx-shared-vue',
] as const;

const FORBIDDEN_PATTERNS = FORBIDDEN_DEPENDENCIES.map(dep => ({
    dep,
    regex: new RegExp(`(?:from|require|import)\\s*(?:\\(?\\s*)?['"]${dep.replace('/', '\\/')}(?:/[^'"]*)?['"]`, 'm'),
}));

interface Violation {
    readonly file: string;
    readonly dependency: string;
    readonly line: number;
    readonly content: string;
}

function scanFile(filePath: string, violations: Violation[]): void {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const item of FORBIDDEN_PATTERNS) {
            if (item.regex.test(line)) {
                violations.push({
                    file: path.relative(PACKAGE_ROOT, filePath).replace(/\\/g, '/'),
                    dependency: item.dep,
                    line: i + 1,
                    content: line.trim(),
                });
            }
        }
    }
}

function scanDir(dir: string, violations: Violation[]): void {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            scanDir(fullPath, violations);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (ext === '.js' || ext === '.mjs' || ext === '.cjs' || ext === '.ts' || fullPath.endsWith('.d.ts')) {
                scanFile(fullPath, violations);
            }
        }
    }
}

function main(): void {
    if (!fs.existsSync(DIST_DIR)) {
        console.error(`[check-bundle-isolation] FAILED: dist directory not found at ${DIST_DIR}. Build the package first.`);
        process.exit(1);
    }

    const violations: Violation[] = [];
    scanDir(DIST_DIR, violations);

    if (violations.length > 0) {
        console.error(`[check-bundle-isolation] FAILED: Found ${violations.length} forbidden dependency reference(s) in dist:`);
        for (const v of violations) {
            console.error(`  - ${v.file}:${v.line} references "${v.dependency}": ${v.content}`);
        }
        process.exit(1);
    }

    console.log(`✓ Bundle isolation verified: 0 compiler/internal dependencies found in dist/`);
}

main();
