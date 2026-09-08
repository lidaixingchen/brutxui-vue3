export type SourceLanguage = 'js' | 'jsx' | 'ts' | 'tsx';

export interface SourceInput {
    readonly source: string;
    readonly filename: string;
    readonly language?: SourceLanguage;
}

export interface SourceRange {
    readonly startOffset: number;
    readonly endOffset: number;
    readonly startLine: number;
    readonly startColumn: number;
    readonly endLine: number;
    readonly endColumn: number;
}

export interface SourceDiagnostic {
    readonly code: string;
    readonly severity: 'error' | 'warning' | 'info';
    readonly message: string;
    readonly filename: string;
    readonly range?: SourceRange;
}

export type ModuleReferenceKind =
    | 'import-declaration'
    | 'export-declaration'
    | 'dynamic-import'
    | 'import-equals'
    | 'require';

export interface ModuleReference {
    readonly kind: ModuleReferenceKind;
    readonly specifier: string;
    readonly isTypeOnly: boolean;
    readonly isDynamic: boolean;
    readonly hasVerbatimSideEffect?: boolean;
    readonly range: SourceRange;
    readonly quoteChar?: '\'' | '"' | '`';
}

export type ModuleCompleteness = 'complete' | 'partial' | 'invalid';

export interface ClassifiedModuleSpecifier {
    readonly specifier: string;
    readonly isTypeOnly: boolean;
    readonly isDynamic: boolean;
    readonly hasVerbatimSideEffect?: boolean;
}

export interface ModuleAnalysisResult {
    readonly references: readonly ModuleReference[];
    readonly dependencies: readonly ClassifiedModuleSpecifier[];
    readonly diagnostics: readonly SourceDiagnostic[];
    readonly completeness: ModuleCompleteness;
}

export interface TransformResult {
    readonly code: string;
    readonly changed: boolean;
    readonly diagnostics: readonly SourceDiagnostic[];
}

export interface SfcScriptBlock {
    readonly content: string;
    readonly lang?: string;
    readonly setup: boolean;
    readonly generic?: string;
    readonly startOffset: number;
    readonly endOffset: number;
    readonly loc: {
        readonly start: { line: number; column: number; offset: number };
        readonly end: { line: number; column: number; offset: number };
    };
}

export interface SfcStyleBlock {
    readonly content: string;
    readonly lang?: string;
    readonly scoped: boolean;
    readonly module: boolean | string;
    readonly startOffset: number;
    readonly endOffset: number;
}

export interface ParsedSfcDescriptor {
    readonly filename: string;
    readonly rawSource: string;
    readonly isSfc: boolean;
    readonly script?: SfcScriptBlock;
    readonly scriptSetup?: SfcScriptBlock;
    readonly templateContent?: string;
    readonly styles: readonly SfcStyleBlock[];
    readonly customBlocks: ReadonlyArray<{ type: string; content: string }>;
    readonly diagnostics?: readonly SourceDiagnostic[];
}

export interface ImportRewriteContext {
    readonly specifier: string;
    readonly isTypeOnly: boolean;
    readonly isDynamic: boolean;
    readonly quoteChar: '\'' | '"' | '`';
    readonly startOffset: number;
    readonly endOffset: number;
}

export type ImportRewriterFn = (ctx: ImportRewriteContext) => string | undefined | null;
