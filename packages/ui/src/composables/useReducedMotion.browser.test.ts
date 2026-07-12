import { test, expect, vi } from 'vitest'
import { cdp } from '@vitest/browser/context'
import { defineComponent, h, nextTick, type Ref } from 'vue'
import { useReducedMotion } from './useReducedMotion'
import { mount } from '@/test/browser-mount'

async function emulateReducedMotion(value: 'reduce' | 'no-preference') {
    const session = cdp() as unknown as {
        send(method: string, params?: Record<string, unknown>): Promise<unknown>
    }
    await session.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value }],
    })
}

function mountProbe() {
    let prefersReduced: Ref<boolean> | undefined
    const wrapper = mount(defineComponent({
        setup() {
            prefersReduced = useReducedMotion()
            return { prefersReduced }
        },
        render: () => h('div'),
    }))
    return { wrapper, get value() { return prefersReduced?.value } }
}

test('returns true when browser media query is reduce', async () => {
    await emulateReducedMotion('reduce')

    const { wrapper, value } = mountProbe()
    await nextTick()

    expect(value).toBe(true)
    wrapper.unmount()
})

test('updates to false when switching to no-preference', async () => {
    await emulateReducedMotion('reduce')

    const { wrapper, value } = mountProbe()
    await nextTick()
    expect(value).toBe(true)

    await emulateReducedMotion('no-preference')
    await vi.waitFor(() => {
        expect(value).toBe(false)
    })

    wrapper.unmount()
})
