import { describe, it, expect } from 'vitest';
import path from 'path';
import { isSafePath, resolveAliasPath } from '../src/lib/project.js';

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
