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
        exclude: ['src/**/*.browser.test.ts', 'src/ssr/**/*.test.ts', ...defaultExclude],
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
            exclude: ['src/**/*.d.ts', 'src/components/combobox/combobox-types.ts', 'src/**/*.{test,spec}.{ts,tsx}'],
            reportsDirectory: 'coverage/full',
            reporter: ['text-summary', 'json', 'json-summary', 'html'],
            reportOnFailure: true,
            // 覆盖率门禁基准阈值
            thresholds: {
                lines: 88,
                functions: 87,
                branches: 77,
                statements: 86,
                'src/components/tree-select/TreeSelectNode.vue': {
                    lines: 97,
                    functions: 100,
                    branches: 84,
                    statements: 88,
                },
                'src/components/upload/UploadTrigger.vue': {
                    lines: 100,
                    functions: 100,
                    branches: 96,
                    statements: 100,
                },
                'src/components/menu/SubMenu.vue': {
                    lines: 65,
                    functions: 85,
                    branches: 66,
                    statements: 64,
                },
            },
        },
    },
})
