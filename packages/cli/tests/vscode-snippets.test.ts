import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { DiskFileSystemAdapter } from 'brutx-shared-vue/fs';
import {
    mergeSnippetsContent,
    writeSnippetsFile,
    mergeSnippetsFile,
} from '../src/lib/vscode-snippets.js';
import { FileTransaction } from '../src/lib/file-transaction.js';

describe('vscode snippets', () => {
    let tmpDir: string;
    const fsAdapter = new DiskFileSystemAdapter();

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-snippets-test-'));
    });

    afterEach(async () => {
        await fs.remove(tmpDir);
    });

    describe('mergeSnippetsContent', () => {
        it('preserves user comments and formatting in JSONC content', () => {
            const initialJsonc = `// Custom Brutx Snippets
{
    // My existing custom snippet
    "My Custom": {
        "prefix": "custom",
        "body": ["<Custom />"],
        "description": "custom",
    },
}
`;
            const newSnippets = {
                'BrutxUI Button': {
                    prefix: 'brutx-button',
                    body: ['<Button />'],
                    description: 'Button',
                },
            };

            const merged = mergeSnippetsContent(initialJsonc, newSnippets);

            expect(merged).toContain('// Custom Brutx Snippets');
            expect(merged).toContain('// My existing custom snippet');
            expect(merged).toContain('"My Custom"');
            expect(merged).toContain('"BrutxUI Button"');
            expect(merged).toContain('"brutx-button"');
        });

        it('creates formatted json when existing content is null or empty', () => {
            const merged = mergeSnippetsContent(null, {
                'BrutxUI Badge': {
                    prefix: 'brutx-badge',
                    body: ['<Badge />'],
                    description: 'Badge',
                },
            });

            expect(merged).toContain('"BrutxUI Badge"');
            expect(merged).toContain('"brutx-badge"');
        });

        it('throws when existing content is not a JSON object', () => {
            expect(() => {
                mergeSnippetsContent('["not", "an", "object"]', { a: {} });
            }).toThrow('not a valid JSON object');
        });

        it('throws when existing content has corrupted syntax', () => {
            expect(() => {
                mergeSnippetsContent('{ "invalid": ', { a: {} });
            }).toThrow('not a valid JSON object');
        });
    });

    describe('file operations', () => {
        it('writes snippets file and merges new components', async () => {
            const snippetPath = await writeSnippetsFile(tmpDir, ['button'], fsAdapter);
            expect(await fs.pathExists(snippetPath)).toBe(true);

            let content = await fs.readFile(snippetPath, 'utf-8');
            expect(content).toContain('BrutxUI Button');
            expect(content).not.toContain('BrutxUI Badge');

            await mergeSnippetsFile(tmpDir, ['badge'], fsAdapter);
            content = await fs.readFile(snippetPath, 'utf-8');
            expect(content).toContain('BrutxUI Button');
            expect(content).toContain('BrutxUI Badge');
        });

        it('supports writing via FileTransaction', async () => {
            const tx = new FileTransaction(fsAdapter, tmpDir);
            const snippetPath = await writeSnippetsFile(tmpDir, ['card'], fsAdapter, tx);
            await tx.commit();

            expect(await fs.pathExists(snippetPath)).toBe(true);
            const content = await fs.readFile(snippetPath, 'utf-8');
            expect(content).toContain('BrutxUI Card');
        });

        it('creates .vscode directory if it does not exist', async () => {
            const snippetPath = path.join(tmpDir, '.vscode', 'brutx.code-snippets');
            expect(await fs.pathExists(path.dirname(snippetPath))).toBe(false);

            await writeSnippetsFile(tmpDir, ['button'], fsAdapter);
            expect(await fs.pathExists(snippetPath)).toBe(true);
        });
    });
});
