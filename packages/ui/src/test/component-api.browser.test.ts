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
import { calculateContrastRatio } from '../../../shared/src/color-contrast'
import { mount } from './browser-mount'

const MINIMUM_TEXT_CONTRAST = 4.5
const COLOR_PROBE_SIZE = 1
const viewports = [
    { name: '桌面', width: 1280, height: 800 },
    { name: '窄屏', width: 375, height: 800 },
]

let compiler: Awaited<ReturnType<typeof compile>>
let stylesheet: HTMLStyleElement
let host: HTMLElement
let unmount: (() => void) | undefined

beforeAll(async () => {
    const source = [
        '@layer theme, base, components, utilities;',
        `@layer theme { ${theme} }`,
        `@layer base { ${preflight} }`,
        uiStyles,
        docsStyles,
        '@layer utilities { @tailwind utilities; }',
    ]
        .map(css => css.replace(/^@import\s+[^;]+;/gmu, '')).join('\n')
    compiler = await compile(source)
    stylesheet = document.createElement('style')
    document.head.append(stylesheet)
})

afterEach(() => {
    document.documentElement.classList.remove('dark')
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

async function mountApi(viewport: { width: number; height: number }) {
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
}

function resolveCssColor(color: string): string {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = COLOR_PROBE_SIZE
    const context = canvas.getContext('2d')!
    context.fillStyle = color
    context.fillRect(0, 0, COLOR_PROBE_SIZE, COLOR_PROBE_SIZE)
    const [red, green, blue] = context.getImageData(0, 0, COLOR_PROBE_SIZE, COLOR_PROBE_SIZE).data
    return `rgb(${red}, ${green}, ${blue})`
}

describe.each(viewports)('API 分类栏：$name', viewport => {
    it('分类与折叠按钮按下时保持几何位置，并复用面板分隔线', async () => {
        await mountApi(viewport)

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

    it('深浅色下使用常驻色块建立标题层级，并保持悬停文字对比度', async () => {
        await mountApi(viewport)
        const toggle = host.querySelector<HTMLButtonElement>('.component-api-kind-toggle')!
        const toolbar = host.querySelector<HTMLElement>('.component-api-controls')!
        const heading = host.querySelector<HTMLElement>('.component-api-table thead')!
        const count = toggle.querySelector<HTMLElement>('.component-api-kind-count')!

        for (const dark of [false, true]) {
            document.documentElement.classList.toggle('dark', dark)
            await userEvent.hover(toolbar)
            toggle.getAnimations().forEach(animation => animation.finish())
            const reference = document.createElement('span')
            reference.style.backgroundColor = 'var(--brutal-secondary)'
            reference.style.color = 'var(--brutal-secondary-foreground)'
            host.append(reference)
            const expectedBackground = getComputedStyle(reference).backgroundColor
            const expectedForeground = getComputedStyle(reference).color
            reference.remove()

            const style = getComputedStyle(toggle)
            expect(style.backgroundColor).toBe(expectedBackground)
            expect(style.color).toBe(expectedForeground)
            expect(style.backgroundColor).not.toBe(getComputedStyle(toolbar).backgroundColor)
            expect(getComputedStyle(heading).backgroundColor).toBe(getComputedStyle(toolbar).backgroundColor)
            expect(Number(style.fontWeight)).toBeGreaterThan(Number(getComputedStyle(toolbar.querySelector('label')!).fontWeight))
            expect(Number.parseFloat(getComputedStyle(count).fontSize)).toBeLessThan(Number.parseFloat(style.fontSize))
            expect(calculateContrastRatio(style.backgroundColor, style.color)).toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST)

            const before = toggle.getBoundingClientRect()
            await userEvent.hover(toggle)
            toggle.getAnimations().forEach(animation => animation.finish())
            const hovered = getComputedStyle(toggle)
            expect(hovered.color).toBe(expectedForeground)
            expect(calculateContrastRatio(resolveCssColor(hovered.backgroundColor), hovered.color)).toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST)
            expect(toggle.getBoundingClientRect().x).toBe(before.x)
            expect(toggle.getBoundingClientRect().y).toBe(before.y)
        }
    })
})
