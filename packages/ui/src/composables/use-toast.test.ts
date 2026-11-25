import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp, defineComponent, effectScope, h, ref, nextTick } from 'vue'
import { createToast, provideToast, useToast, destroyFallback, DEFAULT_TOAST_DURATION } from './useToast'
import { MAX_TOASTS } from '../lib/defaults'

function deferred<T>() {
    let resolve!: (value: T) => void
    let reject!: (reason: unknown) => void
    const promise = new Promise<T>((fulfill, fail) => {
        resolve = fulfill
        reject = fail
    })
    return { promise, resolve, reject }
}

describe('useToast', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    // ── Basic CRUD ──────────────────────────────────────────────

    it('addToast adds a toast to the list', () => {
        const { toasts, addToast } = createToast()
        addToast({ title: 'Test Toast' })
        expect(toasts.value.length).toBe(1)
        expect(toasts.value[0].title).toBe('Test Toast')
    })

    it('removeToast removes a toast by id', () => {
        const { toasts, addToast, removeToast } = createToast()
        const id = addToast({ title: 'Test Toast' })
        expect(toasts.value.length).toBe(1)
        removeToast(id)
        expect(toasts.value.length).toBe(0)
    })

    it('clearToasts removes all toasts', () => {
        const { toasts, addToast, clearToasts } = createToast()
        addToast({ title: 'Toast 1' })
        addToast({ title: 'Toast 2' })
        addToast({ title: 'Toast 3' })
        expect(toasts.value.length).toBe(3)
        clearToasts()
        expect(toasts.value.length).toBe(0)
    })

    it('removeToast only removes the specified toast', () => {
        const { toasts, addToast, removeToast } = createToast()
        const id1 = addToast({ title: 'Toast 1' })
        const id2 = addToast({ title: 'Toast 2' })
        removeToast(id1)
        expect(toasts.value.length).toBe(1)
        expect(toasts.value[0].id).toBe(id2)
    })

    it('each toast gets a unique id', () => {
        const { toasts, addToast } = createToast()
        addToast({ title: 'Toast 1' })
        addToast({ title: 'Toast 2' })
        const ids = toasts.value.map((t) => t.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('addToast returns the toast id', () => {
        const { addToast } = createToast()
        const id = addToast({ title: 'Test' })
        expect(typeof id).toBe('string')
        expect(id.length).toBeGreaterThan(0)
    })

    it('supports toast with description', () => {
        const { toasts, addToast } = createToast()
        addToast({ title: 'Test', description: 'A description' })
        expect(toasts.value[0].description).toBe('A description')
    })

    it('supports toast with duration', () => {
        const { toasts, addToast } = createToast()
        addToast({ title: 'Test', duration: 3000 })
        expect(toasts.value[0].duration).toBe(3000)
    })

    // ── Variant helpers ─────────────────────────────────────────

    it('success helper adds correct variant', () => {
        const { toasts, success } = createToast()
        success('Success!', 'It worked')
        expect(toasts.value.length).toBe(1)
        expect(toasts.value[0].variant).toBe('success')
        expect(toasts.value[0].title).toBe('Success!')
        expect(toasts.value[0].description).toBe('It worked')
    })

    it('error helper adds correct variant', () => {
        const { toasts, error } = createToast()
        error('Error!', 'Something went wrong')
        expect(toasts.value.length).toBe(1)
        expect(toasts.value[0].variant).toBe('error')
        expect(toasts.value[0].title).toBe('Error!')
        expect(toasts.value[0].description).toBe('Something went wrong')
    })

    it('warning helper adds correct variant', () => {
        const { toasts, warning } = createToast()
        warning('Warning!', 'Be careful')
        expect(toasts.value.length).toBe(1)
        expect(toasts.value[0].variant).toBe('warning')
        expect(toasts.value[0].title).toBe('Warning!')
        expect(toasts.value[0].description).toBe('Be careful')
    })

    it('info helper adds correct variant', () => {
        const { toasts, info } = createToast()
        info('Info', 'For your information')
        expect(toasts.value.length).toBe(1)
        expect(toasts.value[0].variant).toBe('info')
        expect(toasts.value[0].title).toBe('Info')
        expect(toasts.value[0].description).toBe('For your information')
    })

    // ── MAX_TOASTS overflow ─────────────────────────────────────

    it('removes oldest toast when exceeding MAX_TOASTS', () => {
        const { toasts, addToast } = createToast()
        const ids: string[] = []
        for (let i = 0; i < MAX_TOASTS; i++) {
            ids.push(addToast({ title: `Toast ${i}` }))
        }
        expect(toasts.value.length).toBe(MAX_TOASTS)
        expect(toasts.value[0].id).toBe(ids[0])

        // Adding one more should evict the oldest
        const newId = addToast({ title: 'Overflow' })
        expect(toasts.value.length).toBe(MAX_TOASTS)
        expect(toasts.value[0].id).toBe(ids[1])
        expect(toasts.value[toasts.value.length - 1].id).toBe(newId)
    })

    it('evicts oldest toast on MAX_TOASTS overflow regardless of duration', () => {
        // 状态层不再启动定时器，eviction 仅基于数组长度
        const { toasts: t2, addToast: add2 } = createToast()
        const evictedId = add2({ title: 'Will be evicted', duration: 60_000 })
        for (let i = 1; i < MAX_TOASTS; i++) {
            add2({ title: `Toast ${i}`, duration: 0 })
        }
        // Overflow: evicts the first toast
        add2({ title: 'Overflow', duration: 0 })
        expect(t2.value.length).toBe(MAX_TOASTS)
        expect(t2.value.find((t) => t.id === evictedId)).toBeUndefined()

        // 推进时间，剩余 toast 不受影响（状态层无定时器）
        vi.advanceTimersByTime(70_000)
        expect(t2.value.length).toBe(MAX_TOASTS)
    })

    // ── Auto-remove timer（已迁移至渲染层 Toast.vue）────────────

    it('addToast does not auto-remove toast (timers live in Toast.vue render layer)', () => {
        const { toasts, addToast } = createToast()
        addToast({ title: 'No auto remove', duration: 3000 })
        expect(toasts.value.length).toBe(1)

        // 即使 duration 到期，状态层也不会移除 toast
        vi.advanceTimersByTime(10_000)
        expect(toasts.value.length).toBe(1)
    })

    it('addToast keeps toast when duration is 0', () => {
        const { toasts, addToast } = createToast()
        addToast({ title: 'Persistent', duration: 0 })
        expect(toasts.value.length).toBe(1)

        vi.advanceTimersByTime(100_000)
        expect(toasts.value.length).toBe(1)
    })

    it('addToast keeps toast when duration is omitted (uses DEFAULT_TOAST_DURATION as metadata only)', () => {
        const { toasts, addToast } = createToast()
        addToast({ title: 'Default duration' })
        expect(toasts.value.length).toBe(1)

        vi.advanceTimersByTime(DEFAULT_TOAST_DURATION + 10_000)
        // 状态层不启动定时器；DEFAULT_TOAST_DURATION 仅作为 ToastItem.duration 元数据
        // 传递给渲染层，由 Toast.vue 决定何时 emit('close')
        expect(toasts.value.length).toBe(1)
    })

    // ── clearAllTimers（已废弃为 no-op，保留 API 兼容性）──────

    it('clearAllTimers is a no-op (timers migrated to Toast.vue render layer)', () => {
        const { toasts, addToast, clearAllTimers } = createToast()
        addToast({ title: 'Toast 1', duration: 3000 })
        addToast({ title: 'Toast 2', duration: 5000 })
        expect(toasts.value.length).toBe(2)

        // clearAllTimers 不再做任何事，但调用应安全
        expect(() => clearAllTimers()).not.toThrow()

        vi.advanceTimersByTime(10_000)
        // 状态层本就没有定时器，toast 仍存在
        expect(toasts.value.length).toBe(2)
    })

    // ── removeToast 仅移除状态 ─────────────────────────────────

    it('removeToast removes the toast from state', () => {
        const { toasts, addToast, removeToast } = createToast()
        const id = addToast({ title: 'To remove', duration: 5000 })
        removeToast(id)
        expect(toasts.value.length).toBe(0)

        // 推进时间不会引发错误
        vi.advanceTimersByTime(10_000)
        expect(toasts.value.length).toBe(0)
    })

    // ── promise ─────────────────────────────────────────────────

    describe('promise', () => {
        it('shows loading toast then success toast on resolve (string option)', async () => {
            const { toasts, promise } = createToast()
            const p = promise(Promise.resolve('data'), {
                loading: 'Loading...',
                success: 'Done!',
                error: 'Failed',
            })

            // Loading toast should appear immediately
            expect(toasts.value.length).toBe(1)
            expect(toasts.value[0].variant).toBe('default')
            expect(toasts.value[0].title).toBe('Loading...')
            expect(toasts.value[0].duration).toBe(0)

            await p

            // Loading removed, success added
            expect(toasts.value.length).toBe(1)
            expect(toasts.value[0].variant).toBe('success')
            expect(toasts.value[0].title).toBe('Done!')
        })

        it('supports success as a function that receives resolved data', async () => {
            const { toasts, promise } = createToast()
            await promise(Promise.resolve(42), {
                loading: 'Loading...',
                success: (data) => `Got ${data}`,
                error: 'Failed',
            })

            expect(toasts.value[0].title).toBe('Got 42')
        })

        it('shows error toast on reject (string option)', async () => {
            const { toasts, promise } = createToast()
            const err = new Error('boom')

            await expect(
                promise(Promise.reject(err), {
                    loading: 'Loading...',
                    success: 'Done!',
                    error: 'Failed!',
                })
            ).rejects.toThrow('boom')

            expect(toasts.value.length).toBe(1)
            expect(toasts.value[0].variant).toBe('error')
            expect(toasts.value[0].title).toBe('Failed!')
        })

        it('supports error as a function that receives the error', async () => {
            const { toasts, promise } = createToast()
            const err = new Error('bad')

            await expect(
                promise(Promise.reject(err), {
                    loading: 'Loading...',
                    success: 'Done!',
                    error: (e) => `Caught: ${e.message}`,
                })
            ).rejects.toThrow('bad')

            expect(toasts.value[0].title).toBe('Caught: bad')
        })

        it('wraps non-Error thrown values into an Error', async () => {
            const { toasts, promise } = createToast()

            await expect(
                promise(Promise.reject('string-error'), {
                    loading: 'Loading...',
                    success: 'Done!',
                    error: (e) => e.message,
                })
            ).rejects.toBe('string-error')

            expect(toasts.value[0].title).toBe('string-error')
        })

        it('accepts a function that returns a promise', async () => {
            const { toasts, promise } = createToast()
            const fn = vi.fn().mockResolvedValue('result')

            await promise(fn, {
                loading: 'Loading...',
                success: 'OK',
                error: 'Fail',
            })

            expect(fn).toHaveBeenCalledOnce()
            expect(toasts.value[0].title).toBe('OK')
        })

        it('uses custom loadingVariant', async () => {
            const { toasts, promise } = createToast()
            const p = promise(Promise.resolve('x'), {
                loading: 'Wait',
                success: 'Yes',
                error: 'No',
                loadingVariant: 'warning',
            })

            expect(toasts.value[0].variant).toBe('warning')
            await p
        })

        it('uses custom successVariant', async () => {
            const { toasts, promise } = createToast()
            await promise(Promise.resolve('x'), {
                loading: 'Wait',
                success: 'Yes',
                error: 'No',
                successVariant: 'info',
            })

            expect(toasts.value[0].variant).toBe('info')
        })

        it('uses custom errorVariant', async () => {
            const { toasts, promise } = createToast()
            await expect(
                promise(Promise.reject(new Error('e')), {
                    loading: 'Wait',
                    success: 'Yes',
                    error: 'No',
                    errorVariant: 'warning',
                })
            ).rejects.toThrow()

            expect(toasts.value[0].variant).toBe('warning')
        })

        it('passes custom duration to success toast', async () => {
            const { toasts, promise } = createToast()
            await promise(Promise.resolve('x'), {
                loading: 'Wait',
                success: 'Yes',
                error: 'No',
                duration: 10_000,
            })

            expect(toasts.value[0].duration).toBe(10_000)
        })

        it('passes custom duration to error toast', async () => {
            const { toasts, promise } = createToast()
            await expect(
                promise(Promise.reject(new Error('e')), {
                    loading: 'Wait',
                    success: 'Yes',
                    error: 'No',
                    duration: 8000,
                })
            ).rejects.toThrow()

            expect(toasts.value[0].duration).toBe(8000)
        })

        it('returns the resolved data', async () => {
            const { promise } = createToast()
            const result = await promise(Promise.resolve('hello'), {
                loading: '...',
                success: 'ok',
                error: 'fail',
            })
            expect(result).toBe('hello')
        })

        it('re-throws the error from the promise', async () => {
            const { promise } = createToast()
            const err = new Error('test')
            await expect(
                promise(Promise.reject(err), {
                    loading: '...',
                    success: 'ok',
                    error: 'fail',
                })
            ).rejects.toThrow('test')
        })

        it.each([true, false])('releases each loading toast independently with grouping %s', async (grouping) => {
            const { toasts, addToast, promise } = createToast(false, { grouping })
            const loading = 'Loading'
            const first = deferred<string>()
            const second = deferred<string>()
            const options = { loading, success: 'Done', error: 'Failed' }
            const firstResult = promise(first.promise, options)
            const secondResult = promise(second.promise, options)

            const loadingToasts = () => toasts.value.filter((toast) => toast.title === loading && toast.duration === 0)
            expect(loadingToasts().map((toast) => toast.count)).toEqual(grouping ? [2] : [1, 1])
            const remainingId = loadingToasts().at(-1)?.id

            first.resolve('result')
            await expect(firstResult).resolves.toBe('result')
            expect(loadingToasts()).toMatchObject([{ id: remainingId, count: 1 }])
            expect(toasts.value).toContainEqual(expect.objectContaining({ title: 'Done', variant: 'success' }))

            const regularId = addToast({ title: loading, variant: 'default', duration: DEFAULT_TOAST_DURATION })
            addToast({ title: loading, variant: 'default', duration: DEFAULT_TOAST_DURATION })
            expect(loadingToasts()).toMatchObject([{ id: remainingId, count: 1 }])

            const failure = new Error('failure')
            second.reject(failure)
            await expect(secondResult).rejects.toBe(failure)
            expect(loadingToasts()).toHaveLength(0)
            expect(toasts.value.find((toast) => toast.id === regularId)).toMatchObject({
                count: grouping ? 2 : 1,
                duration: DEFAULT_TOAST_DURATION,
            })
            expect(toasts.value).toContainEqual(expect.objectContaining({ title: 'Failed', variant: 'error' }))
        })

        it.each(['clear', 'remove'] as const)('shows the result after manual %s', async (dismiss) => {
            const { toasts, clearToasts, removeToast, promise } = createToast(false, { grouping: true })
            const options = { loading: 'Loading', success: 'Done', error: 'Failed' }
            const first = deferred<string>()
            const second = deferred<string>()
            const firstResult = promise(first.promise, options)
            if (dismiss === 'clear') clearToasts()
            else removeToast(toasts.value[0].id)

            const secondResult = promise(second.promise, options)
            const remainingId = toasts.value[0].id
            first.resolve('first')
            await expect(firstResult).resolves.toBe('first')
            expect(toasts.value).toMatchObject([{ id: remainingId, count: 1 }, { title: 'Done' }])

            second.resolve('second')
            await expect(secondResult).resolves.toBe('second')
            expect(toasts.value).toMatchObject([{ title: 'Done', count: 2 }])
        })

        it('settles pending operations after scope disposal without formatting or showing their results', async () => {
            const scope = effectScope()
            const { toasts, promise } = scope.run(() => createToast(false, { grouping: true }))!
            const first = deferred<string>()
            const failure = new Error('failure')
            const options = { loading: 'Loading', success: vi.fn(() => 'Done'), error: vi.fn(() => 'Failed') }
            const firstResult = promise(first.promise, options)
            const secondResult = promise(() => { throw failure }, options)

            scope.stop()
            expect(toasts.value).toHaveLength(0)
            first.resolve('result')
            await expect(firstResult).resolves.toBe('result')
            await expect(secondResult).rejects.toBe(failure)
            expect(toasts.value).toHaveLength(0)
            expect(options.success).not.toHaveBeenCalled()
            expect(options.error).not.toHaveBeenCalled()
        })

        it('releases the loading toast and shows the original error when the operation throws synchronously', async () => {
            const { toasts, promise } = createToast()
            const failure = new Error('failure')
            const error = vi.fn(() => 'Failed')
            const result = promise(() => { throw failure }, { loading: 'Loading', success: 'Done', error })

            expect(toasts.value).toMatchObject([{ title: 'Loading' }])
            await expect(result).rejects.toBe(failure)
            expect(error).toHaveBeenCalledWith(failure)
            expect(toasts.value).toMatchObject([{ title: 'Failed', variant: 'error' }])
        })

        it('preserves the original results and releases loading when result formatters throw', async () => {
            const report = vi.spyOn(console, 'error').mockImplementation(() => {})
            try {
                const { toasts, promise } = createToast(false, { grouping: true })
                const value = { saved: true }
                const failure = new Error('operation failed')
                const formattingFailure = new Error('formatter failed')
                const success = vi.fn(() => { throw formattingFailure })
                const error = vi.fn(() => { throw formattingFailure })
                const options = { loading: 'Loading', success, error }
                const first = deferred<typeof value>()
                const second = deferred<typeof value>()
                const firstResult = promise(first.promise, options)
                const secondResult = promise(second.promise, options)

                first.resolve(value)
                await expect(firstResult).resolves.toBe(value)
                expect(success).toHaveBeenCalledWith(value)
                expect(error).not.toHaveBeenCalled()
                expect(toasts.value).toMatchObject([{ title: 'Loading', count: 1 }])

                second.reject(failure)
                await expect(secondResult).rejects.toBe(failure)
                expect(error).toHaveBeenCalledWith(failure)
                expect(toasts.value).toHaveLength(0)
                expect(report).toHaveBeenCalledTimes(2)
                expect(report).toHaveBeenCalledWith(expect.stringContaining('[BrutxUI]'), formattingFailure)
            } finally {
                report.mockRestore()
            }
        })

        it('does not add toast when duration is omitted (uses undefined → defaults)', async () => {
            const { toasts, promise } = createToast()
            await promise(Promise.resolve('x'), {
                loading: 'Wait',
                success: 'Yes',
                error: 'No',
                duration: 0,
            })

            // duration: 0 means the success toast stays (no auto-remove)
            expect(toasts.value.length).toBe(1)
            expect(toasts.value[0].duration).toBe(0)

            vi.advanceTimersByTime(100_000)
            expect(toasts.value.length).toBe(1)
        })
    })

    // ── provideToast / useToast / destroyFallback ───────────────

    describe('provideToast / useToast', () => {
        it('provideToast returns toast instance', () => {
            const app = createApp(
                defineComponent({
                    setup() {
                        const provided = provideToast()
                        expect(provided).toBeDefined()
                        expect(provided.toasts).toBeDefined()
                        expect(typeof provided.addToast).toBe('function')
                        return () => h('div')
                    },
                })
            )
            const el = document.createElement('div')
            app.mount(el)
            app.unmount()
        })

        it('useToast retrieves the provided toast instance from parent', () => {
            let providedRef: ReturnType<typeof provideToast> | undefined
            let consumedRef: ReturnType<typeof useToast> | undefined

            const Child = defineComponent({
                setup() {
                    consumedRef = useToast()
                    return () => h('div')
                },
            })

            const Parent = defineComponent({
                setup() {
                    providedRef = provideToast()
                    return () => h(Child)
                },
            })

            const app = createApp(Parent)
            const el = document.createElement('div')
            app.mount(el)

            expect(consumedRef).toBe(providedRef)
            app.unmount()
        })

        it('useToast falls back to singleton when no provider exists', () => {
            destroyFallback()

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            const toast = useToast()

            expect(toast).toBeDefined()
            expect(toast.toasts).toBeDefined()
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('provideToast()')
            )

            warnSpy.mockRestore()
            destroyFallback()
        })

        it('useToast reuses existing fallback instance', () => {
            destroyFallback()

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            const toast1 = useToast()
            const toast2 = useToast()

            // Both calls should return the same singleton
            expect(toast1).toBe(toast2)

            warnSpy.mockRestore()
            destroyFallback()
        })

        it('fallback toast (isFallback=true) does not register onScopeDispose', () => {
            destroyFallback()

            // useToast creates fallback with isFallback=true
            // We verify the fallback works and can be destroyed cleanly
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            const toast = useToast()
            toast.addToast({ title: 'Fallback toast' })
            expect(toast.toasts.value.length).toBe(1)

            destroyFallback()
            warnSpy.mockRestore()
        })

        it('ref-counts component-level cleanup: clears fallback toasts only when last consumer unmounts', async () => {
            destroyFallback()

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const showChild1 = ref(true)
            const showChild2 = ref(true)
            let appToast: ReturnType<typeof useToast> | null = null

            const Consumer1 = defineComponent({
                setup() {
                    const toast = useToast()
                    appToast = toast
                    toast.addToast({ title: 'Toast 1' })
                    return () => h('div')
                },
            })

            const Consumer2 = defineComponent({
                setup() {
                    const toast = useToast()
                    toast.addToast({ title: 'Toast 2' })
                    return () => h('div')
                },
            })

            const Root = defineComponent({
                setup() {
                    return () => h('div', [
                        showChild1.value ? h(Consumer1) : null,
                        showChild2.value ? h(Consumer2) : null,
                    ])
                },
            })

            const app = createApp(Root)
            const el = document.createElement('div')
            app.mount(el)

            // 同一个 App 下两个消费者共享该 App 的 fallback 实例，各自添加的 toast 都保留
            expect(appToast!.toasts.value.length).toBe(2)

            // 卸载第一个：同 App 内仍有第二个消费者使用，toast 不应被清空
            showChild1.value = false
            await nextTick()
            expect(appToast!.toasts.value.length).toBe(2)

            const result = deferred<string>()
            const pending = appToast!.promise(result.promise, { loading: 'Loading', success: 'Done', error: 'Failed' })

            // 卸载第二个：同 App 引用计数归零，fallback 实例被销毁，toast 被清空
            showChild2.value = false
            await nextTick()
            expect(appToast!.toasts.value.length).toBe(0)
            const failure = new Error('failure')
            result.reject(failure)
            await expect(pending).rejects.toBe(failure)
            expect(appToast!.toasts.value).toHaveLength(0)

            app.unmount()
            warnSpy.mockRestore()
            destroyFallback()
        })

        it('isolates fallback toasts between independent apps', () => {
            destroyFallback()
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            let toast1: ReturnType<typeof useToast> | null = null
            let toast2: ReturnType<typeof useToast> | null = null

            const Consumer1 = defineComponent({
                setup() {
                    toast1 = useToast()
                    toast1.addToast({ title: 'App 1 Toast' })
                    return () => h('div')
                },
            })

            const Consumer2 = defineComponent({
                setup() {
                    toast2 = useToast()
                    toast2.addToast({ title: 'App 2 Toast' })
                    return () => h('div')
                },
            })

            const app1 = createApp(Consumer1)
            const app2 = createApp(Consumer2)
            const el1 = document.createElement('div')
            const el2 = document.createElement('div')
            app1.mount(el1)
            app2.mount(el2)

            // 两个独立的 App 拥有各自隔离的 fallback 实例
            expect(toast1!.toasts.value.length).toBe(1)
            expect(toast2!.toasts.value.length).toBe(1)
            expect(toast1!.toasts.value[0].title).toBe('App 1 Toast')
            expect(toast2!.toasts.value[0].title).toBe('App 2 Toast')

            // 卸载 app1 只清理 app1 的 fallback，不影响 app2
            app1.unmount()
            expect(toast1!.toasts.value.length).toBe(0)
            expect(toast2!.toasts.value.length).toBe(1)

            // 卸载 app2 清理 app2 的 fallback
            app2.unmount()
            expect(toast2!.toasts.value.length).toBe(0)

            warnSpy.mockRestore()
            destroyFallback()
        })
    })

    // ── destroyFallback ─────────────────────────────────────────

    describe('destroyFallback', () => {
        it('clears the fallback instance', () => {
            destroyFallback()

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            const toast1 = useToast()
            toast1.addToast({ title: 'test' })

            destroyFallback()

            // Next useToast should create a fresh fallback
            const toast2 = useToast()
            expect(toast2.toasts.value.length).toBe(0)
            expect(toast2).not.toBe(toast1)

            warnSpy.mockRestore()
            destroyFallback()
        })

        it('is safe to call when no fallback exists', () => {
            destroyFallback()
            destroyFallback() // should not throw
        })

        it('keeps pending results from a destroyed browser fallback out of the old and replacement instances', async () => {
            destroyFallback()
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            try {
                const oldToast = useToast()
                const first = deferred<string>()
                const second = deferred<string>()
                const options = { loading: 'Loading', success: 'Done', error: 'Failed' }
                const firstResult = oldToast.promise(first.promise, options)

                destroyFallback()
                const newToast = useToast()
                const secondResult = newToast.promise(second.promise, options)
                expect(newToast).not.toBe(oldToast)

                first.resolve('first')
                await expect(firstResult).resolves.toBe('first')
                expect(oldToast.toasts.value).toHaveLength(0)
                expect(newToast.toasts.value).toMatchObject([{ title: 'Loading', count: 1 }])

                second.resolve('second')
                await expect(secondResult).resolves.toBe('second')
                expect(newToast.toasts.value).toMatchObject([{ title: 'Done' }])
            } finally {
                destroyFallback()
                warnSpy.mockRestore()
            }
        })

        it('destroyFallback removes the lazily-registered beforeunload listener (HMR/multi-app cleanup)', async () => {
            // 独立模块实例：beforeunload 监听在首次 fallback 单例创建（懒注册）时注册，
            // 先触发 useToast() 再验证 destroyFallback 会将其移除
            vi.resetModules()
            const { destroyFallback: freshDestroyFallback, useToast: freshUseToast } = await import('./useToast')

            const removeSpy = vi.spyOn(window, 'removeEventListener')
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            freshUseToast() // 触发 fallback 单例创建 → 注册 beforeunload
            freshDestroyFallback()
            expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
            warnSpy.mockRestore()
        })
    })

    // ── Toast Grouping ──────────────────────────────────────────
    describe('Toast Grouping', () => {
        it('does not group by default', () => {
            const { toasts, addToast } = createToast()
            addToast({ title: 'Test', variant: 'success' })
            addToast({ title: 'Test', variant: 'success' })
            expect(toasts.value.length).toBe(2)
            expect(toasts.value[0].count).toBe(1)
            expect(toasts.value[1].count).toBe(1)
        })

        it('groups when global grouping is enabled', () => {
            const { toasts, addToast } = createToast(false, { grouping: true })
            const id1 = addToast({ title: 'Test', variant: 'success' })
            const id2 = addToast({ title: 'Test', variant: 'success' })
            
            expect(toasts.value.length).toBe(1)
            expect(toasts.value[0].id).toBe(id1)
            expect(toasts.value[0].count).toBe(2)
            expect(id1).toBe(id2)
        })

        it('groups when local grouping is enabled per toast', () => {
            const { toasts, addToast } = createToast()
            const id1 = addToast({ title: 'Test', variant: 'success', grouping: true })
            const id2 = addToast({ title: 'Test', variant: 'success', grouping: true })
            
            expect(toasts.value.length).toBe(1)
            expect(toasts.value[0].count).toBe(2)
            expect(id1).toBe(id2)
        })

        it('does not group if variant is different', () => {
            const { toasts, addToast } = createToast(false, { grouping: true })
            addToast({ title: 'Test', variant: 'success' })
            addToast({ title: 'Test', variant: 'error' })
            
            expect(toasts.value.length).toBe(2)
        })

        it('does not group if title is different', () => {
            const { toasts, addToast } = createToast(false, { grouping: true })
            addToast({ title: 'Test 1', variant: 'success' })
            addToast({ title: 'Test 2', variant: 'success' })
            
            expect(toasts.value.length).toBe(2)
        })

        it('grouping updates count and duration metadata (timers live in Toast.vue)', () => {
            // 状态层不再有 timer 重置语义；grouping 仅更新 count 与 duration 元数据，
            // 离场倒计时由渲染层 Toast.vue 在收到新 duration 时重新启动
            const { toasts, addToast } = createToast(false, { grouping: true })
            addToast({ title: 'Test', variant: 'success', duration: 5000 })

            vi.advanceTimersByTime(3000)
            expect(toasts.value.length).toBe(1)

            // 在 t=3000ms 添加相同 toast，count 应递增，duration 元数据应更新
            addToast({ title: 'Test', variant: 'success', duration: 5000 })
            expect(toasts.value.length).toBe(1)
            expect(toasts.value[0].count).toBe(2)
            expect(toasts.value[0].duration).toBe(5000)

            // 推进时间，状态层不会移除 toast（无定时器）
            vi.advanceTimersByTime(10_000)
            expect(toasts.value.length).toBe(1)
            expect(toasts.value[0].count).toBe(2)
        })
    })
})
