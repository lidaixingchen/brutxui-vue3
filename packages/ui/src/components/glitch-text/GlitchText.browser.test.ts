import { test, expect } from 'vitest'
import { cdp } from '@vitest/browser/context'
import { mount } from '@vue/test-utils'
import GlitchText from './GlitchText.vue'

// @vitest/browser v4 的 BrowserPage 没有 emulateMedia 方法，
// 通过 CDP Emulation.setEmulatedMedia 直接模拟 prefers-reduced-motion 媒体特性
async function emulateReducedMotion(value: 'reduce' | 'no-preference') {
    const session = cdp() as unknown as {
        send(method: string, params?: Record<string, unknown>): Promise<unknown>
    }
    await session.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value }],
    })
}

test('hides pseudo-elements when prefers-reduced-motion is reduce', async () => {
    await emulateReducedMotion('reduce')

    const wrapper = mount(GlitchText, {
        props: { text: 'BrutxUI', trigger: 'none' },
        attachTo: document.body,
    })

    const element = wrapper.element as HTMLElement
    element.classList.add('is-glitching')

    const beforeStyle = window.getComputedStyle(element, '::before')
    expect(beforeStyle.display).toBe('none')

    wrapper.unmount()
})

test('shows pseudo-elements when prefers-reduced-motion is no-preference', async () => {
    await emulateReducedMotion('no-preference')

    const wrapper = mount(GlitchText, {
        props: { text: 'BrutxUI', trigger: 'none' },
        attachTo: document.body,
    })

    const element = wrapper.element as HTMLElement
    element.classList.add('is-glitching')

    const beforeStyle = window.getComputedStyle(element, '::before')
    expect(beforeStyle.display).not.toBe('none')

    wrapper.unmount()
})
