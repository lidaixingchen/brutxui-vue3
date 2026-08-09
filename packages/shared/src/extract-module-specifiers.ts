/**
 * AST-based module specifier extraction.
 *
 * Single source of truth for dependency discovery. Uses the TypeScript compiler
 * API to parse import/export/dynamic-import specifiers from JS/TS/Vue SFC source
 * code. Both the registry builder and the prebuild manifest scanner consume this.
 *
 * Replaced by regex is forbidden — the AST approach correctly handles Vue SFC
 * `<script>` blocks, dynamic `import()`, and re-exports.
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
                const clause = node.importClause;
                const namedImports =
                    clause?.namedBindings !== undefined && ts.isNamedImports(clause.namedBindings)
                        ? clause.namedBindings
                        : undefined;
                // import type { ... } 或内联 `import { type Foo }`（无默认/命名空间绑定且全部元素 type-only）
                // 在编译时都会被完全消除，应判为 type-only
                const isTypeOnly =
                    clause?.isTypeOnly === true ||
                    (clause?.name === undefined && isEntirelyTypeOnlyBindings(namedImports));
                upsert(seen, specifier, isTypeOnly, false);
            } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                const specifier = node.moduleSpecifier.text;
                const namedExports =
                    node.exportClause !== undefined && ts.isNamedExports(node.exportClause)
                        ? node.exportClause
                        : undefined;
                // `export type { ... }`（node.isTypeOnly，TS 5+ 也覆盖 `export type * as ns`）
                // 或内联 `export { type Foo }`（NamedExports 元素全部 type-only）
                const isTypeOnly = node.isTypeOnly === true || isEntirelyTypeOnlyBindings(namedExports);
                upsert(seen, specifier, isTypeOnly, false);
            } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
                const arg = node.arguments[0];
                // 动态导入的静态路径既可以是 StringLiteral，也可以是 NoSubstitutionTemplateLiteral
                //（`import(`./foo`)`），两者都能直接取 .text
                if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
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

/**
 * NamedImports/NamedExports 全量元素均带内联 type 修饰符时（如 `import { type Foo, type Bar }`），
 * 整条导入/导出在编译期会被完全消除，视为 type-only。空绑定列表不算（`import {} from` 无实际导出）。
 */
