import { defineConfig, defaultExclude } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    test: {
        globals: true,
        testTimeout: 15000,
        // SSR tests run in node — no window/document/navigator.
        // env.ts isClient/hasDocument will be false, exercising the SSR-safe path.
        environment: 'node',
        include: ['src/ssr/**/*.test.ts'],
        exclude: [...defaultExclude],
        pool: 'threads',
        maxWorkers: 2,
    },
})
