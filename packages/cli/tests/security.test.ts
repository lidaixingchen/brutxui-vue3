import { describe, it, expect } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { isSafePath, resolveAliasPath, verifyWrittenPath } from '../src/lib/project.js';

describe('isSafePath', () => {
    const cwd = path.resolve('/workspace/project');

    it('should return true for paths inside the cwd', async () => {
        const safePath = path.join(cwd, 'src/components/ui/button.tsx');
        expect(await isSafePath(safePath, cwd)).toBe(true);
    });

    it('should return true for paths exactly matching cwd', async () => {
        expect(await isSafePath(cwd, cwd)).toBe(true);
    });

    it('should return false for paths attempting path traversal out of cwd', async () => {
        const unsafePath = path.resolve(cwd, '../../etc/passwd');
        expect(await isSafePath(unsafePath, cwd)).toBe(false);
    });

    it('should return false for paths in parent directories', async () => {
        const parentPath = path.resolve(cwd, '..');
        expect(await isSafePath(parentPath, cwd)).toBe(false);
    });
});

describe('resolveAliasPath path traversal protection', () => {
    const cwd = path.resolve('/workspace/project');

    it('should throw error for alias with path traversal using ../../', async () => {
        await expect(resolveAliasPath('../../etc/passwd', cwd)).rejects.toThrow('Security Error');
    });

    it('should throw error for alias with path traversal using ../', async () => {
        await expect(resolveAliasPath('../secret-file', cwd)).rejects.toThrow('Security Error');
    });

    it('should not throw for valid alias paths within project', async () => {
        const result = await resolveAliasPath('@/components', cwd);
        expect(result).toContain(cwd);
    });
});

describe('verifyWrittenPath', () => {
    it('should not throw for a safe written path', async () => {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-verify-'));
        try {
            const filePath = path.join(tmpDir, 'test.txt');
            await fs.writeFile(filePath, 'hello');
            await expect(verifyWrittenPath(filePath, tmpDir)).resolves.toBeUndefined();
        } finally {
            await fs.remove(tmpDir);
        }
    });

    it('should throw and remove file for path outside cwd', async () => {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-verify-'));
        const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-outside-'));
        try {
            const filePath = path.join(outsideDir, 'escape.txt');
            await fs.writeFile(filePath, 'malicious');
            await expect(verifyWrittenPath(filePath, tmpDir)).rejects.toThrow('Security Error');
            expect(await fs.pathExists(filePath)).toBe(false);
        } finally {
            await fs.remove(tmpDir);
            await fs.remove(outsideDir);
        }
    });
});
