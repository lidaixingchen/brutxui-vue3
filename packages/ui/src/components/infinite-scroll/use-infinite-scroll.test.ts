import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInfiniteScroll, type UseInfiniteScrollOptions } from './useInfiniteScroll'

const TEST_DELAY_MS = 200
const ADVANCE_STEP_MS = 50

const mocks = vi.hoisted(() => {
    class MockIntersectionObserver {
        static instances: MockIntersectionObserver[] = []
        static defaultIntersecting = true
        callback: IntersectionObserverCallback
        observe: ReturnType<typeof vi.fn>
        unobserve: ReturnType<typeof vi.fn>
        disconnect: ReturnType<typeof vi.fn>
        private targets = new Set<Element>()

        constructor(callback: IntersectionObserverCallback) {
            this.callback = callback
            this.observe = vi.fn((target: Element) => {
                this.targets.add(target)
                queueMicrotask(() => {
                    if (!this.targets.has(target)) return
                    this.callback(
                        [{ isIntersecting: MockIntersectionObserver.defaultIntersecting, target }] as IntersectionObserverEntry[],
                        this as unknown as IntersectionObserver,
                    )
                })
            })
            this.unobserve = vi.fn((target: Element) => this.targets.delete(target))
            this.disconnect = vi.fn(() => this.targets.clear())
            MockIntersectionObserver.instances.push(this)
        }

        triggerIntersect(target: Element, isIntersecting: boolean) {
            if (!this.targets.has(target)) return
            this.callback(
                [{ isIntersecting, target }] as IntersectionObserverEntry[],
                this as unknown as IntersectionObserver,
            )
        }
    }
    return {
        MockIntersectionObserver,
        mockHasIntersectionObserver: { value: true },
    }
})

vi.mock('@/lib/env', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/env')>()
    return {
        ...actual,
        get hasIntersectionObserver() {
            return mocks.mockHasIntersectionObserver.value
        },
        getIntersectionObserverCtor: () => mocks.MockIntersectionObserver,
    }
})

function createTestHarness(options: UseInfiniteScrollOptions) {
    let hookResult: ReturnType<typeof useInfiniteScroll> | undefined

    const TestComponent = defineComponent({
        setup() {
            const target = ref<HTMLElement | null>(null)
            hookResult = useInfiniteScroll(target, options)
            return () => h('div', { ref: target, id: 'scroll-target' })
        },
    })

    const wrapper = mount(TestComponent, { attachTo: document.body })
    return { wrapper, getHook: () => hookResult! }
}

async function advanceOneDelay() {
    await vi.advanceTimersByTimeAsync(TEST_DELAY_MS + ADVANCE_STEP_MS)
}

describe('useInfiniteScroll', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        mocks.MockIntersectionObserver.instances.length = 0
        mocks.MockIntersectionObserver.defaultIntersecting = true
        mocks.mockHasIntersectionObserver.value = true
    })

    afterEach(() => {
        vi.useRealTimers()
        document.body.innerHTML = ''
    })

    it('immediate=true 挂载时触发初次加载', async () => {
        const onLoad = vi.fn()
        createTestHarness({ onLoad, delay: TEST_DELAY_MS })

        await advanceOneDelay()
        expect(onLoad).toHaveBeenCalledTimes(1)
    })

    it('immediate=false 初始目标未入视口时挂载不触发加载', async () => {
        mocks.MockIntersectionObserver.defaultIntersecting = false
        const onLoad = vi.fn()
        createTestHarness({ onLoad, immediate: false, delay: TEST_DELAY_MS })

        await advanceOneDelay()
        expect(onLoad).not.toHaveBeenCalled()
    })

    it('无 IntersectionObserver 降级环境下，immediate=false 挂载不加载，但 resetLoading 主动触发加载', async () => {
        mocks.mockHasIntersectionObserver.value = false
        const onLoad = vi.fn()
        const { getHook } = createTestHarness({
            onLoad,
            immediate: false,
            delay: TEST_DELAY_MS,
        })

        // 挂载时不触发
        await advanceOneDelay()
        expect(onLoad).not.toHaveBeenCalled()

        // 业务主动复位：应无条件保守触发一次加载
        getHook().resetLoading()
        await advanceOneDelay()
        expect(onLoad).toHaveBeenCalledTimes(1)
    })

    it('disabled=true 时 resetLoading 不会触发加载', async () => {
        mocks.mockHasIntersectionObserver.value = false
        const onLoad = vi.fn()
        const { getHook } = createTestHarness({
            onLoad,
            disabled: true,
            delay: TEST_DELAY_MS,
        })

        getHook().resetLoading()
        await advanceOneDelay()
        expect(onLoad).not.toHaveBeenCalled()
    })

    it('onLoad 抛错后能够正常复位，后续 resetLoading 仍能继续触发', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        let failCount = 1
        const onLoad = vi.fn(async () => {
            if (failCount > 0) {
                failCount--
                throw new Error('网络异常')
            }
        })

        const { getHook } = createTestHarness({
            onLoad,
            delay: TEST_DELAY_MS,
        })

        // 首次加载（挂载触发）抛错
        await advanceOneDelay()
        expect(onLoad).toHaveBeenCalledTimes(1)
        expect(consoleErrorSpy).toHaveBeenCalled()

        // 主动复位并重试
        getHook().resetLoading()
        await advanceOneDelay()
        expect(onLoad).toHaveBeenCalledTimes(2)

        consoleErrorSpy.mockRestore()
    })
})
