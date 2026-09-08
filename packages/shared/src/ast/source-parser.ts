import { parse as parseSfcCompiler } from '@vue/compiler-sfc';
import ts from 'typescript';
import type {
    ParsedSfcDescriptor,
    SfcScriptBlock,
    SourceDiagnostic,
    SourceInput,
    SourceLanguage,
    SourceRange,
} from './types.js';

export interface ScriptSessionBlock {
    readonly content: string;
    readonly setup: boolean;
    readonly baseOffset: number;
    readonly sourceFile: ts.SourceFile;
    readonly scriptKind: ts.ScriptKind;
}

export interface ParseSession {
    readonly input: SourceInput;
    readonly descriptor: ParsedSfcDescriptor;
    readonly scriptBlocks: readonly ScriptSessionBlock[];
    readonly diagnostics: readonly SourceDiagnostic[];
}

const CHAR_CODE_LF = 10;

export function computeLineAndColumn(source: string, offset: number): { line: number; column: number } {
    const clampedOffset = Math.max(0, Math.min(offset, source.length));
    let line = 1;
    let lastLineStart = 0;

    for (let i = 0; i < clampedOffset; i++) {
        if (source.charCodeAt(i) === CHAR_CODE_LF) {
            line += 1;
            lastLineStart = i + 1;
        }
    }

    const column = clampedOffset - lastLineStart + 1;
    return { line, column };
}

function collectTsParseDiagnostics(
    sourceFile: ts.SourceFile,
    filename: string,
    rawSource: string,
    baseOffset: number,
    diagnostics: SourceDiagnostic[]
): void {
    const parseDiagnostics = (sourceFile as unknown as { parseDiagnostics?: readonly ts.DiagnosticWithLocation[] }).parseDiagnostics;
    if (!parseDiagnostics || parseDiagnostics.length === 0) return;

    for (const diag of parseDiagnostics) {
        if (diag.category === ts.DiagnosticCategory.Error) {
            const start = baseOffset + (diag.start ?? 0);
            const end = baseOffset + (diag.start ?? 0) + (diag.length ?? 0);
            const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
            diagnostics.push({
                code: `TS_SYNTAX_ERROR_${diag.code}`,
                severity: 'error',
                message,
                filename,
                range: createSourceRange(rawSource, start, end),
            });
        }
    }
}

export function createSourceRange(source: string, startOffset: number, endOffset: number): SourceRange {
    const start = computeLineAndColumn(source, startOffset);
    const end = computeLineAndColumn(source, endOffset);

    return {
        startOffset,
        endOffset,
        startLine: start.line,
        startColumn: start.column,
        endLine: end.line,
        endColumn: end.column,
    };
}

export function resolveScriptKind(
    filename: string,
    overrideLanguage?: SourceLanguage,
    langAttr?: string,
    isPureScript?: boolean,
): {
    scriptKind: ts.ScriptKind;
    diagnostic?: SourceDiagnostic;
} {
    if (overrideLanguage) {
        switch (overrideLanguage) {
            case 'js':
                return { scriptKind: ts.ScriptKind.JS };
            case 'jsx':
                return { scriptKind: ts.ScriptKind.JSX };
            case 'ts':
                return { scriptKind: ts.ScriptKind.TS };
            case 'tsx':
                return { scriptKind: ts.ScriptKind.TSX };
        }
    }

    if (langAttr !== undefined) {
        const normalized = langAttr.trim().toLowerCase();
        if (normalized === 'ts') return { scriptKind: ts.ScriptKind.TS };
        if (normalized === 'tsx') return { scriptKind: ts.ScriptKind.TSX };
        if (normalized === 'js') return { scriptKind: ts.ScriptKind.JS };
        if (normalized === 'jsx') return { scriptKind: ts.ScriptKind.JSX };

        return {
            scriptKind: ts.ScriptKind.TSX,
            diagnostic: {
                code: 'AST_UNKNOWN_SCRIPT_LANG',
                severity: 'error',
                message: `Unsupported script lang "${langAttr}" in ${filename}`,
                filename,
            },
        };
    }

    const lower = filename.toLowerCase();
    if (lower.endsWith('.tsx')) return { scriptKind: ts.ScriptKind.TSX };
    if (lower.endsWith('.ts') || lower.endsWith('.mts') || lower.endsWith('.cts')) return { scriptKind: ts.ScriptKind.TS };
    if (lower.endsWith('.jsx')) return { scriptKind: ts.ScriptKind.JSX };
    if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return { scriptKind: ts.ScriptKind.JS };

    if (!isPureScript && filename.endsWith('.vue')) {
        return { scriptKind: ts.ScriptKind.JS };
    }

    return { scriptKind: ts.ScriptKind.TS };
}

function getSyntheticFilename(filename: string, scriptKind: ts.ScriptKind): string {
    if (!filename.endsWith('.vue')) return filename;
    switch (scriptKind) {
        case ts.ScriptKind.TS:
            return `${filename}.ts`;
        case ts.ScriptKind.TSX:
            return `${filename}.tsx`;
        case ts.ScriptKind.JSX:
            return `${filename}.jsx`;
        case ts.ScriptKind.JS:
        default:
            return `${filename}.js`;
    }
}

