/**
 * AST-based module specifier extraction.
 *
 * Single source of truth for dependency discovery. Uses the TypeScript compiler
 * API to parse import/export/dynamic-import specifiers from JS/TS/Vue SFC source
 * code. Both the registry builder and the prebuild manifest scanner consume this.
 *
 * Replaced by regex is forbidden — the AST approach correctly handles Vue SFC
 * `<script>` blocks, dynamic `import()`, re-exports, and string literal masking.
 */
import ts from 'typescript';

/**
 * Classified module specifier.
 *
 * - `isTypeOnly` is `true` when the entire declaration is `import type { ... }`
 *   or `export type { ... } from '...'` — i.e. no runtime value is imported.
 *   Mixed `import { type Foo, bar }` is NOT type-only (the declaration still
 *   loads the module at runtime because of `bar`).
 * - `isDynamic` is `true` for `import('...')` calls. Dynamic imports are always
 *   runtime dependencies.
 */
export interface ClassifiedModuleSpecifier {
    specifier: string;
    isTypeOnly: boolean;
    isDynamic: boolean;
}

/**
 * Extract all module specifiers from source code.
 *
 * Handles:
 * - Static imports: `import { foo } from 'bar'`
 * - Export re-exports: `export { foo } from 'bar'`, `export * from 'bar'`
 * - Dynamic imports: `import('bar')`
 * - Vue SFC `<script>` blocks (extracted before parsing)
 *
 * @param code - Source code (plain TS/JS or Vue SFC)
 * @returns Array of unique module specifiers (e.g. `['@/composables/useLocale', 'vue']`)
 */
export function extractModuleSpecifiers(code: string): string[] {
    return extractClassifiedModuleSpecifiers(code).map(item => item.specifier);
}

/**
 * Extract module specifiers with type-only / dynamic classification.
 *
 * Use this when the caller needs to distinguish runtime imports from type-only
 * imports. Registry dependency tracking skips type-only specifiers; typo
 * detection and file-presence checks still consider them.
 */
export function extractClassifiedModuleSpecifiers(code: string): ClassifiedModuleSpecifier[] {
    const seen = new Map<string, ClassifiedModuleSpecifier>();

    for (const scriptCode of extractScriptBlocks(code)) {
        const sourceFile = ts.createSourceFile(
            'registry-source.ts',
            scriptCode,
            ts.ScriptTarget.Latest,
            false,
            ts.ScriptKind.TSX
        );

        const visit = (node: ts.Node): void => {
            if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
                const specifier = node.moduleSpecifier.text;
                const isTypeOnly = node.importClause?.isTypeOnly === true;
                upsert(seen, specifier, isTypeOnly, false);
            } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                const specifier = node.moduleSpecifier.text;
                // `export type { Foo } from './bar'` sets isTypeOnly on the
                // ExportDeclaration itself (TS 5+). `export type * as ns from`
                // also sets it here.
                const isTypeOnly = node.isTypeOnly;
                upsert(seen, specifier, isTypeOnly, false);
            } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
                const arg = node.arguments[0];
                if (arg && ts.isStringLiteral(arg)) {
                    upsert(seen, arg.text, false, true);
                }
            }
            ts.forEachChild(node, visit);
        };

        for (const statement of sourceFile.statements) {
            visit(statement);
        }
    }

    return Array.from(seen.values());
}

function upsert(
    seen: Map<string, ClassifiedModuleSpecifier>,
    specifier: string,
    isTypeOnly: boolean,
    isDynamic: boolean,
): void {
    const existing = seen.get(specifier);
    if (!existing) {
        seen.set(specifier, { specifier, isTypeOnly, isDynamic });
        return;
    }
    // A specifier referenced by multiple import statements is a runtime dep
    // if ANY of those references is a value import (isTypeOnly=false) or a
    // dynamic import. Type-only wins only when every reference is type-only.
    if (!isTypeOnly || isDynamic) {
        existing.isTypeOnly = false;
    }
    if (isDynamic) {
        existing.isDynamic = true;
    }
}

/**
 * Masks string literals with `__STR_LITERAL_{idx}__` placeholders in a single
 * linear pass. Single/double-quoted strings terminate at line breaks, backtick
 * templates may span lines, and a backslash skips the next character. Unclosed
 * literals are left untouched.
 */
function maskStringLiterals(code: string, placeholders: string[]): string {
    const parts: string[] = [];
    let runStart = 0;
    let i = 0;
    while (i < code.length) {
        const quote = code[i];
        if (quote !== '\'' && quote !== '"' && quote !== '`') {
            i += 1;
            continue;
        }
        const isTemplate = quote === '`';
        let j = i + 1;
        let closed = false;
        while (j < code.length) {
            const ch = code[j];
            if (ch === '\\') {
                j += 2;
            } else if (ch === quote) {
                closed = true;
                break;
            } else if (!isTemplate && (ch === '\r' || ch === '\n')) {
                break;
            } else {
                j += 1;
            }
        }
        if (!closed) {
            i += 1;
            continue;
        }
        if (i > runStart) {
            parts.push(code.slice(runStart, i));
        }
        const idx = placeholders.length;
        placeholders.push(code.slice(i, j + 1));
        parts.push(`__STR_LITERAL_${idx}__`);
        i = j + 1;
        runStart = i;
    }
    if (runStart < code.length) {
        parts.push(code.slice(runStart));
    }
    return parts.join('');
}

/**
 * Extract `<script>` block contents from Vue SFC source code.
 *
 * Masks string literals before matching to prevent false positives from
 * single quotes inside HTML attributes or comments. Returns the full code
 * if no `<script>` blocks are found (plain TS/JS source).
 */
export function extractScriptBlocks(code: string): string[] {
    const blocks: string[] = [];
    const scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;

    const placeholders: string[] = [];
    const masked = maskStringLiterals(code, placeholders);

    for (const match of masked.matchAll(scriptPattern)) {
        blocks.push(match[1].replace(/__STR_LITERAL_(\d+)__/g, (_m, i) => placeholders[Number(i)] ?? ''));
    }

    return blocks.length > 0 ? blocks : [code];
}
