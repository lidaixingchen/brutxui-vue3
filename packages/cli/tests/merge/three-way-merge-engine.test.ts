import { describe, expect, it } from 'vitest';
import { threeWayMerge } from '../../src/lib/merge/three-way-merge-engine.js';

describe('ThreeWayMergeEngine', () => {
    it('returns unchanged when all three sides are identical', () => {
        const code = 'export const a = 1;\nexport const b = 2;';
        const result = threeWayMerge(code, code, code);
        expect(result.status).toBe('unchanged');
        expect(result.action).toBe('skip');
        expect(result.hasConflicts).toBe(false);
        expect(result.content).toBe(code);
    });

    it('cleanly merges when only remote has updates and local is unmodified', () => {
        const base = 'line 1\nline 2\nline 3';
        const local = 'line 1\nline 2\nline 3';
        const remote = 'line 1\nline 2 updated\nline 3';

        const result = threeWayMerge(base, local, remote);
        expect(result.status).toBe('merged');
        expect(result.hasConflicts).toBe(false);
        expect(result.content).toBe('line 1\nline 2 updated\nline 3');
    });

    it('cleanly preserves local modifications when remote is unmodified', () => {
        const base = 'line 1\nline 2\nline 3';
        const local = 'line 1\nline 2 (local custom)\nline 3';
        const remote = 'line 1\nline 2\nline 3';

        const result = threeWayMerge(base, local, remote);
        expect(result.status).toBe('unchanged');
        expect(result.hasConflicts).toBe(false);
        expect(result.content).toBe(local);
    });

    it('cleanly merges non-overlapping modifications from both sides', () => {
        const base = 'line 1\nline 2\nline 3\nline 4\nline 5';
        const local = 'line 1 (local mod)\nline 2\nline 3\nline 4\nline 5';
        const remote = 'line 1\nline 2\nline 3\nline 4 (remote fix)\nline 5';

        const result = threeWayMerge(base, local, remote);
        expect(result.status).toBe('merged');
        expect(result.hasConflicts).toBe(false);
        expect(result.content).toBe(
            'line 1 (local mod)\nline 2\nline 3\nline 4 (remote fix)\nline 5'
        );
    });

    it('cleanly merges equivalent evolution where both local and remote made the exact same change', () => {
        const base = 'line 1\nline 2\nline 3';
        const local = 'line 1\nline 2 (same bugfix)\nline 3';
        const remote = 'line 1\nline 2 (same bugfix)\nline 3';

        const result = threeWayMerge(base, local, remote);
        expect(result.status).toBe('merged');
        expect(result.hasConflicts).toBe(false);
        expect(result.content).toBe('line 1\nline 2 (same bugfix)\nline 3');
    });

    it('marks conflict with standard Git markers when modifying the same block differently', () => {
        const base = 'function greet() {\n    return "hello";\n}';
        const local = 'function greet() {\n    return "hello local user";\n}';
        const remote = 'function greet() {\n    return "hello upstream remote";\n}';

        const result = threeWayMerge(base, local, remote);
        expect(result.status).toBe('conflict');
        expect(result.hasConflicts).toBe(true);
        expect(result.conflictCount).toBe(1);
        expect(result.content).toContain('<<<<<<< LOCAL');
        expect(result.content).toContain('return "hello local user";');
        expect(result.content).toContain('=======');
        expect(result.content).toContain('return "hello upstream remote";');
        expect(result.content).toContain('>>>>>>> REMOTE');
    });

    it('respects --ours and --theirs conflict resolution strategies', () => {
        const base = 'value = 1';
        const local = 'value = 2 (local)';
        const remote = 'value = 3 (remote)';

        const oursResult = threeWayMerge(base, local, remote, { conflictStrategy: 'ours' });
        expect(oursResult.hasConflicts).toBe(false);
        expect(oursResult.content).toBe('value = 2 (local)');

        const theirsResult = threeWayMerge(base, local, remote, { conflictStrategy: 'theirs' });
        expect(theirsResult.hasConflicts).toBe(false);
        expect(theirsResult.content).toBe('value = 3 (remote)');
    });

    it('preserves Windows CRLF line endings in merge output', () => {
        const base = 'line 1\r\nline 2\r\nline 3';
        const local = 'line 1\r\nline 2 (local)\r\nline 3';
        const remote = 'line 1\r\nline 2\r\nline 3 (remote)';

        const result = threeWayMerge(base, local, remote);
        expect(result.detectedEol).toBe('\r\n');
        expect(result.content).toContain('\r\n');
        expect(result.content).toBe('line 1\r\nline 2 (local)\r\nline 3 (remote)');
    });

    it('treats pure quote and whitespace differences as equivalent changes', () => {
        const base = 'import { foo } from "./foo";';
        const local = "import { foo } from './foo';";
        const remote = 'import { foo } from "./foo";';

        const result = threeWayMerge(base, local, remote);
        expect(result.hasConflicts).toBe(false);
    });
});