export function parseSource(input: SourceInput): ParseSession {
    const { source, filename, language } = input;
    const isVueFile = filename.endsWith('.vue');
    const diagnostics: SourceDiagnostic[] = [];

    if (!isVueFile) {
        const { scriptKind, diagnostic } = resolveScriptKind(filename, language, undefined, true);
        if (diagnostic) diagnostics.push(diagnostic);

        const syntheticFilename = getSyntheticFilename(filename, scriptKind);
        const sourceFile = ts.createSourceFile(
            syntheticFilename,
            source,
            ts.ScriptTarget.Latest,
            true,
            scriptKind
        );

        collectTsParseDiagnostics(sourceFile, filename, source, 0, diagnostics);

        const descriptor: ParsedSfcDescriptor = {
            filename,
            rawSource: source,
            isSfc: false,
            styles: [],
            customBlocks: [],
            diagnostics,
        };

        const scriptBlock: ScriptSessionBlock = {
            content: source,
            setup: false,
            baseOffset: 0,
            sourceFile,
            scriptKind,
        };

        return {
            input,
            descriptor,
            scriptBlocks: [scriptBlock],
            diagnostics,
        };
    }

    const { descriptor: sfcDescriptor, errors } = parseSfcCompiler(source, {
        filename,
        sourceMap: false,
        ignoreEmpty: true,
    });

    const hasAnySfcBlock = Boolean(
        sfcDescriptor.script ||
        sfcDescriptor.scriptSetup ||
        sfcDescriptor.template ||
        sfcDescriptor.styles.length > 0
    );

    if (!hasAnySfcBlock) {
        const { scriptKind, diagnostic } = resolveScriptKind(filename, language, undefined, true);
        if (diagnostic) diagnostics.push(diagnostic);

        const syntheticFilename = getSyntheticFilename(filename, scriptKind);
        const sourceFile = ts.createSourceFile(
            syntheticFilename,
            source,
            ts.ScriptTarget.Latest,
            true,
            scriptKind
        );

        collectTsParseDiagnostics(sourceFile, filename, source, 0, diagnostics);

        const descriptor: ParsedSfcDescriptor = {
            filename,
            rawSource: source,
            isSfc: false,
            styles: [],
            customBlocks: [],
            diagnostics,
        };

        const scriptBlock: ScriptSessionBlock = {
            content: source,
            setup: false,
            baseOffset: 0,
            sourceFile,
            scriptKind,
        };

        return {
            input,
            descriptor,
            scriptBlocks: [scriptBlock],
            diagnostics,
        };
    }

    for (const err of errors) {
        const hasLoc = 'loc' in err && Boolean(err.loc);
        const range = hasLoc && err.loc
            ? createSourceRange(source, err.loc.start.offset, err.loc.end.offset)
            : undefined;
        diagnostics.push({
            code: 'SFC_PARSE_ERROR',
            severity: 'error',
            message: err.message,
            filename,
            range,
        });
    }

    const mapScript = (
        block: typeof sfcDescriptor.script | typeof sfcDescriptor.scriptSetup,
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

    const script = mapScript(sfcDescriptor.script, false);
    const scriptSetup = mapScript(sfcDescriptor.scriptSetup, true);

    const descriptor: ParsedSfcDescriptor = {
        filename,
        rawSource: source,
        isSfc: true,
        script,
        scriptSetup,
        templateContent: sfcDescriptor.template?.content,
        styles: sfcDescriptor.styles.map(style => ({
            content: style.content,
            lang: style.lang,
            scoped: style.scoped ?? false,
            module: style.module ?? false,
            startOffset: style.loc.start.offset,
            endOffset: style.loc.end.offset,
        })),
        customBlocks: sfcDescriptor.customBlocks.map(b => ({ type: b.type, content: b.content })),
        diagnostics,
    };

    const sessionBlocks: ScriptSessionBlock[] = [];

    const blocksToProcess: Array<{ block: typeof sfcDescriptor.script | typeof sfcDescriptor.scriptSetup; setup: boolean }> = [];
    if (sfcDescriptor.script) blocksToProcess.push({ block: sfcDescriptor.script, setup: false });
    if (sfcDescriptor.scriptSetup) blocksToProcess.push({ block: sfcDescriptor.scriptSetup, setup: true });

    for (const item of blocksToProcess) {
        const rawBlock = item.block!;
        if (rawBlock.src) {
            diagnostics.push({
                code: 'SFC_EXTERNAL_SCRIPT_SRC',
                severity: 'info',
                message: `External script src "${rawBlock.src}" not inlined in ${filename}`,
                filename,
                range: createSourceRange(source, rawBlock.loc.start.offset, rawBlock.loc.end.offset),
            });
            continue;
        }

        const { scriptKind, diagnostic } = resolveScriptKind(filename, language, rawBlock.lang);
        if (diagnostic) diagnostics.push(diagnostic);

        const syntheticFilename = getSyntheticFilename(filename, scriptKind);

        const sourceFile = ts.createSourceFile(
            syntheticFilename,
            rawBlock.content,
            ts.ScriptTarget.Latest,
            true,
            scriptKind
        );

        collectTsParseDiagnostics(sourceFile, filename, source, rawBlock.loc.start.offset, diagnostics);

        sessionBlocks.push({
            content: rawBlock.content,
            setup: item.setup,
            baseOffset: rawBlock.loc.start.offset,
            sourceFile,
            scriptKind,
        });
    }

    return {
        input,
        descriptor,
        scriptBlocks: sessionBlocks,
        diagnostics,
    };
}
