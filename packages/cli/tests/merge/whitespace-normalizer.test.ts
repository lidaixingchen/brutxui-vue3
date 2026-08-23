import { describe, expect, it } from 'vitest';
import {
    detectEol,
    detectIndentation,
    normalizeEol,
    normalizeLineForFuzzyDiff,
    restoreEol,
} from '../../src/lib/merge/whitespace-normalizer.js';

describe('whitespace-normalizer', () => {
    it('detects CRLF and LF correctly', () => {
        expect(detectEol('hello\r\nworld')).toBe('\r\n');
        expect(detectEol('hello\nworld')).toBe('\n');
        expect(detectEol('single line')).toBe('\n');
    });

    it('normalizes CRLF to LF', () => {
        expect(normalizeEol('a\r\nb\r\nc')).toBe('a\nb\nc');
    });

    it('restores original EOL accurately', () => {
        const text = 'a\nb\nc';
        expect(restoreEol(text, '\r\n')).toBe('a\r\nb\r\nc');
        expect(restoreEol(text, '\n')).toBe('a\nb\nc');
    });

    it('detects dominant indentation', () => {
        const twoSpaces = 'function test() {\n  const a = 1;\n  const b = 2;\n}';
        expect(detectIndentation(twoSpaces)).toEqual({
            indentStr: '  ',
            size: 2,
            type: 'space',
        });

        const fourSpaces = 'function test() {\n    const a = 1;\n    const b = 2;\n}';
        expect(detectIndentation(fourSpaces)).toEqual({
            indentStr: '    ',
            size: 4,
            type: 'space',
        });
    });

    it('normalizes lines for fuzzy comparison by stripping quotes and whitespace', () => {
        expect(normalizeLineForFuzzyDiff('  import { cn } from \'@/lib/utils\';  ')).toBe(
            'import { cn } from "@/lib/utils";'
        );
        expect(normalizeLineForFuzzyDiff('import { cn } from "@/lib/utils";')).toBe(
            'import { cn } from "@/lib/utils";'
        );
    });
});
