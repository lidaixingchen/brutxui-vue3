import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { nextTick } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../dist/styles.css'
import PortalThemeTestFixture from './fixtures/PortalThemeTestFixture.vue'

let wrapper: ReturnType<typeof mount> | undefined
let rootWasDark = false

async function settleThemeMutation() {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    await nextTick()
}

function expectOverlayMatchesTrigger(name: string) {
    const trigger = document.getElementById(`${name}-trigger`)
    const content = document.querySelector<HTMLElement>(`[data-theme-content="${name}"]`)
    expect(trigger).not.toBeNull()
    expect(content).not.toBeNull()

    const triggerStyle = getComputedStyle(trigger!)
    const contentStyle = getComputedStyle(content!)
    expect(contentStyle.backgroundColor).toBe(triggerStyle.backgroundColor)
    expect(contentStyle.color).toBe(triggerStyle.color)
    expect(contentStyle.borderTopWidth).toBe(triggerStyle.borderTopWidth)
    expect(contentStyle.borderRadius).toBe(triggerStyle.borderRadius)
}

afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.documentElement.classList.toggle('dark', rootWasDark)
})

describe('portal theme inheritance', () => {
    it('keeps Popover and Select surfaces aligned with root and local themes', async () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.remove('dark')
        wrapper = mount(PortalThemeTestFixture)
        await nextTick()
        for (const name of [
            'root-popover',
            'root-select',
            'pastel-popover',
            'pastel-select',
            'mono-popover',
            'mono-select',
        ]) {
            expectOverlayMatchesTrigger(name)
        }

        const pastel = getComputedStyle(document.getElementById('pastel-popover-trigger')!)
        const mono = getComputedStyle(document.getElementById('mono-popover-trigger')!)
        expect(pastel.backgroundColor).toBe('rgb(22, 22, 30)')
        expect(pastel.color).toBe('rgb(240, 240, 245)')
        expect(pastel.borderTopWidth).toBe('2px')
        expect(pastel.borderRadius).toBe('8px')
        expect(mono.borderTopWidth).toBe('4px')
        expect(mono.borderRadius).toBe('0px')
        expect(pastel.backgroundColor).not.toBe(mono.backgroundColor)
    })

    it('updates open portal themes when ancestor classes and tokens change', async () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.remove('dark')
        wrapper = mount(PortalThemeTestFixture)

        const scope = document.getElementById('pastel-scope')!
        scope.className = 'theme-mono'
        scope.style.setProperty('--brutal-bg', '#123456')
        scope.style.setProperty('--brutal-fg', '#fafafa')
        scope.style.setProperty('--brutal-border-width', '6px')
        scope.style.setProperty('--brutal-radius', '13px')
        await settleThemeMutation()

        expectOverlayMatchesTrigger('pastel-popover')
        expectOverlayMatchesTrigger('pastel-select')
        const content = document.querySelector<HTMLElement>('[data-theme-content="pastel-popover"]')!
        expect(getComputedStyle(content).backgroundColor).toBe('rgb(18, 52, 86)')
        expect(getComputedStyle(content).borderTopWidth).toBe('6px')
        expect(getComputedStyle(content).borderRadius).toBe('13px')
    })

    it('keeps content class and inline token overrides above inherited theme values', async () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.remove('dark')
        wrapper = mount(PortalThemeTestFixture)
        await nextTick()

        const content = document.querySelector<HTMLElement>('[data-theme-content="pastel-override"]')!
        const style = getComputedStyle(content)
        expect(style.backgroundColor).toBe('rgb(17, 34, 51)')
        expect(style.color).toBe('rgb(78, 90, 123)')
        expect(style.borderTopWidth).toBe('5px')
        expect(style.borderRadius).toBe('14px')
    })

    it('inherits root dark mode for portals anchored outside the root element', async () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.remove('dark')
        wrapper = mount(PortalThemeTestFixture)

        document.documentElement.classList.add('dark')
        await settleThemeMutation()

        expectOverlayMatchesTrigger('root-popover')
        expectOverlayMatchesTrigger('root-select')
    })

    it('preserves local scope through a nested Popover portal', async () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.remove('dark')
        wrapper = mount(PortalThemeTestFixture)
        await nextTick()

        expectOverlayMatchesTrigger('nested-popover')
    })

    it('closes Popover with Escape and restores focus to its trigger', async () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.remove('dark')
        wrapper = mount(PortalThemeTestFixture, { props: { initiallyOpen: false } })
        const trigger = document.getElementById('mono-popover-trigger')!
        await userEvent.click(trigger)
        const panel = document.querySelector<HTMLElement>('[data-theme-content="mono-popover"]')!
        await expect.poll(() => panel.contains(document.activeElement)).toBe(true)

        await userEvent.keyboard('{Escape}')
        await nextTick()

        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        await expect.poll(() => document.activeElement).toBe(trigger)
    })

    it('inherits scoped themes when ColorPicker content opens and reopens', async () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.remove('dark')
        wrapper = mount(PortalThemeTestFixture, { props: { initiallyOpen: false } })
        const trigger = document.querySelector<HTMLElement>('#color-picker-scope [aria-haspopup="dialog"]')!
        for (let opening = 0; opening < 2; opening++) {
            await userEvent.click(trigger)
            await expect.poll(() => document.querySelector('.z-popover [role="slider"]')).not.toBeNull()
            const panel = document.querySelector('.z-popover [role="slider"]')!.closest('[role="dialog"]')!
            await expect.poll(() => getComputedStyle(panel).getPropertyValue('--brutal-bg').trim()).toBe(
                getComputedStyle(trigger).getPropertyValue('--brutal-bg').trim(),
            )
            await userEvent.keyboard('{Escape}')
            await expect.poll(() => document.querySelector('.z-popover [role="slider"]')).toBeNull()
        }
    })

    it('inherits themes when initially closed Popover and Select portals open and reopen', async () => {
        rootWasDark = document.documentElement.classList.contains('dark')
        document.documentElement.classList.remove('dark')
        wrapper = mount(PortalThemeTestFixture, { props: { initiallyOpen: false } })

        for (const name of ['root-popover', 'pastel-select', 'mono-select']) {
            const trigger = document.getElementById(`${name}-trigger`)!
            for (let opening = 0; opening < 2; opening++) {
                await userEvent.click(trigger)
                await expect.poll(() => {
                    expectOverlayMatchesTrigger(name)
                    return trigger.getAttribute('aria-expanded')
                }).toBe('true')
                await userEvent.keyboard('{Escape}')
                await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false')
                await expect.poll(() => document.querySelector(`[data-theme-content="${name}"]`)).toBeNull()
            }
        }
    })
})
