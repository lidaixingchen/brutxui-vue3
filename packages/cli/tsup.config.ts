import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    target: 'node18',
    // Bundle brutx-shared inline since it's a private workspace package
    // that won't exist in node_modules when users install from npm
    noExternal: ['brutx-shared'],
    banner: {
        js: '#!/usr/bin/env node',
    },
});
