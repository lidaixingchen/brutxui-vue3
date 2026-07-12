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
    },
    test: {
        browser: {
            enabled: true,
            provider: playwright,
            instances: [
                { browser: 'chromium' },
            ],
        },
        include: ['src/**/*.browser.test.ts'],
        setupFiles: ['./src/vitest.setup.ts'],
    },
})
