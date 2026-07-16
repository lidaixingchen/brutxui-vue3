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
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
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
            // 阶段 1（v1 现状）：lines 60, functions 60, branches 50, statements 60
            // 阶段 2（v2 P0 完成）：T2 = max(阶段1, actual - 2%)，向下取整到 5 的倍数
            //   实测：lines 81.12%, functions 80.45%, branches 69.65%, statements 80.04%
            //   T2:  lines 75, functions 75, branches 65, statements 75
            // 阶段 3（v2 P1 完成）：T3 = max(T2, actual' - 2%)，向下取整到 5 的倍数
            //   实测：lines 80.94%, functions 80.23%, branches 69.32%, statements 79.84%
            //   T3:  lines 75, functions 75, branches 65, statements 75（与 T2 持平，未提升）
            thresholds: {
                lines: 75,
                functions: 75,
                branches: 65,
                statements: 75,
            },
        },
    },
})
