import { parse as parseSfcCompiler } from '@vue/compiler-sfc';
import MagicString from 'magic-string';
import ts from 'typescript';
import type {
    ParsedSfcDescriptor,
    SfcScriptBlock,
    ImportRewriterFn,
    ClassifiedModuleSpecifier,
    ImportRewriteContext,
} from './types.js';

export class SfcAstEngine {
    /**
     * 解析 Vue SFC 或纯 TS/JS 源码，构建标准化 Descriptor
     */
    static parse(rawSource: string, filename = 'component.vue'): ParsedSfcDescriptor {
        const hasSfcTags = rawSource.includes('<template') || rawSource.includes('<script') || rawSource.includes('<style');
        const isVueFile = filename.endsWith('.vue') || hasSfcTags;

        if (!isVueFile && !hasSfcTags) {
            return {
                filename,
                rawSource,
                isSfc: false,
                styles: [],
                customBlocks: [],
            };
        }

        const { descriptor, errors } = parseSfcCompiler(rawSource, {
            filename,
            sourceMap: false,
            ignoreEmpty: true,
        });

        if (errors.length > 0) {
            // 尽力而为（Best-effort）
        }

        const hasAnySfcBlock = Boolean(descriptor.script || descriptor.scriptSetup || descriptor.template || descriptor.styles.length > 0);
        if (!hasAnySfcBlock && !hasSfcTags) {
            return {
                filename,
                rawSource,
                isSfc: false,
                styles: [],
                customBlocks: [],
            };
        }

        const mapScript = (
            block: typeof descriptor.script | typeof descriptor.scriptSetup,
            setup: boolean
        ): SfcScriptBlock | undefined => {
            if (!block) return undefined;
            return {
                content: block.content,
                lang: block.lang,
                setup,
                generic: typeof block.attrs?.['generic'] === 'string' ? (block.attrs['generic'] as string) : undefined,
                startOffset: block.loc.start.offset,
                endOffset: block.loc.end.offset,
                loc: block.loc,
            };
        };

        return {
            filename,
            rawSource,
            isSfc: true,
            script: mapScript(descriptor.script, false),
            scriptSetup: mapScript(descriptor.scriptSetup, true),
            templateContent: descriptor.template?.content,
            styles: descriptor.styles.map(style => ({
                content: style.content,
                lang: style.lang,
                scoped: style.scoped ?? false,
                module: style.module ?? false,
                startOffset: style.loc.start.offset,
                endOffset: style.loc.end.offset,
            })),
            customBlocks: descriptor.customBlocks.map(b => ({ type: b.type, content: b.content })),
        };
    }

    /**
     * 提取源文件中的全部模块导入（支持静态 import/export、类型导入、动态 import）
     */
    static extractModuleSpecifiers(rawSource: string, filename = 'component.vue'): ClassifiedModuleSpecifier[] {
        const descriptor = SfcAstEngine.parse(rawSource, filename);
        const scriptBlocks: Array<{ content: string; offset: number }> = [];

        if (descriptor.isSfc && (descriptor.script || descriptor.scriptSetup)) {
            if (descriptor.script) scriptBlocks.push({ content: descriptor.script.content, offset: descriptor.script.startOffset });
            if (descriptor.scriptSetup) scriptBlocks.push({ content: descriptor.scriptSetup.content, offset: descriptor.scriptSetup.startOffset });
        } else {
            scriptBlocks.push({ content: rawSource, offset: 0 });
        }

        const seen = new Map<string, ClassifiedModuleSpecifier>();

        for (const block of scriptBlocks) {
            const sourceFile = ts.createSourceFile(
                filename.endsWith('.vue') ? 'component.tsx' : filename,
                block.content,
                ts.ScriptTarget.Latest,
                true,
                ts.ScriptKind.TSX
            );

            SfcAstEngine.walkModuleSpecifiers(sourceFile, (specifier, isTypeOnly, isDynamic) => {
                const existing = seen.get(specifier);
                if (!existing) {
                    seen.set(specifier, { specifier, isTypeOnly, isDynamic });
                } else {
                    if (!isTypeOnly || isDynamic) {
                        seen.set(specifier, { specifier, isTypeOnly: false, isDynamic: existing.isDynamic || isDynamic });
                    }
                }
            });
        }

        return Array.from(seen.values());
    }

