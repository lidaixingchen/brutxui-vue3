const CRLF = '\r\n';
const LF = '\n';

export function detectEol(text: string): typeof LF | typeof CRLF {
    const crlfCount = (text.match(/\r\n/g) || []).length;
    const lfCount = (text.match(/[^\r]\n/g) || []).length;
    return crlfCount > lfCount ? CRLF : LF;
}

export function normalizeEol(text: string): string {
    return text.replace(/\r\n/g, LF);
}

export function restoreEol(text: string, targetEol: typeof LF | typeof CRLF): string {
    const normalized = normalizeEol(text);
    if (targetEol === LF) {
        return normalized;
    }
    return normalized.replace(/\n/g, CRLF);
}

export interface IndentationInfo {
    indentStr: string;
    size: number;
    type: 'space' | 'tab';
}

export function detectIndentation(text: string): IndentationInfo {
    const lines = normalizeEol(text).split(LF);
    const spaceIndentCounts: Record<number, number> = {};
    let tabLines = 0;
    let totalSpaceLines = 0;

    for (const line of lines) {
        if (!line.trim()) continue;
        const leadingMatch = line.match(/^([ \t]+)/);
        if (!leadingMatch) continue;

        const whitespace = leadingMatch[1];
        if (whitespace.includes('\t')) {
            tabLines++;
        } else {
            const spaces = whitespace.length;
            if (spaces >= 2 && spaces <= 8) {
                spaceIndentCounts[spaces] = (spaceIndentCounts[spaces] ?? 0) + 1;
                totalSpaceLines++;
            }
        }
    }

    if (tabLines > totalSpaceLines) {
        return { indentStr: '\t', size: 1, type: 'tab' };
    }

    let dominantSize = 4;
    let maxCount = -1;
    for (const [sizeStr, count] of Object.entries(spaceIndentCounts)) {
        const size = Number(sizeStr);
        if (count > maxCount) {
            maxCount = count;
            dominantSize = size;
        }
    }

    return {
        indentStr: ' '.repeat(dominantSize),
        size: dominantSize,
        type: 'space',
    };
}

export function normalizeLineForFuzzyDiff(line: string): string {
    return line
        .trim()
        .replace(/['"`]/g, '"')
        .replace(/\s+/g, ' ');
}
