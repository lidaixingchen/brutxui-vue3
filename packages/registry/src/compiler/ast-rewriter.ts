import ts from 'typescript';
import {
    AVAILABLE_COMPONENTS,
    COMPONENT_METADATA,
    type RegistryFileType,
} from 'brutx-shared-vue';
import {
    extractClassifiedModuleSpecifiers,
    extractModuleSpecifiers,
    type ClassifiedModuleSpecifier,
} from 'brutx-shared-vue/scan';
import type { AstReplacementSpan, RewriteContext } from './types.js';

export {
    extractClassifiedModuleSpecifiers,
    extractModuleSpecifiers,
    type ClassifiedModuleSpecifier,
};

interface ScriptBlockInfo {
    content: string;
    start: number;
    end: number;
}

const CONTEXT_ALIAS_PREFIX: Record<RewriteContext, string> = {
    component: '@/components/ui/',
    composable: '@/composables/',
    lib: '@/lib/',
    directive: '@/directives/',
    locale: '@/locales/',
};

const KNOWN_DIR_PREFIXES: Record<string, string> = {
    composables: '@/composables/',
    lib: '@/lib/',
    locales: '@/locales/',
    directives: '@/directives/',
};

/**
 * 提取 Vue SFC 中所有的 <script> 块及其在源码中的绝对字符起止偏移量。
 * 纯 TS/JS 文件则返回整段源码区间 [0, code.length]。
 */
export function extractScriptBlocksWithOffsets(code: string): ScriptBlockInfo[] {
    const blocks: ScriptBlockInfo[] = [];
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
                    blocks.push({
                        content: code.slice(bodyStart),
                        start: bodyStart,
                        end: code.length,
                    });
                    return blocks;
                }
                blocks.push({
                    content: code.slice(bodyStart, close),
                    start: bodyStart,
                    end: close,
                });
                i = close + '</script'.length;
                state = 'text';
                break;
            }
        }
    }

    return blocks.length > 0 ? blocks : [{ content: code, start: 0, end: code.length }];
}

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
        } else if (ch === '<' && code.slice(i, i + '</script'.length).toLowerCase() === '</script') {
            const after = code[i + '</script'.length] ?? '';
            if (!/\w/.test(after)) return i;
            i += '</script'.length;
        } else {
            i += 1;
        }
    }
    return -1;
}

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

/**
 * 计算单个 import/export specifier 重写后的目标别名。
 * 若无需重写则返回原 specifier。
 */
export function resolveRewrittenSpecifier(
    specifier: string,
    componentName: string,
    context: RewriteContext = 'component',
    knownComponents: Set<string> = new Set(AVAILABLE_COMPONENTS)
): string {
    // 1. ../composables/..., ../lib/..., ../locales/..., ../directives/... (支持单层或多层 ../)
    for (const [prefix, alias] of Object.entries(KNOWN_DIR_PREFIXES)) {
        const match = new RegExp(`^(?:\\.\\./)+${prefix}/(.+)$`).exec(specifier);
        if (match && match[1]) {
            return `${alias}${match[1]}`;
        }
    }

    // 2. ../components/{name}/... (支持单层或多层 ../)
    const crossCompMatch1 = /^(?:\.\.\/)+components\/([a-zA-Z0-9-]+)\/(.+)$/.exec(specifier);
    if (crossCompMatch1 && crossCompMatch1[1] && crossCompMatch1[2]) {
        const targetComp = crossCompMatch1[1];
        if (knownComponents.has(targetComp)) {
            return `@/components/ui/${targetComp}/${crossCompMatch1[2]}`;
        }
    }

    // 3. ../{name}/...
    const crossCompMatch2 = /^(?:\.\.\/)+([a-zA-Z0-9-]+)\/(.+)$/.exec(specifier);
    if (crossCompMatch2 && crossCompMatch2[1] && crossCompMatch2[2]) {
        const targetComp = crossCompMatch2[1];
        if (knownComponents.has(targetComp)) {
            return `@/components/ui/${targetComp}/${crossCompMatch2[2]}`;
        }
    }

    // 4. ./{file} 同目录相对导入
    const sameDirMatch = /^\.\/(.+)$/.exec(specifier);
    if (sameDirMatch && sameDirMatch[1]) {
        if (context === 'component') {
            return `@/components/ui/${componentName}/${sameDirMatch[1]}`;
        }
        return `${CONTEXT_ALIAS_PREFIX[context]}${sameDirMatch[1]}`;
    }

    return specifier;
}

/**
 * 基于 AST 定位与倒序字符切片替换重写源码中的相对导入路径。
 * 完全保留原始缩进、空格、换行、行内注释与 Vue SFC 模板。
 */
