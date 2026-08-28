export interface SfcScriptBlock {
    readonly content: string;
    readonly lang?: string;
    readonly setup: boolean;
    readonly generic?: string;
    readonly startOffset: number; // 脚本内容在原 SFC 中的起始绝对字符偏移量
    readonly endOffset: number;   // 脚本内容在原 SFC 中的结束绝对字符偏移量
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
    readonly isSfc: boolean; // 若为纯 TS/JS 文件，则为 false
    readonly script?: SfcScriptBlock;
    readonly scriptSetup?: SfcScriptBlock;
    readonly templateContent?: string;
    readonly styles: readonly SfcStyleBlock[];
    readonly customBlocks: ReadonlyArray<{ type: string; content: string }>;
}

export interface ImportRewriteContext {
    readonly specifier: string;
    readonly isTypeOnly: boolean;
    readonly isDynamic: boolean;
    readonly quoteChar: '\'' | '"' | '`';
    readonly startOffset: number; // 在整个原文件中的绝对起始偏移（含引号）
    readonly endOffset: number;   // 在整个原文件中的绝对结束偏移（含引号）
}

export interface ClassifiedModuleSpecifier {
    readonly specifier: string;
    readonly isTypeOnly: boolean;
    readonly isDynamic: boolean;
}

export type ImportRewriterFn = (ctx: ImportRewriteContext) => string | undefined | null;
