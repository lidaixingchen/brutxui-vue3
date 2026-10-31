import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import preflight from 'tailwindcss/preflight.css?raw'
import uiStyles from '../styles.css?raw'
import vitepressStyles from '../../../../apps/docs/node_modules/vitepress/dist/client/theme-default/styles/components/vp-doc.css?raw'
import docsStyles from '../../../../apps/docs/.vitepress/theme/style.css?raw'

const LAYOUT_TOLERANCE_PX = 1
const DESKTOP_VIEWPORT = { width: 1280, height: 800 }
const MOBILE_VIEWPORT = { width: 375, height: 800 }
const shortTable = '<table><thead><tr><th>组件</th><th>说明</th></tr></thead><tbody><tr><td>Button</td><td>操作按钮</td></tr><tr><td>Toggle</td><td>切换按钮</td></tr></tbody></table>'

let stylesheet: HTMLStyleElement
let host: HTMLElement

beforeAll(() => {
    stylesheet = document.createElement('style')
    stylesheet.textContent = [preflight, vitepressStyles, uiStyles, docsStyles]
        .map(css => css.replace(/^@import\s+[^;]+;/gmu, '')).join('\n')
    document.head.append(stylesheet)
})

afterEach(() => {
    host.remove()
})

afterAll(() => stylesheet.remove())

function createHost(html = ''): HTMLElement {
    host = document.createElement('main')
    host.className = 'vp-doc'
    host.innerHTML = html
    document.body.append(host)
    return host
}

describe('文档表格布局', () => {
    it('短内容表格的表头和各行铺满外框', async () => {
        await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height)
        createHost(`<div class="vp-doc-table-wrapper" tabindex="0">${shortTable}</div>`)
        const table = host.querySelector('table')!
        const bounds = table.getBoundingClientRect()
        for (const row of table.rows) {
            expect(Math.abs(bounds.right - row.getBoundingClientRect().right)).toBeLessThanOrEqual(LAYOUT_TOLERANCE_PX)
        }
    })

    it('窄屏的长内容表格在容器内滚动，并支持键盘访问右侧内容', async () => {
        await page.viewport(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height)
        createHost('<div class="vp-doc-table-wrapper" tabindex="0"><table><thead><tr><th>属性</th><th>类型</th><th>默认值</th></tr></thead><tbody><tr><td>config</td><td><code>ComponentProperties&lt;DocumentationThemeConfigurationOptions&gt;</code></td><td>undefined</td></tr></tbody></table></div>')
        const scroller = host.firstElementChild as HTMLElement
        expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth)
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width)
        scroller.focus()
        await userEvent.keyboard('{ArrowRight}')
        await expect.poll(() => scroller.scrollLeft).toBeGreaterThan(0)
        scroller.scrollLeft = scroller.scrollWidth
        const cell = scroller.querySelector('tr:last-child td:last-child')!
        const border = Number.parseFloat(getComputedStyle(scroller).borderRightWidth)
        const rightGap = scroller.getBoundingClientRect().right - border - cell.getBoundingClientRect().right
        expect(Math.abs(rightGap)).toBeLessThanOrEqual(LAYOUT_TOLERANCE_PX)
    })
})
