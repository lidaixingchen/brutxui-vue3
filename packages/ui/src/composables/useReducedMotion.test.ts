/**
 * L1 单元测试：useReducedMotion composable 的 JS 响应式逻辑。
 *
 * 范围（L1，happy-dom + vi.mock）：
 * - ref 初始值与 mount 后的 matchMedia.matches 同步
 * - change 事件触发后 ref 响应式更新
 * - unmount 时 removeEventListener 清理
 * - SSR（isClient=false）下跳过 matchMedia 调用
 *
 * 不在 L1 覆盖的范围（属于 L2 browser mode，见 ARCHITECTURE_OPTIMIZATION_PLAN.md §5）：
 * - CSS 媒体查询驱动的样式计算（如 getComputedStyle().animationName）
 * - emulateMedia 真实触发 prefers-reduced-motion 对渲染的影响
 *
 * 禁止在此文件中添加 getComputedStyle / CSS 属性断言——happy-dom 无真实 CSS 引擎，
 * mock window.matchMedia 不影响 CSS 媒体查询。此类断言属于 L2（P2 实现）。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, type Ref } from 'vue'

import { useReducedMotion } from './useReducedMotion'

interface MockMediaQueryList extends MediaQueryList {
    _trigger: (match: boolean) => void
}

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
    } as unknown as MockMediaQueryList
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

        expect(wrapper.vm.prefersReduced).toBe(false)

        // Simulate media query change
        mockQuery._trigger(true)
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