function isEntirelyTypeOnlyBindings(
    bindings: ts.NamedImports | ts.NamedExports | undefined,
): boolean {
    return bindings !== undefined && bindings.elements.length > 0 && bindings.elements.every(el => el.isTypeOnly);
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
 * Extract `<script>` block contents from Vue SFC source code.
 *
 * Uses a single-pass HTML + JS aware scanner: template-layer HTML comments and
 * attribute quotes, plus script-body string literals and JS comments, are each
 * skipped in their own state, so none of them can shift script block boundaries.
 * Returns the full code if no `<script>` blocks are found (plain TS/JS source).
 */
export function extractScriptBlocks(code: string): string[] {
    const blocks: string[] = [];

    // 单遍状态机：
    //   text         —— 模板/纯代码层：跳过字符串字面量、HTML 注释，识别开始标签
    //   html-comment —— HTML 注释（`<!-- ... -->`）：其中的引号、伪 <script> 标签一律忽略
    //   tag          —— HTML 开始标签内：识别属性引号与 `>` 结束
    //   tag-quote    —— 属性引号内（含未配对容错）：以配对引号或 `>` 结束
    //   script       —— `<script>` 内容：JS-aware 寻找真实的 `</script>` 闭合
    let state: 'text' | 'html-comment' | 'tag' | 'tag-quote' | 'script' = 'text';
    let tagName = '';
    let tagQuote: '"' | '\'' | null = null;
    let bodyStart = 0;
    let i = 0;

    while (i < code.length) {
        switch (state) {
            case 'text': {
                const ch = code[i];
                if (ch === '\'' || ch === '"' || ch === '`') {
                    // 模板文本或纯 TS/JS 中的字符串字面量：整段跳过，避免其中的 `<script>` 文本被误判为标签
                    i = skipQuotedString(code, i);
                } else if (code.startsWith('<!--', i)) {
                    state = 'html-comment';
                    i += 4;
                } else if (ch === '<' && /[a-zA-Z]/.test(code[i + 1] ?? '')) {
                    tagName = /^[a-zA-Z][^\s/>]*/.exec(code.slice(i + 1))?.[0] ?? '';
                    state = 'tag';
                    i += 1 + tagName.length;
                } else {
                    i += 1;
                }
                break;
            }
            case 'html-comment': {
                if (code.startsWith('-->', i)) {
                    state = 'text';
                    i += 3;
                } else {
                    i += 1;
                }
                break;
            }
            case 'tag': {
                const ch = code[i];
                if (ch === '"' || ch === '\'') {
                    tagQuote = ch;
                    state = 'tag-quote';
                    i += 1;
                } else if (ch === '>') {
                    if (tagName.toLowerCase() === 'script') {
                        state = 'script';
                        bodyStart = i + 1;
                    } else {
                        state = 'text';
                    }
                    i += 1;
                } else {
                    i += 1;
                }
                break;
            }
            case 'tag-quote': {
                // 属性引号：以配对引号结束；未配对（到行尾仍未闭合）时容错地回到 text，
                // 避免 `data-x='unclosed` 这类残缺属性吞掉后续的 `<script>` 块。
                // 注意不能把属性值内的 `>` 当结束：如 `<script generic="Record<string, unknown>">`
                // 的 `>` 在配对引号内，提前结束会让 script 态从未进入
                if (code[i] === tagQuote) {
                    state = 'tag';
                    tagQuote = null;
                    i += 1;
                } else if (code[i] === '\n' || code[i] === '\r') {
                    state = 'text';
                    tagQuote = null;
                    i += 1;
                } else {
                    i += 1;
                }
                break;
            }
            case 'script': {
                const close = findScriptClose(code, bodyStart);
                if (close === -1) {
                    // 未闭合的 script 块：取到末尾（尽力而为）
                    blocks.push(code.slice(bodyStart));
                    return blocks.length > 0 ? blocks : [code];
                }
                blocks.push(code.slice(bodyStart, close));
                i = close + '</script'.length;
                state = 'text';
                break;
            }
        }
    }

    return blocks.length > 0 ? blocks : [code];
}

/**
 * 从 from 起 JS-aware 扫描，返回第一个不在字符串/注释内的 `</script` 索引；无则 -1。
 * 字符串字面量、`//` 行注释、块注释中的 `</script>` 均不作为闭合标签。
 */
function findScriptClose(code: string, from: number): number {
    let i = from;
    while (i < code.length) {
        const ch = code[i];
        if (ch === '\'' || ch === '"' || ch === '`') {
            i = skipQuotedString(code, i);
        } else if (ch === '/' && code[i + 1] === '/') {
            const newline = code.indexOf('\n', i + 2);
            i = newline === -1 ? code.length : newline + 1;
        } else if (ch === '/' && code[i + 1] === '*') {
            const end = code.indexOf('*/', i + 2);
            i = end === -1 ? code.length : end + 2;
        } else if (ch === '<' && code.startsWith('</script', i)) {
            const after = code[i + '</script'.length] ?? '';
            if (!/[a-zA-Z]/.test(after)) return i;
            i += '</script'.length;
        } else {
            i += 1;
        }
    }
    return -1;
}

/**
 * 跳过引号包裹的字符串字面量并返回结束后的索引。
 * 单/双引号不跨行（未闭合时遇到行尾即止），模板字符串可跨行；反斜杠转义跳过一个字符。
 */
function skipQuotedString(code: string, from: number): number {
    const quote = code[from];
    let j = from + 1;
    while (j < code.length) {
        if (code[j] === '\\') {
            j += 2;
        } else if (code[j] === quote) {
            return j + 1;
        } else if (quote !== '`' && (code[j] === '\n' || code[j] === '\r')) {
            return j;
        } else {
            j += 1;
        }
    }
    return code.length;
}