export function rewriteImports(
    code: string,
    componentName: string,
    context: RewriteContext = 'component',
    knownComponents?: Set<string>
): string {
    const known = knownComponents ?? new Set(AVAILABLE_COMPONENTS);
    const blocks = extractScriptBlocksWithOffsets(code);
    const replacements: AstReplacementSpan[] = [];

    for (const block of blocks) {
        const sourceFile = ts.createSourceFile(
            'virtual.tsx',
            block.content,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TSX
        );

        const checkAndRecord = (node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral): void => {
            const rawSpecifier = node.text;
            const rewritten = resolveRewrittenSpecifier(rawSpecifier, componentName, context, known);
            if (rewritten !== rawSpecifier) {
                const nodeStart = node.getStart(sourceFile);
                const nodeEnd = node.getEnd();
                const quote = block.content[nodeStart] ?? '\'';
                replacements.push({
                    start: block.start + nodeStart,
                    end: block.start + nodeEnd,
                    replacement: `${quote}${rewritten}${quote}`,
                });
            }
        };

        const visit = (node: ts.Node): void => {
            if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
                checkAndRecord(node.moduleSpecifier);
            } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                checkAndRecord(node.moduleSpecifier);
            } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
                const arg = node.arguments[0];
                if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
                    checkAndRecord(arg);
                }
            }
            ts.forEachChild(node, visit);
        };

        for (const stmt of sourceFile.statements) {
            visit(stmt);
        }
    }

    if (replacements.length === 0) {
        return code;
    }

    // 按起始偏移量倒序排序，防止切片替换影响前置索引
    replacements.sort((a, b) => b.start - a.start);

    let result = code;
    for (const rep of replacements) {
        result = result.slice(0, rep.start) + rep.replacement + result.slice(rep.end);
    }

    return result;
}

/**
 * 提取代码中指定前缀目录（如 'lib', 'composables', 'locales'）的相对文件依赖。
 */
export function extractDeps(code: string, dirPrefix: string): string[] {
    const specifiers = extractModuleSpecifiers(code);
    const prefix = `@/${dirPrefix}/`;
    const deps = new Set<string>();

    for (const spec of specifiers) {
        if (spec.startsWith(prefix)) {
            const remainder = spec.slice(prefix.length).split(/[?#]/)[0];
            if (remainder) {
                const normalized = remainder.endsWith('.ts') || remainder.endsWith('.vue') || remainder.endsWith('.css')
                    ? remainder
                    : `${remainder}.ts`;
                deps.add(normalized);
            }
        }
    }

    return Array.from(deps);
}

/**
 * 提取代码中引用的其他注册表组件依赖（不含当前组件自身，跳过纯类型导入，仅收集已知组件）。
 */
export function extractRegistryDeps(code: string, componentName: string, knownComponents?: Set<string>): string[] {
    const items = extractClassifiedModuleSpecifiers(code);
    const prefix = '@/components/ui/';
    const deps = new Set<string>();

    for (const item of items) {
        if (item.isTypeOnly) continue;
        const spec = item.specifier;
        if (spec.startsWith(prefix)) {
            const remainder = spec.slice(prefix.length);
            const comp = remainder.split('/')[0];
            if (comp && comp !== componentName) {
                const isKnown = knownComponents ? knownComponents.has(comp) : Boolean(COMPONENT_METADATA[comp]);
                if (isKnown) {
                    deps.add(comp);
                }
            }
        }
    }

    return Array.from(deps);
}

/**
 * 提取同一组件内部的其它源文件依赖（相对组件目录的相对文件名）。
 */
export function extractComponentFileDeps(code: string, componentName: string): string[] {
    const specifiers = extractModuleSpecifiers(code);
    const prefix = `@/components/ui/${componentName}/`;
    const files = new Set<string>();

    for (const spec of specifiers) {
        if (spec.startsWith(prefix)) {
            const file = spec.slice(prefix.length);
            if (file && file !== 'index.ts' && file !== 'index') {
                const normalized = file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.css')
                    ? file
                    : `${file}.ts`;
                files.add(normalized);
            }
        }
    }

    return Array.from(files);
}

/**
 * 提取代码中未在 COMPONENT_METADATA 中声明的未知组件别名。
 */
export function extractUnknownRegistryDeps(code: string): string[] {
    const specifiers = extractModuleSpecifiers(code);
    const prefix = '@/components/ui/';
    const unknowns = new Set<string>();

    for (const spec of specifiers) {
        if (spec.startsWith(prefix)) {
            const remainder = spec.slice(prefix.length);
            const comp = remainder.split('/')[0];
            if (comp && !COMPONENT_METADATA[comp]) {
                unknowns.add(comp);
            }
        }
    }

    return Array.from(unknowns);
}

/**
 * 断言代码中所有组件导入均属于合法已注册组件，否则抛出附带源上下文的错误。
 */
export function assertKnownRegistryDeps(code: string, ownerName: string, sourceLabel: string): string[] {
    const unknowns = extractUnknownRegistryDeps(code);
    if (unknowns.length > 0) {
        throw new Error(
            `Unknown registry component import(s) in "${ownerName}" (${sourceLabel}): ${unknowns.join(', ')}`
        );
    }
    return unknowns;
}

/**
 * 依据路径推导 RegistryFileType。
 */
export function getFileType(filePath: string): RegistryFileType {
    const posix = filePath.replace(/\\/g, '/');
    if (posix.startsWith('composables/') || posix.includes('/composables/')) return 'registry:hook';
    if (posix.startsWith('directives/') || posix.includes('/directives/')) return 'registry:directive';
    if (posix.startsWith('lib/') || posix.includes('/lib/')) return 'registry:lib';
    if (posix.endsWith('.vue') || posix.endsWith('.css')) return 'registry:ui';
    return 'registry:lib';
}
