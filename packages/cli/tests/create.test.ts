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
});
