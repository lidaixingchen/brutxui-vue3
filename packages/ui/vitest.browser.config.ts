import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { playwright } from '@vitest/browser-playwright'

const chromiumExecutablePath = process.env.BRUTX_CHROMIUM_EXECUTABLE

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            'brutx-ui-vue': resolve(__dirname, 'src/test/component-api-primitives.ts'),
            'vitepress': resolve(__dirname, 'src/test/vitepress-stub.ts'),
        },
        dedupe: ['vue', '@vue/runtime-core', '@vue/runtime-dom', '@vue/reactivity'],
    },
    optimizeDeps: {
        include: ['vue', '@vue/server-renderer', 'reka-ui', '@lucide/vue', '@tanstack/vue-virtual'],
    },
    test: {
        browser: {
            enabled: true,
            commands: {
                async pressPrimaryPointer({ page }) {
                    await page.mouse.down({ button: 'left' })
                },
                async releasePrimaryPointer({ page }) {
                    await page.mouse.up({ button: 'left' })
                },
            },
            provider: playwright({
                launchOptions: chromiumExecutablePath
                    ? { executablePath: chromiumExecutablePath }
                    : undefined,
            }),
            instances: [
                { browser: 'chromium' },
            ],
        },
        include: ['src/**/*.browser.test.ts'],
        setupFiles: ['./src/vitest.browser.setup.ts'],
    },
})
