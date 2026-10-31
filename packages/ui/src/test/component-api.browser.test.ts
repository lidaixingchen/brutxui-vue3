import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { nextTick } from 'vue'
import { compile } from 'tailwindcss'
import theme from 'tailwindcss/theme.css?raw'
import preflight from 'tailwindcss/preflight.css?raw'
import uiStyles from '../styles.css?raw'
import docsStyles from '../../../../apps/docs/.vitepress/theme/style.css?raw'
import ComponentApi from '../../../../apps/docs/.vitepress/theme/components/ComponentApi.vue'
import countdownData from '../../../../apps/docs/.vitepress/api-generated/countdown.zh-CN.json'
import type { ApiGroup } from '../../../../apps/docs/.vitepress/api-types'
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
    const source = [theme, preflight, uiStyles, docsStyles, '@layer utilities { @tailwind utilities; }']
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

async function getPressedBounds(button: HTMLButtonElement) {
    button.focus()
    await userEvent.keyboard('[Space>]')
    button.getAnimations().forEach(animation => animation.finish())
    const bounds = button.getBoundingClientRect()
    const active = button.matches(':active')
    await userEvent.keyboard('[/Space]')
    return { bounds, active }
}

describe.each(viewports)('API 分类栏：$name', viewport => {
    it('分类与折叠按钮按下时保持几何位置，并复用面板分隔线', async () => {
        await page.viewport(viewport.width, viewport.height)
        host = document.createElement('main')
        host.className = 'vp-doc'
        document.body.append(host)
        const wrapper = mount(ComponentApi, {
            attachTo: host,
            props: { name: 'countdown', data: countdownData as ApiGroup },
        })
        unmount = wrapper.unmount
        await nextTick()
        const candidates = [host, ...host.querySelectorAll<HTMLElement>('[class]')]
            .flatMap(element => [...element.classList])
        stylesheet.textContent = compiler.build(candidates)

        const toggle = host.querySelector<HTMLButtonElement>('.component-api-kind-toggle')!
        const before = toggle.getBoundingClientRect()
        const pressed = await getPressedBounds(toggle)
        expect(pressed.active).toBe(true)
        expect(pressed.bounds.x).toBe(before.x)
        expect(pressed.bounds.y).toBe(before.y)
        expect(toggle.getAttribute('aria-expanded')).toBe('false')
        await userEvent.keyboard('[Space]')
        expect(toggle.getAttribute('aria-expanded')).toBe('true')
        const border = getComputedStyle(toggle)
        expect(Number.parseFloat(border.borderTopWidth)).toBe(0)
        expect(Number.parseFloat(border.borderLeftWidth)).toBe(0)
        expect(Number.parseFloat(border.borderRightWidth)).toBe(0)
        expect(Number.parseFloat(border.borderBottomWidth)).toBeGreaterThan(0)
        const kinds = [...host.querySelectorAll<HTMLElement>('.component-api-kind')]
        expect(Number.parseFloat(getComputedStyle(kinds[0]).borderTopWidth)).toBe(0)
        for (const kind of kinds.slice(1)) {
            expect(Number.parseFloat(getComputedStyle(kind).borderTopWidth)).toBeGreaterThan(0)
        }

        const category = host.querySelector<HTMLButtonElement>('.component-api-category-button')!
        const categoryBefore = category.getBoundingClientRect()
        const categoryPressed = await getPressedBounds(category)
        expect(categoryPressed.active).toBe(true)
        expect(categoryPressed.bounds.x).toBe(categoryBefore.x)
        expect(categoryPressed.bounds.y).toBe(categoryBefore.y)
    })
})