    /**
     * 利用 MagicString 高保真、原地重写 Vue SFC / TS 文件的 import 别名
     */
    static transformImports(rawSource: string, rewriter: ImportRewriterFn, filename = 'component.vue'): string {
        const descriptor = SfcAstEngine.parse(rawSource, filename);
        const s = new MagicString(rawSource);

        const scriptBlocks: Array<{ content: string; baseOffset: number }> = [];
        if (descriptor.isSfc && (descriptor.script || descriptor.scriptSetup)) {
            if (descriptor.script) scriptBlocks.push({ content: descriptor.script.content, baseOffset: descriptor.script.startOffset });
            if (descriptor.scriptSetup) scriptBlocks.push({ content: descriptor.scriptSetup.content, baseOffset: descriptor.scriptSetup.startOffset });
        } else {
            scriptBlocks.push({ content: rawSource, baseOffset: 0 });
        }

        for (const block of scriptBlocks) {
            const sourceFile = ts.createSourceFile(
                filename.endsWith('.vue') ? 'component.tsx' : filename,
                block.content,
                ts.ScriptTarget.Latest,
                true,
                ts.ScriptKind.TSX
            );

            const handleLiteral = (
                literalNode: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral,
                isTypeOnly: boolean,
                isDynamic: boolean
            ): void => {
                const originalSpecifier = literalNode.text;
                const nodeStartInScript = literalNode.getStart(sourceFile);
                const nodeEndInScript = literalNode.getEnd();

                const absStart = block.baseOffset + nodeStartInScript;
                const absEnd = block.baseOffset + nodeEndInScript;

                const firstChar = rawSource[absStart];
                const quoteChar: '\'' | '"' | '`' = firstChar === '\'' || firstChar === '"' || firstChar === '`' ? firstChar : '\'';

                const context: ImportRewriteContext = {
                    specifier: originalSpecifier,
                    isTypeOnly,
                    isDynamic,
                    quoteChar,
                    startOffset: absStart,
                    endOffset: absEnd,
                };

                const replacement = rewriter(context);
                if (replacement && replacement !== originalSpecifier) {
                    s.overwrite(absStart, absEnd, `${quoteChar}${replacement}${quoteChar}`);
                }
            };

            const visit = (node: ts.Node): void => {
                if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
                    const isTypeOnly = node.importClause?.isTypeOnly === true || SfcAstEngine.isEntirelyTypeOnly(node.importClause?.namedBindings);
                    handleLiteral(node.moduleSpecifier, isTypeOnly, false);
                } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                    const isTypeOnly = node.isTypeOnly === true || SfcAstEngine.isEntirelyTypeOnly(node.exportClause);
                    handleLiteral(node.moduleSpecifier, isTypeOnly, false);
                } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
                    const arg = node.arguments[0];
                    if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
                        handleLiteral(arg, false, true);
                    }
                }
                ts.forEachChild(node, visit);
            };

            for (const stmt of sourceFile.statements) {
                visit(stmt);
            }
        }

        return s.toString();
    }

    private static isEntirelyTypeOnly(bindings?: ts.NamedImportBindings | ts.NamedExportBindings): boolean {
        if (!bindings) return false;
        if (ts.isNamedImports(bindings) || ts.isNamedExports(bindings)) {
            return bindings.elements.length > 0 && bindings.elements.every(el => el.isTypeOnly);
        }
        return false;
    }

    private static walkModuleSpecifiers(
        sourceFile: ts.SourceFile,
        callback: (specifier: string, isTypeOnly: boolean, isDynamic: boolean) => void
    ): void {
        const visit = (node: ts.Node): void => {
            if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
                const isTypeOnly = node.importClause?.isTypeOnly === true || SfcAstEngine.isEntirelyTypeOnly(node.importClause?.namedBindings);
                callback(node.moduleSpecifier.text, isTypeOnly, false);
            } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                const isTypeOnly = node.isTypeOnly === true || SfcAstEngine.isEntirelyTypeOnly(node.exportClause);
                callback(node.moduleSpecifier.text, isTypeOnly, false);
            } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
                const arg = node.arguments[0];
                if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
                    callback(arg.text, false, true);
                }
            }
            ts.forEachChild(node, visit);
        };

        for (const stmt of sourceFile.statements) {
            visit(stmt);
        }
    }
}
