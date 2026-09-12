import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
        dedupe: ['vue', '@vue/runtime-core', '@vue/runtime-dom', '@vue/reactivity'],
    },
    optimizeDeps: {
        include: ['vue', '@vue/server-renderer', 'reka-ui', '@lucide/vue', '@tanstack/vue-virtual'],
    },
    test: {
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [
                { browser: 'chromium' },
            ],
        },
        include: ['src/**/*.browser.test.ts'],
        setupFiles: ['./src/vitest.browser.setup.ts'],
    },
})
