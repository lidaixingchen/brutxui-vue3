import type {
    ClassifiedModuleSpecifier,
    ImportRewriterFn,
    ModuleAnalysisResult,
    ParsedSfcDescriptor,
    SourceInput,
    SourceLanguage,
    TransformResult,
} from './types.js';
import { parseSource } from './source-parser.js';
import { analyzeModuleReferences } from './module-references.js';
import { transformImportsInternal } from './import-transformer.js';

export const DEFAULT_SFC_FILENAME = 'component.vue';

export class SfcAstEngine {
    /**
     * 解析 Vue SFC 或纯 TS/JS 源码，构建标准化 Descriptor
     */
    static parse(rawSource: string, filename = DEFAULT_SFC_FILENAME, language?: SourceLanguage): ParsedSfcDescriptor {
        const session = parseSource({ source: rawSource, filename, language });
        return session.descriptor;
    }

    /**
     * 完整分析源文件中的所有模块引用、聚合依赖、完整性状态及诊断
     */
    static analyzeModules(rawSource: string, filename = DEFAULT_SFC_FILENAME, language?: SourceLanguage): ModuleAnalysisResult {
        const session = parseSource({ source: rawSource, filename, language });
        return analyzeModuleReferences(session);
    }

    /**
     * 提取源文件中的全部模块导入
     */
    static extractModuleSpecifiers(
        rawSource: string,
        filename = DEFAULT_SFC_FILENAME,
        language?: SourceLanguage
    ): ClassifiedModuleSpecifier[] {
        const result = SfcAstEngine.analyzeModules(rawSource, filename, language);
        return [...result.dependencies];
    }

    /**
     * 利用 MagicString 高保真、原地重写源文件的 import 别名（带验证）
     */
    static transform(
        rawSource: string,
        rewriter: ImportRewriterFn,
        filename = DEFAULT_SFC_FILENAME,
        language?: SourceLanguage
    ): TransformResult {
        const input: SourceInput = { source: rawSource, filename, language };
        const session = parseSource(input);
        const analysis = analyzeModuleReferences(session);

        if (analysis.completeness === 'invalid') {
            return {
                code: rawSource,
                changed: false,
                diagnostics: analysis.diagnostics,
            };
        }

        return transformImportsInternal(input, analysis.references, rewriter);
    }

    /**
     * 利用 MagicString 高保真、原地重写 Vue SFC / TS 文件的 import 别名
     */
    static transformImports(
        rawSource: string,
        rewriter: ImportRewriterFn,
        filename = DEFAULT_SFC_FILENAME,
        language?: SourceLanguage
    ): string {
        const result = SfcAstEngine.transform(rawSource, rewriter, filename, language);
        return result.code;
    }
}
