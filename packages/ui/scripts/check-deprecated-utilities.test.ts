import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditDeprecatedUtilities } from './check-deprecated-utilities';

const temporaryDirectories: string[] = [];

function createFixture(): string {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-deprecated-utilities-'));
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

describe('auditDeprecatedUtilities', () => {
    it('accepts the standard focus rings and registered brutal shadows', () => {
        const sourceRoot = createFixture();
        writeFixture(sourceRoot, 'component.vue', `
<button class="focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden shadow-brutal-destructive" />
`);

        expect(auditDeprecatedUtilities([sourceRoot])).toEqual([]);
    });

    it('reports nonstandard ring utilities and hard-coded rgba shadows', () => {
        const sourceRoot = createFixture();
        writeFixture(sourceRoot, 'component.vue', `
<button class="ring-4 ring-[3px] shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]" />
`);

        const violations = auditDeprecatedUtilities([sourceRoot]);

        expect(violations.map((violation) => violation.category)).toEqual([
            'RING',
            'RING',
            'SHADOW_RGBA',
        ]);
    });
});
