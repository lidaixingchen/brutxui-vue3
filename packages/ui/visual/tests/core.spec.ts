import { expect, test } from '@playwright/test'
import { spawn, type ChildProcess } from 'node:child_process'

const suites = ['forms', 'overlays', 'feedback', 'containers'] as const
const themes = ['light', 'dark'] as const
const visualBaseUrl = 'http://127.0.0.1:5177'
let previewProcess: ChildProcess | undefined

async function waitForServer(url: string) {
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
        try {
            const response = await fetch(url)
            if (response.ok) return
        } catch {
            // Vite preview is still starting.
        }
        await new Promise(resolve => setTimeout(resolve, 250))
    }

    throw new Error(`Visual preview server did not start at ${url}`)
}

test.beforeAll(async () => {
    previewProcess = spawn(
        process.execPath,
        [
            './node_modules/vite/bin/vite.js',
            'preview',
            '--config',
            'visual/vite.config.ts',
            '--host',
            '127.0.0.1',
            '--port',
            '5177',
            '--strictPort',
        ],
        {
            cwd: process.cwd(),
            stdio: 'ignore',
            windowsHide: true,
        },
    )

    await waitForServer(visualBaseUrl)
})

test.afterAll(async () => {
    previewProcess?.kill()
})

for (const suite of suites) {
    for (const theme of themes) {
        test(`${suite} ${theme}`, async ({ page }) => {
            await page.goto(`${visualBaseUrl}/?suite=${suite}&theme=${theme}`)
            await page.addStyleTag({
                content: `
                    *,
                    *::before,
                    *::after {
                        animation: none !important;
                        transition: none !important;
                        caret-color: transparent !important;
                    }
                `,
            })
            const visualSuite = page.locator('.visual-suite')
            await expect(visualSuite).toBeVisible()
            await expect(visualSuite).toHaveScreenshot([`${suite}-${theme}.png`])
        })
    }
}
