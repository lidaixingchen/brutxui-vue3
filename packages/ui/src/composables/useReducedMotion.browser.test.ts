import { test, expect } from 'vitest'
import { cdp } from '@vitest/browser/context'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { useReducedMotion } from './useReducedMotion'

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

test('returns true when browser media query is reduce', async () => {
    await emulateReducedMotion('reduce')

    const wrapper = mount(defineComponent({
        setup() {
            const prefersReduced = useReducedMotion()
            return { prefersReduced }
        },
        template: '<div>{{ prefersReduced }}</div>',
    }))
    await nextTick()

    expect(wrapper.vm.prefersReduced).toBe(true)
    wrapper.unmount()
})

test('updates to false when switching to no-preference', async () => {
    await emulateReducedMotion('reduce')

    const wrapper = mount(defineComponent({
        setup() {
            const prefersReduced = useReducedMotion()
            return { prefersReduced }
        },
        template: '<div>{{ prefersReduced }}</div>',
    }))
    await nextTick()
    expect(wrapper.vm.prefersReduced).toBe(true)

    await emulateReducedMotion('no-preference')
    await nextTick()

    expect(wrapper.vm.prefersReduced).toBe(false)
    wrapper.unmount()
})
