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

function resolveExtension(rawFileName: string, baseDir: string): string {
    if (path.extname(rawFileName)) return rawFileName;
    if (fs.existsSync(path.join(baseDir, `${rawFileName}.vue`))) return `${rawFileName}.vue`;
    return `${rawFileName}.ts`;
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
    if (specifier.startsWith('../composables/')) {
        const name = specifier.slice('../composables/'.length).split(/[?#]/)[0];
        return { kind: 'composable', name };
    }
    if (specifier.startsWith('../lib/')) {
        const name = specifier.slice('../lib/'.length).split(/[?#]/)[0];
        return { kind: 'lib', name };
    }
    if (specifier.startsWith('../directives/')) {
        const name = specifier.slice('../directives/'.length).split(/[?#]/)[0];
        return { kind: 'directive', name };
    }
    if (specifier.startsWith('./')) {
        const name = specifier.slice('./'.length).split(/[?#]/)[0];
        return { kind: 'internal', name };
    }
    // ../{other-comp}/ pattern — cross-component
    const crossCompMatch = specifier.match(/^\.\.\/([a-zA-Z0-9-]+)\/(.+)$/);
    if (crossCompMatch && crossCompMatch[1] !== componentName) {
        return { kind: 'cross-component', name: crossCompMatch[1] };
    }

    return { kind: 'other', name: specifier };
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

    while (queue.length > 0) {
        const file = queue.shift()!;
        if (visited.has(file)) continue;
        visited.add(file);

        const ext = path.extname(file);
        if (ext !== '.vue' && ext !== '.ts') continue;

        const filePath = path.join(componentDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        for (const specifier of extractModuleSpecifiers(content)) {
            const classified = classifySpecifier(specifier, componentName, options);
            switch (classified.kind) {
                case 'composable':
                    composables.add(resolveExtension(classified.name, options.composablesDir));
                    break;
                case 'lib': {
                    const resolved = resolveExtension(classified.name, options.libDir);
                    if (!options.libExclude?.has(resolved)) {
                        lib.add(resolved);
                    }
                    break;
                }
                case 'directive':
                    directives.add(resolveExtension(classified.name, options.directivesDir));
                    break;
                case 'internal': {
                    const resolved = resolveExtension(classified.name, componentDir);
                    if (!internalFiles.has(resolved)) {
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

export function scanComponentFiles(options: ScanOptions): Record<string, ComponentFileManifest> {
    const manifest: Record<string, ComponentFileManifest> = {};
    const entries = fs.readdirSync(options.componentsDir, { withFileTypes: true });
    const componentDirs = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();

    for (const dir of componentDirs) {
        manifest[dir] = scanComponent(dir, options);
    }

    return manifest;
}
