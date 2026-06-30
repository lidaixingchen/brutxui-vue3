import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useEventListener } from './useEventListener'

describe('useEventListener', () => {
    let addSpy: ReturnType<typeof vi.spyOn>
    let removeSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        addSpy = vi.spyOn(window, 'addEventListener')
        removeSpy = vi.spyOn(window, 'removeEventListener')
    })

    afterEach(() => {
        addSpy.mockRestore()
        removeSpy.mockRestore()
    })

    it('应该在组件挂载时添加事件监听器', async () => {
        const handler = vi.fn()

        const wrapper = mount(
            defineComponent({
                setup() {
                    useEventListener(window, 'click', handler)
                    return () => h('div')
                },
            }),
        )

        await nextTick()
        expect(addSpy).toHaveBeenCalledWith('click', handler, undefined)

        wrapper.unmount()
    })

    it('应该在组件卸载时移除事件监听器', async () => {
        const handler = vi.fn()

        const wrapper = mount(
            defineComponent({
                setup() {
                    useEventListener(window, 'click', handler)
                    return () => h('div')
                },
            }),
        )

        await nextTick()
        expect(addSpy).toHaveBeenCalled()

        wrapper.unmount()
        expect(removeSpy).toHaveBeenCalledWith('click', handler, undefined)
    })

    it('应该支持 Ref 目标', async () => {
        const handler = vi.fn()
        const target = ref<EventTarget | null>(null)
        const addEventListenerSpy = vi.fn()
        const removeEventListenerSpy = vi.fn()

        const mockTarget: EventTarget = {
            addEventListener: addEventListenerSpy,
            removeEventListener: removeEventListenerSpy,
            dispatchEvent: vi.fn(),
        }

        const wrapper = mount(
            defineComponent({
                setup() {
                    useEventListener(target, 'click', handler)
                    return () => h('div')
                },
            }),
        )

        await nextTick()
        // 初始时 target.value 为 null，不应添加监听器
        expect(addEventListenerSpy).not.toHaveBeenCalled()

        // 设置 target
        target.value = mockTarget
        await nextTick()

        expect(addEventListenerSpy).toHaveBeenCalledWith('click', handler, undefined)

        wrapper.unmount()
        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', handler, undefined)
    })

    it('应该在 Ref 目标变化时正确切换监听器', async () => {
        const handler = vi.fn()
        const target = ref<EventTarget | null>(null)

        const addEventListenerSpy1 = vi.fn()
        const removeEventListenerSpy1 = vi.fn()
        const mockTarget1: EventTarget = {
            addEventListener: addEventListenerSpy1,
            removeEventListener: removeEventListenerSpy1,
            dispatchEvent: vi.fn(),
        }

        const addEventListenerSpy2 = vi.fn()
        const removeEventListenerSpy2 = vi.fn()
        const mockTarget2: EventTarget = {
            addEventListener: addEventListenerSpy2,
            removeEventListener: removeEventListenerSpy2,
            dispatchEvent: vi.fn(),
        }

        const wrapper = mount(
            defineComponent({
                setup() {
                    useEventListener(target, 'click', handler)
                    return () => h('div')
                },
            }),
        )

        // 设置第一个目标
        target.value = mockTarget1
        await nextTick()
        expect(addEventListenerSpy1).toHaveBeenCalledWith('click', handler, undefined)

        // 切换到第二个目标
        target.value = mockTarget2
        await nextTick()
        expect(removeEventListenerSpy1).toHaveBeenCalledWith('click', handler, undefined)
        expect(addEventListenerSpy2).toHaveBeenCalledWith('click', handler, undefined)

        wrapper.unmount()
        expect(removeEventListenerSpy2).toHaveBeenCalledWith('click', handler, undefined)
    })

    it('应该支持 addEventListener 选项', async () => {
        const handler = vi.fn()
        const options: AddEventListenerOptions = { once: true, capture: true }

        const wrapper = mount(
            defineComponent({
                setup() {
                    useEventListener(window, 'click', handler, options)
                    return () => h('div')
                },
            }),
        )

        await nextTick()
        expect(addSpy).toHaveBeenCalledWith('click', handler, options)

        wrapper.unmount()
        expect(removeSpy).toHaveBeenCalledWith('click', handler, options)
    })

    it('应该支持布尔类型的 capture 选项', async () => {
        const handler = vi.fn()

        const wrapper = mount(
            defineComponent({
                setup() {
                    useEventListener(window, 'click', handler, true)
                    return () => h('div')
                },
            }),
        )

        await nextTick()
        expect(addSpy).toHaveBeenCalledWith('click', handler, true)

        wrapper.unmount()
        expect(removeSpy).toHaveBeenCalledWith('click', handler, true)
    })

    it('应该支持 Document 目标', async () => {
        const handler = vi.fn()
        const docAddSpy = vi.spyOn(document, 'addEventListener')
        const docRemoveSpy = vi.spyOn(document, 'removeEventListener')

        const wrapper = mount(
            defineComponent({
                setup() {
                    useEventListener(document, 'scroll', handler)
                    return () => h('div')
                },
            }),
        )

        await nextTick()
        expect(docAddSpy).toHaveBeenCalledWith('scroll', handler, undefined)

        wrapper.unmount()
        expect(docRemoveSpy).toHaveBeenCalledWith('scroll', handler, undefined)
    })

    it('应该支持 HTMLElement 目标', async () => {
        const handler = vi.fn()
        const element = document.createElement('div')
        const addEventListenerSpy = vi.spyOn(element, 'addEventListener')
        const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener')

        const wrapper = mount(
            defineComponent({
                setup() {
                    useEventListener(element, 'click', handler)
                    return () => h('div')
                },
            }),
        )

        await nextTick()
        expect(addEventListenerSpy).toHaveBeenCalledWith('click', handler, undefined)

        wrapper.unmount()
        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', handler, undefined)
    })

    it('应该支持 immediate: false 选项', async () => {
        const handler = vi.fn()

        const wrapper = mount(
            defineComponent({
                setup() {
                    useEventListener(window, 'click', handler, undefined, { immediate: false })
                    return () => h('div')
                },
            }),
        )

        // immediate: false 时不使用 onMounted，但 composable 会立即调用 add()
        await nextTick()
        expect(addSpy).toHaveBeenCalledWith('click', handler, undefined)

        wrapper.unmount()
        expect(removeSpy).toHaveBeenCalledWith('click', handler, undefined)
    })

    it('应该在多次调用时正确清理', async () => {
        const handler1 = vi.fn()
        const handler2 = vi.fn()

        const wrapper = mount(
            defineComponent({
                setup() {
                    useEventListener(window, 'click', handler1)
                    useEventListener(window, 'scroll', handler2)
                    return () => h('div')
                },
            }),
        )

        await nextTick()
        expect(addSpy).toHaveBeenCalledTimes(2)

        wrapper.unmount()
        expect(removeSpy).toHaveBeenCalledTimes(2)
    })

    it('应该处理 null 目标的情况', async () => {
        const handler = vi.fn()
        const target = ref<EventTarget | null>(null)

        const wrapper = mount(
            defineComponent({
                setup() {
                    useEventListener(target, 'click', handler)
                    return () => h('div')
                },
            }),
        )

        await nextTick()
        // target 为 null 时不应添加监听器
        expect(addSpy).not.toHaveBeenCalled()

        wrapper.unmount()
        // 也不应抛出错误
        expect(removeSpy).not.toHaveBeenCalled()
    })

    it('应该在事件触发时调用处理函数', async () => {
        const handler = vi.fn()

        mount(
            defineComponent({
                setup() {
                    useEventListener(window, 'click', handler)
                    return () => h('div')
                },
            }),
        )

        // 模拟事件触发
        window.dispatchEvent(new Event('click'))
        expect(handler).toHaveBeenCalledTimes(1)

        window.dispatchEvent(new Event('click'))
        expect(handler).toHaveBeenCalledTimes(2)
    })
})
