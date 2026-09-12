import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref, type Ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGlitchEffect, type UseGlitchEffectOptions } from './useGlitchEffect'

interface HarnessApi {
    isActive: Readonly<Ref<boolean>>
    play: () => void
    stop: () => void
    startAutoplay: () => void
}

function createMediaQuery(matches: boolean): MediaQueryList {
    return {
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    } as unknown as MediaQueryList
}

describe('useGlitchEffect', () => {
    let originalMatchMedia: typeof window.matchMedia

    beforeEach(() => {
        vi.useFakeTimers()
        originalMatchMedia = window.matchMedia
        window.matchMedia = vi.fn(() => createMediaQuery(false)) as unknown as typeof window.matchMedia
    })

    afterEach(() => {
        window.matchMedia = originalMatchMedia
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    function mountHarness(options: UseGlitchEffectOptions = {}) {
        let api: HarnessApi | undefined
        const wrapper = mount(defineComponent({
            setup() {
                api = useGlitchEffect(options)
                return { api }
            },
            template: '<div />',
        }))
        if (!api) throw new Error('useGlitchEffect harness was not initialized')
        return { wrapper, api }
    }

    it('keeps play and stop unconditional for the standalone composable', () => {
        const { wrapper, api } = mountHarness({ disabled: true, trigger: 'none' })

        api.play()
        expect(api.isActive.value).toBe(true)
        api.stop()
        expect(api.isActive.value).toBe(false)

        wrapper.unmount()
    })

    it('does not create effect resources while preserving explicit play semantics', async () => {
        const enabled = ref(false)
        const { wrapper, api } = mountHarness({ enabled, trigger: 'autoplay' })

        await nextTick()
        expect(window.matchMedia).not.toHaveBeenCalled()
        expect(vi.getTimerCount()).toBe(0)

        api.startAutoplay()
        api.play()
        expect(api.isActive.value).toBe(true)
        expect(vi.getTimerCount()).toBe(0)

        enabled.value = true
        await nextTick()
        expect(window.matchMedia).toHaveBeenCalledTimes(1)
        expect(vi.getTimerCount()).toBe(1)

        enabled.value = false
        await nextTick()
        expect(api.isActive.value).toBe(false)
        expect(vi.getTimerCount()).toBe(0)

        wrapper.unmount()
    })
})
