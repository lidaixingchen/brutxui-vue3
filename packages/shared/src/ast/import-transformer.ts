import MagicString from 'magic-string';
import type {
    ImportRewriteContext,
    ImportRewriterFn,
    ModuleReference,
    SourceDiagnostic,
    SourceInput,
    TransformResult,
} from './types.js';
import { parseSource } from './source-parser.js';
import { analyzeModuleReferences } from './module-references.js';

export function escapeSpecifier(value: string, quoteChar: '\'' | '"' | '`'): string {
    // 统一处理反斜杠转义
    let escaped = value.replace(/\\/g, '\\\\');

    if (quoteChar === '\'') {
        escaped = escaped.replace(/'/g, '\\\'');
    } else if (quoteChar === '"') {
        escaped = escaped.replace(/"/g, '\\"');
    } else if (quoteChar === '`') {
        escaped = escaped.replace(/`/g, '\\`').replace(/\${/g, '\\${');
    }

    return escaped.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
}

export function transformImportsInternal(
    input: SourceInput,
    references: readonly ModuleReference[],
    rewriter: ImportRewriterFn
): TransformResult {
    const rawSource = input.source;
    const diagnostics: SourceDiagnostic[] = [];
    const s = new MagicString(rawSource);
    let changed = false;

    // 过滤出可改写的字符串字面量引用，按起点排序
    const rewritableRefs = references
        .filter(r => r.kind !== 'require')
        .sort((a, b) => a.range.startOffset - b.range.startOffset);

    // 检查范围是否有重叠
    for (let i = 0; i < rewritableRefs.length - 1; i++) {
        const curr = rewritableRefs[i];
        const next = rewritableRefs[i + 1];
        if (curr.range.endOffset > next.range.startOffset) {
            diagnostics.push({
                code: 'AST_OVERLAPPING_REWRITE_RANGE',
                severity: 'error',
                message: `Overlapping import ranges detected at offsets ${curr.range.startOffset} and ${next.range.startOffset} in ${input.filename}`,
                filename: input.filename,
                range: curr.range,
            });
            return {
                code: rawSource,
                changed: false,
                diagnostics,
            };
        }
    }

    for (const ref of rewritableRefs) {
        const quoteChar = ref.quoteChar ?? '\'';
        const ctx: ImportRewriteContext = {
            specifier: ref.specifier,
            isTypeOnly: ref.isTypeOnly,
            isDynamic: ref.isDynamic,
            quoteChar,
            startOffset: ref.range.startOffset,
            endOffset: ref.range.endOffset,
        };

        const replacement = rewriter(ctx);
        if (replacement !== undefined && replacement !== null && replacement !== ref.specifier) {
            const escaped = escapeSpecifier(replacement, quoteChar);
            s.overwrite(ref.range.startOffset, ref.range.endOffset, `${quoteChar}${escaped}${quoteChar}`);
            changed = true;
        }
    }

    if (!changed) {
        return {
            code: rawSource,
            changed: false,
            diagnostics,
        };
    }

    const transformedCode = s.toString();

    // 重新解析验证正确性与语法完整性
    const verifySession = parseSource({
        source: transformedCode,
        filename: input.filename,
        language: input.language,
    });

    const verifyAnalysis = analyzeModuleReferences(verifySession);

    if (verifyAnalysis.completeness === 'invalid') {
        diagnostics.push({
            code: 'AST_TRANSFORM_VERIFICATION_FAILED',
            severity: 'error',
            message: `Transformed code failed verification parse in ${input.filename}`,
            filename: input.filename,
        });
        return {
            code: rawSource,
            changed: false,
            diagnostics: [...diagnostics, ...verifyAnalysis.diagnostics],
        };
    }

    return {
        code: transformedCode,
        changed: true,
        diagnostics: [...diagnostics, ...verifyAnalysis.diagnostics],
    };
}
