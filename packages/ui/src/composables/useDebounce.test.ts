import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebounce } from './useDebounce'

// 模拟 Vue 的 onUnmounted 生命周期
let unmountCallbacks: (() => void)[] = []

vi.mock('vue', async () => {
    const actual = await vi.importActual('vue')
    return {
        ...actual,
        onUnmounted: (cb: () => void) => {
            unmountCallbacks.push(cb)
        },
    }
})

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        unmountCallbacks = []
    })

    afterEach(() => {
        vi.useRealTimers()
        unmountCallbacks = []
    })

    describe('基础功能', () => {
        it('延迟执行函数', () => {
            const fn = vi.fn()
            const { debounced } = useDebounce(fn, 300)

            debounced('test')

            expect(fn).not.toHaveBeenCalled()

            vi.advanceTimersByTime(300)
            expect(fn).toHaveBeenCalledWith('test')
            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('在延迟时间内多次调用只执行最后一次', () => {
            const fn = vi.fn()
            const { debounced } = useDebounce(fn, 300)

            debounced('first')
            debounced('second')
            debounced('third')

            vi.advanceTimersByTime(300)

            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith('third')
        })

        it('延迟时间重置', () => {
            const fn = vi.fn()
            const { debounced } = useDebounce(fn, 300)

            debounced('first')
            vi.advanceTimersByTime(200)

            debounced('second')
            vi.advanceTimersByTime(200)

            // 还未到 300ms（从第二次调用算起），不应执行
            expect(fn).not.toHaveBeenCalled()

            vi.advanceTimersByTime(100)
            expect(fn).toHaveBeenCalledWith('second')
        })

        it('正确传递参数', () => {
            const fn = vi.fn()
            const { debounced } = useDebounce(fn, 100)

            debounced('a', 'b', 'c')
            vi.advanceTimersByTime(100)

            expect(fn).toHaveBeenCalledWith('a', 'b', 'c')
        })

        it('支持无参数调用', () => {
            const fn = vi.fn()
            const { debounced } = useDebounce(fn, 100)

            debounced()
            vi.advanceTimersByTime(100)

            expect(fn).toHaveBeenCalledTimes(1)
        })
    })

    describe('immediate 选项', () => {
        it('immediate 为 true 时首次调用立即执行', () => {
            const fn = vi.fn()
            const { debounced } = useDebounce(fn, 300, { immediate: true })

            debounced('test')

            expect(fn).toHaveBeenCalledWith('test')
            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('immediate 模式下后续调用在 delay 期间内不执行', () => {
            const fn = vi.fn()
            const { debounced } = useDebounce(fn, 300, { immediate: true })

            debounced('first')
            debounced('second')
            debounced('third')

            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith('first')
        })

        it('immediate 模式下 delay 后可再次执行', () => {
            const fn = vi.fn()
            const { debounced } = useDebounce(fn, 300, { immediate: true })

            debounced('first')
            expect(fn).toHaveBeenCalledTimes(1)

            vi.advanceTimersByTime(300)

            debounced('second')
            expect(fn).toHaveBeenCalledTimes(2)
            expect(fn).toHaveBeenCalledWith('second')
        })
    })

    describe('cancel 方法', () => {
        it('cancel 取消待执行的调用', () => {
            const fn = vi.fn()
            const { debounced, cancel } = useDebounce(fn, 300)

            debounced('test')
            cancel()

            vi.advanceTimersByTime(300)
            expect(fn).not.toHaveBeenCalled()
        })

        it('cancel 不影响已经执行的调用', () => {
            const fn = vi.fn()
            const { debounced, cancel } = useDebounce(fn, 300)

            debounced('test')
            vi.advanceTimersByTime(300)
            expect(fn).toHaveBeenCalledWith('test')

            cancel()
            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('多次 cancel 不会报错', () => {
            const fn = vi.fn()
            const { debounced, cancel } = useDebounce(fn, 300)

            debounced('test')
            cancel()
            cancel()
            cancel()

            vi.advanceTimersByTime(300)
            expect(fn).not.toHaveBeenCalled()
        })

        it('cancel 后可以重新调用', () => {
            const fn = vi.fn()
            const { debounced, cancel } = useDebounce(fn, 300)

            debounced('first')
            cancel()

            debounced('second')
            vi.advanceTimersByTime(300)

            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith('second')
        })
    })

    describe('flush 方法', () => {
        it('flush 立即执行待执行的调用', () => {
            const fn = vi.fn()
            const { debounced, flush } = useDebounce(fn, 300)

            debounced('test')
            flush()

            expect(fn).toHaveBeenCalledWith('test')
            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('flush 后超时不会再执行', () => {
            const fn = vi.fn()
            const { debounced, flush } = useDebounce(fn, 300)

            debounced('test')
            flush()

            vi.advanceTimersByTime(300)
            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('没有待执行调用时 flush 不会报错', () => {
            const fn = vi.fn()
            const { flush } = useDebounce(fn, 300)

            flush()
            expect(fn).not.toHaveBeenCalled()
        })

        it('flush 使用最后一次调用的参数', () => {
            const fn = vi.fn()
            const { debounced, flush } = useDebounce(fn, 300)

            debounced('first')
            debounced('second')
            debounced('third')

            flush()

            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith('third')
        })
    })

    describe('自动清理', () => {
        it('组件卸载时自动取消待执行的调用', () => {
            const fn = vi.fn()
            const { debounced } = useDebounce(fn, 300)

            debounced('test')

            // 模拟组件卸载
            unmountCallbacks.forEach(cb => cb())

            vi.advanceTimersByTime(300)
            expect(fn).not.toHaveBeenCalled()
        })

        it('组件卸载时没有待执行调用不会报错', () => {
            const fn = vi.fn()
            useDebounce(fn, 300)

            // 直接卸载，没有调用过 debounced
            expect(() => {
                unmountCallbacks.forEach(cb => cb())
            }).not.toThrow()
        })
    })

    describe('边界情况', () => {
        it('delay 为 0 时立即执行', () => {
            const fn = vi.fn()
            const { debounced } = useDebounce(fn, 0)

            debounced('test')
            vi.advanceTimersByTime(0)

            expect(fn).toHaveBeenCalledWith('test')
        })

        it('大量连续调用不会导致内存泄漏', () => {
            const fn = vi.fn()
            const { debounced } = useDebounce(fn, 100)

            for (let i = 0; i < 1000; i++) {
                debounced(`call-${i}`)
            }

            vi.advanceTimersByTime(100)
            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith('call-999')
        })
    })
})
