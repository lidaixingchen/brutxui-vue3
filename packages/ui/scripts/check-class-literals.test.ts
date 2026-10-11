import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkClassLiterals } from './check-class-literals';

const temporaryDirectories: string[] = [];

function createFixture(): string {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-class-literals-'));
    temporaryDirectories.push(directory);
    return directory;
}

function writeFixture(rootDir: string, relativePath: string, content: string): void {
    const filePath = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
}

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

describe('checkClassLiterals', () => {
    it('accepts classes resolved from a closed literal map', () => {
        const sourceRoot = createFixture();
        writeFixture(sourceRoot, 'variants.ts', [
            "import { cva } from 'class-variance-authority';",
            "const colors = { surface: 'bg-brutal-bg' } as const;",
            'export const panel = cva(`p-4 ${colors.surface}`);',
        ].join('\n'));

        const result = checkClassLiterals(sourceRoot);

        expect(result.filesScanned).toBe(1);
        expect(result.violations).toEqual([]);
    });

    it('reports runtime values interpolated into class names', () => {
        const sourceRoot = createFixture();
        writeFixture(sourceRoot, 'variants.ts', [
            "import { cva } from 'class-variance-authority';",
            'export const panel = cva(`p-4 bg-${runtimeColor}-600`);',
        ].join('\n'));

        const result = checkClassLiterals(sourceRoot);

        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].token).toBe('<无法静态解析的动态值>');
    });
});
