import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    clean: true,
    sourcemap: true,
    target: 'node22',
    noExternal: ['brutx-shared-vue'],
    banner: {
        js: '#!/usr/bin/env node',
    },
    onSuccess: async () => {
        cpSync(
            resolve('src/styles'),
            resolve('dist/styles'),
            { recursive: true }
        );
    },
});
