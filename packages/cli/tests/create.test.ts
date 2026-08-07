import { describe, it, expect } from 'vitest';
import { create } from '../src/commands/create.js';

describe('create command', () => {
    it('should reject unsupported project templates before scaffolding', async () => {
        await expect(
            create('demo-app', {
                template: 'react' as never,
                packageManager: 'pnpm',
            }),
        ).rejects.toThrow('Unsupported template: "react"');
    });

    describe('project name validation', () => {
        it('should reject "." and ".." as project names (path traversal)', async () => {
            await expect(create('.', { packageManager: 'pnpm' }))
                .rejects.toThrow('Invalid project name');
            await expect(create('..', { packageManager: 'pnpm' }))
                .rejects.toThrow('Invalid project name');
        });

        it('should reject option-like names starting with "-"', async () => {
            await expect(create('-demo', { packageManager: 'pnpm' }))
                .rejects.toThrow('Invalid project name');
        });

        it('should reject names with illegal characters', async () => {
            await expect(create('my app', { packageManager: 'pnpm' }))
                .rejects.toThrow('Invalid project name');
        });
    });
});
