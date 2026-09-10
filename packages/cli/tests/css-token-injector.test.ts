import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { DiskFileSystemAdapter } from 'brutx-shared-vue/fs';
import {
    planCssTokenInjection,
    applyCssTokenPlan,
} from '../src/lib/css/css-token-injector.js';
import { FileTransaction } from '../src/lib/file-transaction.js';
import {
    BRUTX_CSS_START_MARKER,
    BRUTX_CSS_END_MARKER,
} from '../src/lib/constants.js';

describe('CssTokenInjector', () => {
    let tmpDir: string;
    const fsAdapter = new DiskFileSystemAdapter();

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-css-token-injector-'));
    });

    afterEach(async () => {
        await fs.remove(tmpDir);
    });

    it('plans single file creation when main CSS does not exist', async () => {
        const plan = await planCssTokenInjection({
            cwd: tmpDir,
            tailwind: {
                config: '',
                css: 'src/main.css',
            },
            fs: fsAdapter,
            tokensCss: '/* custom tokens */',
        });

        expect(plan.hasChanges).toBe(true);
        expect(plan.tokensPath).toBeNull();
        expect(plan.mainCssPath).toBe(path.resolve(tmpDir, 'src/main.css'));

        const writeAction = plan.actions.find((a) => a.type === 'write-file');
        expect(writeAction).toBeDefined();
        if (writeAction && writeAction.type === 'write-file') {
            expect(writeAction.content).toContain('@import "tailwindcss";');
            expect(writeAction.content).toContain(BRUTX_CSS_START_MARKER);
            expect(writeAction.content).toContain('/* custom tokens */');
            expect(writeAction.content).toContain(BRUTX_CSS_END_MARKER);
        }
    });

    it('plans in-place replacement when main CSS already has tokens block', async () => {
        const mainPath = path.join(tmpDir, 'src', 'main.css');
        await fs.ensureDir(path.dirname(mainPath));
        await fs.writeFile(
            mainPath,
            `@import "tailwindcss";\n${BRUTX_CSS_START_MARKER}\n/* old */\n${BRUTX_CSS_END_MARKER}\n`,
            'utf-8'
        );

        const plan = await planCssTokenInjection({
            cwd: tmpDir,
            tailwind: {
                config: '',
                css: 'src/main.css',
            },
            fs: fsAdapter,
            tokensCss: '/* new tokens */',
        });

        expect(plan.hasChanges).toBe(true);
        const writeAction = plan.actions.find((a) => a.type === 'write-file');
        expect(writeAction).toBeDefined();
        if (writeAction && writeAction.type === 'write-file') {
            expect(writeAction.content).toContain('/* new tokens */');
            expect(writeAction.content).not.toContain('/* old */');
        }
    });

    it('plans dual-file coordination when tokensFile is decoupled from main CSS', async () => {
        const mainPath = path.join(tmpDir, 'src', 'main.css');
        await fs.ensureDir(path.dirname(mainPath));
        await fs.writeFile(
            mainPath,
            `@import "tailwindcss";\n${BRUTX_CSS_START_MARKER}\n/* stale */\n${BRUTX_CSS_END_MARKER}\n`,
            'utf-8'
        );

        const plan = await planCssTokenInjection({
            cwd: tmpDir,
            tailwind: {
                config: '',
                css: 'src/main.css',
                tokensFile: 'src/tokens.css',
            },
            fs: fsAdapter,
            tokensCss: '/* decoupled tokens */',
        });

        expect(plan.hasChanges).toBe(true);
        expect(plan.tokensPath).toBe(path.resolve(tmpDir, 'src/tokens.css'));

        const writes = plan.actions.filter((a) => a.type === 'write-file');
        expect(writes.length).toBe(2);

        const tokenWrite = writes.find((w) => w.type === 'write-file' && w.filePath === plan.tokensPath);
        expect(tokenWrite).toBeDefined();
        if (tokenWrite && tokenWrite.type === 'write-file') {
            expect(tokenWrite.content).toContain('/* decoupled tokens */');
        }

        const mainWrite = writes.find((w) => w.type === 'write-file' && w.filePath === plan.mainCssPath);
        expect(mainWrite).toBeDefined();
        if (mainWrite && mainWrite.type === 'write-file') {
            expect(mainWrite.content).toContain('@import "./tokens.css";');
            expect(mainWrite.content).not.toContain('/* stale */');
            expect(mainWrite.content).not.toContain(BRUTX_CSS_START_MARKER);
        }
    });

    it('applies plan successfully through FileTransaction', async () => {
        const plan = await planCssTokenInjection({
            cwd: tmpDir,
            tailwind: {
                config: '',
                css: 'src/main.css',
                tokensFile: 'src/tokens.css',
            },
            fs: fsAdapter,
            tokensCss: '/* test transaction */',
        });

        const tx = new FileTransaction(fsAdapter, tmpDir);
        await applyCssTokenPlan(plan, tx);

        expect(await fs.pathExists(path.join(tmpDir, 'src/tokens.css'))).toBe(true);
        expect(await fs.pathExists(path.join(tmpDir, 'src/main.css'))).toBe(true);

        const tokenText = await fs.readFile(path.join(tmpDir, 'src/tokens.css'), 'utf-8');
        expect(tokenText).toContain('/* test transaction */');

        const mainText = await fs.readFile(path.join(tmpDir, 'src/main.css'), 'utf-8');
        expect(mainText).toContain('@import "./tokens.css";');
    });

    it('detects and rejects path traversal attacks', async () => {
        await expect(
            planCssTokenInjection({
                cwd: tmpDir,
                tailwind: {
                    config: '',
                    css: '../outside.css',
                },
                fs: fsAdapter,
            })
        ).rejects.toThrow('CSS path traversal detected');

        await expect(
            planCssTokenInjection({
                cwd: tmpDir,
                tailwind: {
                    config: '',
                    css: 'src/main.css',
                    tokensFile: '../outside-tokens.css',
                },
                fs: fsAdapter,
            })
        ).rejects.toThrow('CSS path traversal detected');
    });

    it('cleans up broken single-sided markers in main CSS when decoupled', async () => {
        const mainPath = path.join(tmpDir, 'src', 'main.css');
        await fs.ensureDir(path.dirname(mainPath));
        await fs.writeFile(
            mainPath,
            `@import "tailwindcss";\n${BRUTX_CSS_START_MARKER}\n/* broken half marker without end */\n`,
            'utf-8'
        );

        const plan = await planCssTokenInjection({
            cwd: tmpDir,
            tailwind: {
                config: '',
                css: 'src/main.css',
                tokensFile: 'src/tokens.css',
            },
            fs: fsAdapter,
            tokensCss: '/* new tokens */',
        });

        const mainWrite = plan.actions.find((a) => a.type === 'write-file' && a.filePath === plan.mainCssPath);
        expect(mainWrite).toBeDefined();
        if (mainWrite && mainWrite.type === 'write-file') {
            expect(mainWrite.content).not.toContain(BRUTX_CSS_START_MARKER);
            expect(mainWrite.content).toContain('@import "./tokens.css";');
        }
    });
});
