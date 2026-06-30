import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, type Ref } from 'vue'

import { useReducedMotion } from './useReducedMotion'

function createMockMediaQuery(matches: boolean) {
    const listeners: Record<string, (e: MediaQueryListEvent) => void> = {}
    return {
        matches,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
            listeners[event] = listener
        }),
        removeEventListener: vi.fn((event: string) => {
            delete listeners[event]
        }),
        _trigger(match: boolean) {
            const event = { matches: match } as MediaQueryListEvent
            listeners['change']?.(event)
        },
    } as unknown as MediaQueryList
}

function createWrapperWith(composable: () => Ref<boolean>) {
    return defineComponent({
        setup() {
            const prefersReduced = composable()
            return { prefersReduced }
        },
        template: '<div>{{ prefersReduced }}</div>',
    })
}

describe('useReducedMotion', () => {
    let originalMatchMedia: typeof window.matchMedia

    beforeEach(() => {
        originalMatchMedia = window.matchMedia
        window.matchMedia = vi.fn() as unknown as typeof window.matchMedia
    })

    afterEach(() => {
        window.matchMedia = originalMatchMedia
        vi.restoreAllMocks()
    })

    it('returns true when prefers-reduced-motion is reduce', async () => {
        const mockQuery = createMockMediaQuery(true)
        vi.mocked(window.matchMedia).mockReturnValue(mockQuery)

        const wrapper = mount(createWrapperWith(useReducedMotion))
        await nextTick()

        expect(wrapper.vm.prefersReduced).toBe(true)
    })

    it('returns false when prefers-reduced-motion is no-preference', async () => {
        const mockQuery = createMockMediaQuery(false)
        vi.mocked(window.matchMedia).mockReturnValue(mockQuery)

        const wrapper = mount(createWrapperWith(useReducedMotion))
        await nextTick()

        expect(wrapper.vm.prefersReduced).toBe(false)
    })

    it('responds to media query changes', async () => {
        const mockQuery = createMockMediaQuery(false)
        vi.mocked(window.matchMedia).mockReturnValue(mockQuery)

        const wrapper = mount(createWrapperWith(useReducedMotion))
        await nextTick()

        expect((wrapper.vm as any).prefersReduced).toBe(false)

        // Simulate media query change
        ;(mockQuery as any)._trigger(true)
        await nextTick()

        expect(wrapper.vm.prefersReduced).toBe(true)
    })

    it('cleans up event listener on unmount', async () => {
        const mockQuery = createMockMediaQuery(false)
        vi.mocked(window.matchMedia).mockReturnValue(mockQuery)

        const wrapper = mount(createWrapperWith(useReducedMotion))
        await nextTick()

        wrapper.unmount()

        expect(mockQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    describe('SSR environment (isClient = false)', () => {
        beforeEach(() => {
            vi.resetModules()
            vi.doMock('../lib/env', () => ({
                isClient: false,
                hasDocument: false,
                hasLocalStorage: false,
            }))
            vi.mocked(window.matchMedia).mockReturnValue(createMockMediaQuery(false))
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('keeps prefersReduced as false and skips matchMedia', async () => {
            const { useReducedMotion: useReducedMotionSSR } = await import('./useReducedMotion')
            const wrapper = mount(createWrapperWith(useReducedMotionSSR))
            await nextTick()

            expect(wrapper.vm.prefersReduced).toBe(false)
            expect(window.matchMedia).not.toHaveBeenCalled()
        })

        it('does not throw on unmount when no mediaQuery was created', async () => {
            const { useReducedMotion: useReducedMotionSSR } = await import('./useReducedMotion')
            const wrapper = mount(createWrapperWith(useReducedMotionSSR))
            await nextTick()

            expect(() => wrapper.unmount()).not.toThrow()
        })
    })
})
