import { defineConfig } from 'vitest/config'
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
        testTimeout: 10000,
        environment: 'happy-dom',
        setupFiles: ['./src/vitest.setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        pool: 'threads',
        maxWorkers: 4,
        deps: {
            optimizer: {
                web: {
                    enabled: true,
                    include: [
                        'reka-ui',
                        '@lucide/vue',
                        'v-calendar',
                        'class-variance-authority',
                        'clsx',
                        'tailwind-merge',
                        'embla-carousel-vue',
                    ],
                },
            },
        },
        coverage: {
            provider: 'v8',
            include: ['src/components/**/*.{ts,vue}', 'src/composables/**/*.ts', 'src/lib/**/*.ts'],
            exclude: ['src/**/*.d.ts', 'src/components/combobox/combobox-types.ts'],
            thresholds: {
                lines: 60,
                functions: 60,
                branches: 50,
                statements: 60,
            },
        },
    },
})
