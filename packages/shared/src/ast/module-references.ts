import ts from 'typescript';
import type {
    ClassifiedModuleSpecifier,
    ModuleAnalysisResult,
    ModuleCompleteness,
    ModuleReference,
    SourceDiagnostic,
} from './types.js';
import { createSourceRange, type ParseSession } from './source-parser.js';

function isEntirelyTypeOnlyBindings(
    bindings: ts.NamedImportBindings | ts.NamedExportBindings | undefined,
): boolean {
    if (!bindings) return false;
    if (ts.isNamedImports(bindings) || ts.isNamedExports(bindings)) {
        return bindings.elements.length > 0 && bindings.elements.every(el => el.isTypeOnly);
    }
    return false;
}

export function analyzeModuleReferences(session: ParseSession): ModuleAnalysisResult {
    const { input, descriptor, scriptBlocks } = session;
    const rawSource = input.source;
    const filename = input.filename;

    const references: ModuleReference[] = [];
    const diagnostics: SourceDiagnostic[] = [...session.diagnostics];
    let hasPartialWarning = false;

    for (const block of scriptBlocks) {
        const sourceFile = block.sourceFile;
        const baseOffset = block.baseOffset;

        const recordLiteralReference = (
            kind: ModuleReference['kind'],
            literalNode: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral,
            isTypeOnly: boolean,
            isDynamic: boolean,
            hasVerbatimSideEffect?: boolean
        ): void => {
            const specifier = literalNode.text;
            const nodeStart = literalNode.getStart(sourceFile);
            const nodeEnd = literalNode.getEnd();
            const absStart = baseOffset + nodeStart;
            const absEnd = baseOffset + nodeEnd;

            const firstChar = rawSource[absStart];
            const quoteChar: '\'' | '"' | '`' =
                firstChar === '\'' || firstChar === '"' || firstChar === '`' ? firstChar : '\'';

            const range = createSourceRange(rawSource, absStart, absEnd);

            references.push({
                kind,
                specifier,
                isTypeOnly,
                isDynamic,
                hasVerbatimSideEffect,
                range,
                quoteChar,
            });
        };

        const visit = (node: ts.Node): void => {
            // 1. Static import: import ... from '...'
            if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
                const clause = node.importClause;
                const isTopLevelType = clause?.isTypeOnly === true;
                const isInlineType = clause?.name === undefined && isEntirelyTypeOnlyBindings(clause?.namedBindings);
                const isTypeOnly = isTopLevelType || isInlineType;
                const hasVerbatimSideEffect = !isTopLevelType && isInlineType;

                recordLiteralReference('import-declaration', node.moduleSpecifier, isTypeOnly, false, hasVerbatimSideEffect);
            }
            // 2. Static export: export ... from '...'
            else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                const isTopLevelType = node.isTypeOnly === true;
                const isInlineType = isEntirelyTypeOnlyBindings(node.exportClause);
                const isTypeOnly = isTopLevelType || isInlineType;
                const hasVerbatimSideEffect = !isTopLevelType && isInlineType;

                recordLiteralReference('export-declaration', node.moduleSpecifier, isTypeOnly, false, hasVerbatimSideEffect);
            }
            // 3. Dynamic import: import('...')
            else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
                const arg = node.arguments[0];
                if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
                    recordLiteralReference('dynamic-import', arg, false, true, false);
                } else if (arg) {
                    hasPartialWarning = true;
                    const nodeStart = arg.getStart(sourceFile);
                    const nodeEnd = arg.getEnd();
                    diagnostics.push({
                        code: 'AST_DYNAMIC_IMPORT_NON_LITERAL',
                        severity: 'warning',
                        message: `Non-literal dynamic import detected in ${filename}`,
                        filename,
                        range: createSourceRange(rawSource, baseOffset + nodeStart, baseOffset + nodeEnd),
                    });
                }
            }
            // 4. TS import-equals: import x = require('...')
            else if (
                ts.isImportEqualsDeclaration(node) &&
                ts.isExternalModuleReference(node.moduleReference) &&
                ts.isStringLiteral(node.moduleReference.expression)
            ) {
                recordLiteralReference('import-equals', node.moduleReference.expression, false, false, false);
            }
            // 5. CommonJS require: require('...')
            else if (
                ts.isCallExpression(node) &&
                ts.isIdentifier(node.expression) &&
                node.expression.text === 'require' &&
                node.arguments.length === 1
            ) {
                const arg = node.arguments[0];
                hasPartialWarning = true;
                const nodeStart = node.getStart(sourceFile);
                const nodeEnd = node.getEnd();
                if (arg && ts.isStringLiteral(arg)) {
                    references.push({
                        kind: 'require',
                        specifier: arg.text,
                        isTypeOnly: false,
                        isDynamic: false,
                        hasVerbatimSideEffect: true,
                        range: createSourceRange(rawSource, baseOffset + nodeStart, baseOffset + nodeEnd),
                        quoteChar: '\'',
                    });
                }
                diagnostics.push({
                    code: 'AST_REQUIRE_CANDIDATE',
                    severity: 'warning',
                    message: `CommonJS require call found in ${filename}`,
                    filename,
                    range: createSourceRange(rawSource, baseOffset + nodeStart, baseOffset + nodeEnd),
                });
            }

            ts.forEachChild(node, visit);
        };

        for (const statement of sourceFile.statements) {
            visit(statement);
        }
    }

    // 聚合依赖事实
    const seen = new Map<string, {
        specifier: string;
        isTypeOnly: boolean;
        isDynamic: boolean;
        hasVerbatimSideEffect: boolean;
    }>();

    for (const ref of references) {
        if (ref.kind === 'require') continue; // require 为候选，不计入标准 ESM dependencies
        const existing = seen.get(ref.specifier);
        if (!existing) {
            seen.set(ref.specifier, {
                specifier: ref.specifier,
                isTypeOnly: ref.isTypeOnly,
                isDynamic: ref.isDynamic,
                hasVerbatimSideEffect: Boolean(ref.hasVerbatimSideEffect),
            });
        } else {
            // 只要存在任一非 type 引用，或存在动态引用，该模块即为运行时依赖
            if (!ref.isTypeOnly || ref.isDynamic) {
                existing.isTypeOnly = false;
            }
            if (ref.isDynamic) {
                existing.isDynamic = true;
            }
            if (ref.hasVerbatimSideEffect) {
                existing.hasVerbatimSideEffect = true;
            }
        }
    }

    const dependencies: ClassifiedModuleSpecifier[] = Array.from(seen.values()).map(item => ({
        specifier: item.specifier,
        isTypeOnly: item.isTypeOnly,
        isDynamic: item.isDynamic,
        hasVerbatimSideEffect: item.hasVerbatimSideEffect,
    }));

    // 完整性评估
    let completeness: ModuleCompleteness = 'complete';
    const hasError = diagnostics.some(d => d.severity === 'error');
    if (hasError) {
        completeness = 'invalid';
    } else if (hasPartialWarning) {
        completeness = 'partial';
    }

    return {
        references,
        dependencies,
        diagnostics,
        completeness,
    };
}
