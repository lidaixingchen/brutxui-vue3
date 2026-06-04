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
        environment: 'happy-dom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        pool: 'threads',
        isolate: false,
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
            include: ['src/components/**/*.{ts,vue}', 'src/composables/**/*.ts', 'src/lib/utils.ts'],
            exclude: ['src/**/*.d.ts', 'src/components/combobox-types.ts'],
        },
    },
})
