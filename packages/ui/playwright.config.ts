import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './visual/tests',
    outputDir: './test-results',
    snapshotPathTemplate: './visual/baselines/{arg}{ext}',
    workers: 1,
    reporter: [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]],
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.08,
            threshold: 0.2,
        },
    },
    use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        baseURL: 'http://127.0.0.1:5177',
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
        trace: 'off',
    },
})
