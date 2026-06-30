import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useThrottle } from './useThrottle'

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

describe('useThrottle', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        unmountCallbacks = []
    })

    afterEach(() => {
        vi.useRealTimers()
        unmountCallbacks = []
    })

    describe('基础功能', () => {
        it('首次调用立即执行（leading 默认为 true）', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300)

            throttled('test')

            expect(fn).toHaveBeenCalledWith('test')
            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('在节流间隔内多次调用只执行一次', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300)

            throttled('first')
            throttled('second')
            throttled('third')

            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith('first')
        })

        it('间隔结束后尾部调用执行', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300)

            throttled('first')
            throttled('second')

            vi.advanceTimersByTime(300)

            expect(fn).toHaveBeenCalledTimes(2)
            expect(fn).toHaveBeenLastCalledWith('second')
        })

        it('正确传递参数', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300)

            throttled('a', 'b', 'c')

            expect(fn).toHaveBeenCalledWith('a', 'b', 'c')
        })

        it('支持无参数调用', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300)

            throttled()

            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('连续调用时保持节流间隔', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300)

            // 第一次立即执行
            throttled('first')
            expect(fn).toHaveBeenCalledTimes(1)

            // 100ms 后调用
            vi.advanceTimersByTime(100)
            throttled('second')

            // 200ms 后（从第一次调用算起共 300ms），尾部调用执行
            vi.advanceTimersByTime(200)
            expect(fn).toHaveBeenCalledTimes(2)
            expect(fn).toHaveBeenLastCalledWith('second')

            // 再过 300ms，可以再次执行
            vi.advanceTimersByTime(300)
            throttled('third')
            expect(fn).toHaveBeenCalledTimes(3)
            expect(fn).toHaveBeenLastCalledWith('third')
        })
    })

    describe('leading 选项', () => {
        it('leading 为 false 时首次调用不立即执行', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300, { leading: false })

            throttled('test')

            expect(fn).not.toHaveBeenCalled()
        })

        it('leading 为 false 时在间隔后执行', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300, { leading: false })

            throttled('test')

            vi.advanceTimersByTime(300)

            expect(fn).toHaveBeenCalledWith('test')
            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('leading 为 false 且 trailing 为 false 时不执行', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300, { leading: false, trailing: false })

            throttled('test')
            vi.advanceTimersByTime(300)

            expect(fn).not.toHaveBeenCalled()
        })
    })

    describe('trailing 选项', () => {
        it('trailing 为 false 时不执行尾部调用', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300, { trailing: false })

            throttled('first')
            throttled('second')

            vi.advanceTimersByTime(300)

            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith('first')
        })

        it('trailing 为 false 时可正常执行 leading 调用', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300, { trailing: false })

            throttled('first')
            vi.advanceTimersByTime(300)
            throttled('second')

            expect(fn).toHaveBeenCalledTimes(2)
            expect(fn).toHaveBeenLastCalledWith('second')
        })
    })

    describe('cancel 方法', () => {
        it('cancel 取消待执行的尾部调用', () => {
            const fn = vi.fn()
            const { throttled, cancel } = useThrottle(fn, 300)

            throttled('first')
            throttled('second')
            cancel()

            vi.advanceTimersByTime(300)

            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith('first')
        })

        it('cancel 后可以重新调用', () => {
            const fn = vi.fn()
            const { throttled, cancel } = useThrottle(fn, 300)

            throttled('first')
            cancel()

            throttled('second')
            expect(fn).toHaveBeenCalledTimes(2)
            expect(fn).toHaveBeenLastCalledWith('second')
        })

        it('多次 cancel 不会报错', () => {
            const fn = vi.fn()
            const { throttled, cancel } = useThrottle(fn, 300)

            throttled('test')
            cancel()
            cancel()
            cancel()

            expect(fn).toHaveBeenCalledTimes(1)
        })
    })

    describe('flush 方法', () => {
        it('flush 立即执行待执行的尾部调用', () => {
            const fn = vi.fn()
            const { throttled, flush } = useThrottle(fn, 300)

            throttled('first')
            throttled('second')

            flush()

            expect(fn).toHaveBeenCalledTimes(2)
            expect(fn).toHaveBeenLastCalledWith('second')
        })

        it('flush 后超时不会再执行', () => {
            const fn = vi.fn()
            const { throttled, flush } = useThrottle(fn, 300)

            throttled('first')
            throttled('second')

            flush()

            vi.advanceTimersByTime(300)
            expect(fn).toHaveBeenCalledTimes(2)
        })

        it('没有待执行调用时 flush 不会报错', () => {
            const fn = vi.fn()
            const { flush } = useThrottle(fn, 300)

            flush()
            expect(fn).not.toHaveBeenCalled()
        })
    })

    describe('自动清理', () => {
        it('组件卸载时自动取消待执行的尾部调用', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300)

            throttled('first')
            throttled('second')

            // 模拟组件卸载
            unmountCallbacks.forEach(cb => cb())

            vi.advanceTimersByTime(300)
            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('组件卸载时没有待执行调用不会报错', () => {
            const fn = vi.fn()
            useThrottle(fn, 300)

            expect(() => {
                unmountCallbacks.forEach(cb => cb())
            }).not.toThrow()
        })
    })

    describe('边界情况', () => {
        it('delay 为 0 时每次调用都执行', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 0)

            throttled('first')
            vi.advanceTimersByTime(0)
            throttled('second')
            vi.advanceTimersByTime(0)
            throttled('third')

            expect(fn).toHaveBeenCalledTimes(3)
        })

        it('大量调用时性能稳定', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 100)

            for (let i = 0; i < 1000; i++) {
                throttled(`call-${i}`)
            }

            // leading 执行一次，后续调用被节流
            expect(fn).toHaveBeenCalledTimes(1)
            expect(fn).toHaveBeenCalledWith('call-0')
        })

        it('长间隔后重新计算', () => {
            const fn = vi.fn()
            const { throttled } = useThrottle(fn, 300)

            throttled('first')
            expect(fn).toHaveBeenCalledTimes(1)

            // 长时间后再次调用
            vi.advanceTimersByTime(1000)
            throttled('second')
            expect(fn).toHaveBeenCalledTimes(2)
            expect(fn).toHaveBeenLastCalledWith('second')
        })
    })
})
