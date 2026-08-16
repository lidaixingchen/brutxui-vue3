import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import InfiniteScroll from './InfiniteScroll.vue'

// vi.hoisted 确保 mock 变量在 vi.mock() 工厂执行前初始化
const mocks = vi.hoisted(() => {
    class MockIntersectionObserver {
        static instances: MockIntersectionObserver[] = []
        callback: IntersectionObserverCallback
        observe: ReturnType<typeof vi.fn>
        unobserve: ReturnType<typeof vi.fn>
        disconnect: ReturnType<typeof vi.fn>
        private targets = new Set<Element>()

        constructor(callback: IntersectionObserverCallback) {
            this.callback = callback
            this.observe = vi.fn((target: Element) => {
                this.targets.add(target)
                // 模拟 observer 的初始回调：observe() 异步排队一次携带当前相交状态的回调
                queueMicrotask(() => {
                    if (!this.targets.has(target)) return
                    this.callback(
                        [{ isIntersecting: true, target }] as IntersectionObserverEntry[],
                        this as unknown as IntersectionObserver,
                    )
                })
            })
            this.unobserve = vi.fn((target: Element) => this.targets.delete(target))
            this.disconnect = vi.fn(() => this.targets.clear())
            MockIntersectionObserver.instances.push(this)
        }
    }
    return { MockIntersectionObserver }
})

// happy-dom 不实现 IntersectionObserver，组件经 @/lib/env 的
// hasIntersectionObserver / getIntersectionObserverCtor 探测能力，
// 这里替换为「始终可用」并模拟 observe 即异步回调一次当前相交状态。
vi.mock('@/lib/env', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/env')>()
    return {
        ...actual,
        hasIntersectionObserver: true,
        getIntersectionObserverCtor: () => mocks.MockIntersectionObserver,
    }
})

const DEFAULT_DELAY = 200

interface InfiniteScrollExposed {
    resetLoading: () => void
}

function assertInfiniteScrollExposed(vm: unknown): asserts vm is InfiniteScrollExposed {
    expect(vm).toHaveProperty('resetLoading')
}

function mountComponent(props: Record<string, unknown> = {}) {
    return mount(InfiniteScroll, { props })
}

// 推进一个防抖周期：先放行微任务让 observer 初始回调执行（重新调度加载定时器），
// 再推进 delay 毫秒使定时器触发 emit('load')。
async function advanceOneLoadCycle() {
    // advanceTimersByTimeAsync 会在推进时钟时处理期间排队的微任务
    await vi.advanceTimersByTimeAsync(DEFAULT_DELAY)
}

describe('InfiniteScroll', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        mocks.MockIntersectionObserver.instances.length = 0
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('哨兵保持 intersecting 时调用 resetLoading 会重新触发 load', async () => {
        const wrapper = mountComponent()
        assertInfiniteScrollExposed(wrapper.vm)

        // 初次 mount（immediate=true）触发一次 load
        await advanceOneLoadCycle()
        expect(wrapper.emitted('load')).toHaveLength(1)

        // 哨兵仍 intersecting：resetLoading 通过「解除并重新观察」重新触发 load
        wrapper.vm.resetLoading()
        await advanceOneLoadCycle()
        expect(wrapper.emitted('load')).toHaveLength(2)
    })

    it('disabled 恢复后 isLoading 被复位，组件能继续加载', async () => {
        const wrapper = mountComponent({ disabled: true })
        assertInfiniteScrollExposed(wrapper.vm)

        // 初始为禁用：不 setupObserver，不触发 load
        await advanceOneLoadCycle()
        expect(wrapper.emitted('load')).toBeUndefined()

        // 恢复启用：watch 复位 isLoading 并重建 observer，随后触发 load
        await wrapper.setProps({ disabled: false })
        await advanceOneLoadCycle()
        expect(wrapper.emitted('load')).toHaveLength(1)
    })

    it('重复 resetLoading 不会叠加重复 load（防抖）', async () => {
        const wrapper = mountComponent()
        assertInfiniteScrollExposed(wrapper.vm)

        await advanceOneLoadCycle()
        expect(wrapper.emitted('load')).toHaveLength(1)

        // 连续两次 resetLoading：triggerLoad 的 loadTimer 防抖将其合并为一次
        wrapper.vm.resetLoading()
        wrapper.vm.resetLoading()
        await advanceOneLoadCycle()
        expect(wrapper.emitted('load')).toHaveLength(2)
    })

    it('distance 变化时重建 observer 应用新阈值', async () => {
        const wrapper = mountComponent()
        await advanceOneLoadCycle()
        const initialInstances = mocks.MockIntersectionObserver.instances.length

        await wrapper.setProps({ distance: 200 })
        await advanceOneLoadCycle()

        expect(mocks.MockIntersectionObserver.instances.length).toBe(initialInstances + 1)
    })
})
