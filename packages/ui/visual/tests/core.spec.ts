import { expect, test } from '@playwright/test'
import { spawn, type ChildProcess } from 'node:child_process'

const suites = ['forms', 'overlays', 'feedback', 'containers'] as const
const themes = ['light', 'dark'] as const
// 核心组件单独基线：选取视觉表现力强、样式复杂度高、回归风险大的组件
// button=交互基础, card=容器布局, glitch-text=动画特效, spinner=多形态, badge=变体多
const coreComponents = ['button', 'card', 'glitch-text', 'spinner', 'badge'] as const
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

// 公共：禁用动画/过渡/caret，保证截图确定性（spinner 的 animate-spin、glitch-text 的 is-glitching 均受此覆盖）
async function stabilizeRendering(page: import('@playwright/test').Page) {
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
}

for (const suite of suites) {
    for (const theme of themes) {
        test(`${suite} ${theme}`, async ({ page }) => {
            await page.goto(`${visualBaseUrl}/?suite=${suite}&theme=${theme}`)
            await stabilizeRendering(page)
            const visualSuite = page.locator('.visual-suite')
            await expect(visualSuite).toBeVisible()
            await expect(visualSuite).toHaveScreenshot([`${suite}-${theme}.png`])
        })
    }
}

for (const component of coreComponents) {
    for (const theme of themes) {
        test(`core:${component} ${theme}`, async ({ page }) => {
            await page.goto(`${visualBaseUrl}/?component=${component}&theme=${theme}`)
            await stabilizeRendering(page)
            const visualComponent = page.locator('.visual-component')
            await expect(visualComponent).toBeVisible()
            await page.evaluate(() => document.fonts.ready)
            await expect(visualComponent).toHaveScreenshot([
                `core-${component}-${theme}.png`,
            ])
        })
    }
}
