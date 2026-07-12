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
    const specifiers = new Set<string>();

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
                specifiers.add(node.moduleSpecifier.text);
            } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                specifiers.add(node.moduleSpecifier.text);
            } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
                const arg = node.arguments[0];
                if (arg && ts.isStringLiteral(arg)) {
                    specifiers.add(arg.text);
                }
            }
            ts.forEachChild(node, visit);
        };

        for (const statement of sourceFile.statements) {
            visit(statement);
        }
    }

    return Array.from(specifiers);
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
    const scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

    const stringLiteralPattern = /'(?:[^'\r\n\\]|\\.)*'|"(?:[^"\r\n\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

    const placeholders: string[] = [];
    const masked = code.replace(stringLiteralPattern, (m) => {
        const idx = placeholders.length;
        placeholders.push(m);
        return `__STR_LITERAL_${idx}__`;
    });

    for (const match of masked.matchAll(scriptPattern)) {
        blocks.push(match[1].replace(/__STR_LITERAL_(\d+)__/g, (_m, i) => placeholders[Number(i)] ?? ''));
    }

    return blocks.length > 0 ? blocks : [code];
}
