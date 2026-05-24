import { describe, it, expect } from 'vitest';
import path from 'path';
import { isSafePath } from '../src/lib/project.js';

describe('isSafePath', () => {
    const cwd = path.resolve('/workspace/project');

    it('should return true for paths inside the cwd', () => {
        const safePath = path.join(cwd, 'src/components/ui/button.tsx');
        expect(isSafePath(safePath, cwd)).toBe(true);
    });

    it('should return true for paths exactly matching cwd', () => {
        expect(isSafePath(cwd, cwd)).toBe(true);
    });

    it('should return false for paths attempting path traversal out of cwd', () => {
        const unsafePath = path.resolve(cwd, '../../etc/passwd');
        expect(isSafePath(unsafePath, cwd)).toBe(false);
    });

    it('should return false for paths in parent directories', () => {
        const parentPath = path.resolve(cwd, '..');
        expect(isSafePath(parentPath, cwd)).toBe(false);
    });
});
