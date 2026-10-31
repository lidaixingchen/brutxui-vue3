import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { compile } from 'tailwindcss'
import theme from 'tailwindcss/theme.css?raw'
import preflight from 'tailwindcss/preflight.css?raw'
import uiStyles from '../styles.css?raw'
import docsStyles from '../../../../apps/docs/.vitepress/theme/style.css?raw'
import InstallationTabs from '../../../../apps/docs/.vitepress/theme/components/InstallationTabs.vue'
import { mount } from './browser-mount'

const viewports = [
    { name: '桌面', width: 1280, height: 800 },
    { name: '窄屏', width: 375, height: 800 },
]

let compiler: Awaited<ReturnType<typeof compile>>
let stylesheet: HTMLStyleElement
let host: HTMLElement
let unmount: (() => void) | undefined

beforeAll(async () => {
    const source = [theme, preflight, uiStyles, docsStyles, '@tailwind utilities;']
        .map(css => css.replace(/^@import\s+[^;]+;/gmu, '')).join('\n')
    compiler = await compile(source)
    stylesheet = document.createElement('style')
    document.head.append(stylesheet)
})

afterEach(() => {
    unmount?.()
    host.remove()
})

afterAll(() => stylesheet.remove())

function getPaintBounds(element: HTMLElement): { right: number; bottom: number } {
    const bounds = element.getBoundingClientRect()
    const offsets = [...getComputedStyle(element).boxShadow.matchAll(/(-?\d*\.?\d+)px/g)]
        .map(match => Number(match[1]))
    const horizontal = offsets.filter((_, index) => index % 4 === 0)
    const vertical = offsets.filter((_, index) => index % 4 === 1)
    return {
        right: bounds.right + Math.max(0, ...horizontal),
        bottom: bounds.bottom + Math.max(0, ...vertical),
    }
}

describe.each(viewports)('安装方式页签：$name', viewport => {
    it('选中与悬停状态的投影保持在所属区域内', async () => {
        await page.viewport(viewport.width, viewport.height)
        host = document.createElement('main')
        host.className = 'vp-doc'
        document.body.append(host)
        const wrapper = mount(InstallationTabs, { attachTo: host, props: { componentName: 'countdown' } })
        unmount = wrapper.unmount
        const candidates = [host, ...host.querySelectorAll<HTMLElement>('[class]')]
            .flatMap(element => [...element.classList])
        stylesheet.textContent = compiler.build(candidates)
        const tablist = host.querySelector<HTMLElement>('[role="tablist"]')!
        const [cli, manual] = [...tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]')]

        await expect.poll(() => getPaintBounds(cli).right).toBeLessThanOrEqual(manual.getBoundingClientRect().left)
        await userEvent.hover(cli)
        expect(getPaintBounds(cli).right).toBeLessThanOrEqual(manual.getBoundingClientRect().left)
        cli.focus()
        await userEvent.keyboard('{ArrowRight}')
        expect(manual.getAttribute('aria-selected')).toBe('true')
        expect(document.activeElement).toBe(manual)
        await expect.poll(() => getPaintBounds(manual).bottom).toBeLessThanOrEqual(tablist.getBoundingClientRect().bottom)
        await userEvent.hover(manual)
        expect(getPaintBounds(manual).bottom).toBeLessThanOrEqual(tablist.getBoundingClientRect().bottom)
        await userEvent.keyboard('{ArrowLeft}')
        expect(cli.getAttribute('aria-selected')).toBe('true')
        expect(document.activeElement).toBe(cli)
    })
})
