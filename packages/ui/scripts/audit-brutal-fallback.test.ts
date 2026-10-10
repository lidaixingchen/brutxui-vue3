import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditFallbacks } from './audit-brutal-fallback';

const temporaryDirectories: string[] = [];

function createFixture(): string {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-fallback-audit-'));
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

describe('auditFallbacks', () => {
    it('accepts theme-equivalent values and the dark subtle-color fallbacks', () => {
        const sourceRoot = createFixture();
        writeFixture(sourceRoot, 'styles.css', `
:root { color: var(--brutal-bg, #fff); }
.dark {
  color: color-mix(in srgb, var(--brutal-bg, #141414) 20%, transparent);
  background: color-mix(in srgb, var(--brutal-info, #3B82F6) 20%, transparent);
}
`);

        const result = auditFallbacks(sourceRoot);

        expect(result.violations).toEqual([]);
        expect(result.redundantWhitelist).toEqual([]);
    });

    it('fails on missing fallbacks and mismatches outside the narrow theme exception', () => {
        const sourceRoot = createFixture();
        writeFixture(sourceRoot, 'styles.css', `
.dark { color: var(--brutal-bg, #141414); background: var(--brutal-info, #3b82f6); }
.invalid { color: var(--brutal-bg, #222222); }
`);
        writeFixture(sourceRoot, 'components/example.vue', `
<div style="color: var(--brutal-primary); border-color: var(--brutal-secondary, #000000)" />
`);

        const result = auditFallbacks(sourceRoot);

        expect(result.violations.map((violation) => violation.type)).toEqual([
            'missing-fallback',
            'fallback-mismatch',
            'fallback-mismatch',
        ]);
    });
});
