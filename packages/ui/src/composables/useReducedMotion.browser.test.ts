import { test, expect } from 'vitest'
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

// L2 browser test: verify the composable reads real browser media query state.
// Reactivity to media changes is covered by L1 unit tests (useReducedMotion.test.ts)
// with mocked matchMedia; CDP Emulation.setEmulatedMedia does not reliably trigger
// MediaQueryList 'change' events in headless Chromium.

test('returns true when prefers-reduced-motion is reduce', async () => {
    await emulateReducedMotion('reduce')

    const { wrapper, value } = mountProbe()
    await nextTick()

    expect(value).toBe(true)
    wrapper.unmount()
})

test('returns false when prefers-reduced-motion is no-preference', async () => {
    await emulateReducedMotion('no-preference')

    const { wrapper, value } = mountProbe()
    await nextTick()

    expect(value).toBe(false)
    wrapper.unmount()
})
