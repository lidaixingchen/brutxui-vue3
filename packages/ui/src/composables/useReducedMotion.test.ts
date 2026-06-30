import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
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

function createWrapper() {
    return defineComponent({
        setup() {
            const prefersReduced = useReducedMotion()
            return { prefersReduced }
        },
        template: '<div>{{ prefersReduced }}</div>',
    })
}

describe('useReducedMotion', () => {
    beforeEach(() => {
        vi.stubGlobal('window', {
            matchMedia: vi.fn(),
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns true when prefers-reduced-motion is reduce', async () => {
        const mockQuery = createMockMediaQuery(true)
        vi.mocked(window.matchMedia).mockReturnValue(mockQuery)

        const wrapper = mount(createWrapper())
        await nextTick()

        expect(wrapper.vm.prefersReduced).toBe(true)
    })

    it('returns false when prefers-reduced-motion is no-preference', async () => {
        const mockQuery = createMockMediaQuery(false)
        vi.mocked(window.matchMedia).mockReturnValue(mockQuery)

        const wrapper = mount(createWrapper())
        await nextTick()

        expect(wrapper.vm.prefersReduced).toBe(false)
    })

    it('responds to media query changes', async () => {
        const mockQuery = createMockMediaQuery(false)
        vi.mocked(window.matchMedia).mockReturnValue(mockQuery)

        const wrapper = mount(createWrapper())
        await nextTick()

        expect(wrapper.vm.prefersReduced).toBe(false)

        // Simulate media query change
        mockQuery._trigger(true)
        await nextTick()

        expect(wrapper.vm.prefersReduced).toBe(true)
    })

    it('cleans up event listener on unmount', async () => {
        const mockQuery = createMockMediaQuery(false)
        vi.mocked(window.matchMedia).mockReturnValue(mockQuery)

        const wrapper = mount(createWrapper())
        await nextTick()

        wrapper.unmount()

        expect(mockQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
})
