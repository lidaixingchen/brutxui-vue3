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
        testTimeout: 10000,
        environment: 'happy-dom',
        setupFiles: ['./src/vitest.setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}', 'scripts/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['src/**/*.browser.test.ts', ...defaultExclude],
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
            // 覆盖率门禁基准阈值
            thresholds: {
                lines: 75,
                functions: 75,
                branches: 65,
                statements: 75,
            },
        },
    },
})
