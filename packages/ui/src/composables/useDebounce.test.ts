import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebounce } from './useDebounce'

// 模拟 Vue 的 onUnmounted 生命周期与组件实例状态：
// useDebounce 仅在存在活动组件实例（getCurrentInstance 非空）时注册卸载清理，
// 测试通过 hasActiveInstance 开关控制两条路径
let unmountCallbacks: (() => void)[] = []
let hasActiveInstance = true

vi.mock('vue', async () => {
    const actual = await vi.importActual('vue')
    return {
        ...actual,
        getCurrentInstance: () => (hasActiveInstance ? {} : null),
        onUnmounted: (cb: () => void) => {
            unmountCallbacks.push(cb)
        },
    }
})

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        unmountCallbacks = []
        hasActiveInstance = true
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

        it('非组件上下文不注册 onUnmounted 清理（由调用方显式 cancel）', () => {
            hasActiveInstance = false
            const fn = vi.fn()
            useDebounce(fn, 300)

            expect(unmountCallbacks).toHaveLength(0)
        })
    })

    describe('异常处理', () => {
        it('immediate 模式首次调用抛错后状态复位，重试可立即执行', () => {
            const fn = vi.fn()
            fn.mockImplementationOnce(() => {
                throw new Error('boom')
            })
            const { debounced, flush } = useDebounce(fn, 300, { immediate: true })

            expect(() => debounced('first')).toThrow('boom')
            // 抛错后 lastArgs 已复位，flush 不应重复执行已失败且未调度的调用
            flush()
            expect(fn).toHaveBeenCalledTimes(1)
            // timeoutId 未被污染（抛错时不调度定时器），重试仍走立即执行分支
            debounced('retry')
            expect(fn).toHaveBeenCalledTimes(2)
            expect(fn).toHaveBeenLastCalledWith('retry')
        })

        it('trailing 回调抛错后状态复位，后续 flush 不重复执行', () => {
            const fn = vi.fn()
            fn.mockImplementationOnce(() => {
                throw new Error('boom')
            })
            const { debounced, flush } = useDebounce(fn, 300)

            debounced('first')
            // trailing 回调抛错（异常向上传播），但 timeoutId/lastArgs 由 finally 复位
            expect(() => vi.advanceTimersByTime(300)).toThrow('boom')
            flush()
            expect(fn).toHaveBeenCalledTimes(1)

            // 状态复位后可以正常继续防抖
            debounced('second')
            vi.advanceTimersByTime(300)
            expect(fn).toHaveBeenCalledTimes(2)
            expect(fn).toHaveBeenLastCalledWith('second')
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
