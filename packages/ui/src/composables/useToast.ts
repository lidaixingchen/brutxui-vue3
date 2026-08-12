import { ref, inject, provide, readonly, getCurrentScope, getCurrentInstance, onScopeDispose, onUnmounted, type InjectionKey, type DeepReadonly, type Ref } from 'vue'
import { MAX_TOASTS } from '../lib/defaults'
import type { VariantProps } from 'class-variance-authority'
import { toastVariants } from '../components/toast/toast-variants'
import { isClient, getWindow } from '../lib/env'


type ToastVariantProps = VariantProps<typeof toastVariants>

export interface ToastItem {
    id: string
    variant?: NonNullable<ToastVariantProps['variant']>
    size?: NonNullable<ToastVariantProps['size']>
    title?: string
    description?: string
    duration?: number
    count?: number
    grouping?: boolean
}

export interface ToastStackOptions {
    maxVisible?: number
    gap?: number
    expandDirection?: 'down' | 'up'
}

export type ToastPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
    | { x: number; y: number; anchor?: 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right' }

export interface PromiseToastOptions<T> {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: Error) => string)
    duration?: number
    loadingVariant?: NonNullable<ToastVariantProps['variant']>
    successVariant?: NonNullable<ToastVariantProps['variant']>
    errorVariant?: NonNullable<ToastVariantProps['variant']>
}

export interface UseToastReturn {
    /** 只读视图：修改请经 addToast / removeToast / clearToasts */
    toasts: DeepReadonly<Ref<readonly ToastItem[]>>
    addToast: (toast: Omit<ToastItem, 'id'>) => string
    removeToast: (id: string) => void
    clearToasts: () => void
    clearAllTimers: () => void
    success: (title: string, description?: string) => string
    error: (title: string, description?: string) => string
    warning: (title: string, description?: string) => string
    info: (title: string, description?: string) => string
    promise: <T>(promiseOrFn: Promise<T> | (() => Promise<T>), options: PromiseToastOptions<T>) => Promise<T>
}

const TOAST_KEY: InjectionKey<UseToastReturn> = Symbol('brutx-toast')
export const DEFAULT_TOAST_DURATION = 5000

export function createToast(isFallback = false, globalOptions?: { grouping?: boolean }): UseToastReturn {
    const toasts = ref<ToastItem[]>([])
    const globalGrouping = globalOptions?.grouping ?? false

    // 注意：useToast 层不再启动自动移除定时器。离场倒计时由渲染层（Toast.vue）的
    // duration 定时器驱动，Toast.vue 在动画完成后 emit('close')，调用方通过
    // @close="removeToast(toast.id)" 触发状态层移除。这样：
    // 1. 避免双定时器冲突（useToast + Toast.vue 各起一个 setTimeout）
    // 2. pauseOnHover 自然生效（仅 Toast.vue 控制 pause/resume）
    // 3. 离场动画能正常播放（useToast 不会提前从数组移除导致组件卸载）

    function addToast(toast: Omit<ToastItem, 'id'>) {
        const isGroupingEnabled = toast.grouping ?? globalGrouping
        if (isGroupingEnabled) {
            // 匹配键包含 description/size，避免标题与变体相同但内容不同的 toast 被误合并
            const existingIndex = toasts.value.findIndex(
                (t) => t.title === toast.title
                    && t.variant === toast.variant
                    && t.description === toast.description
                    && t.size === toast.size
            )
            // 已有 toast 自身关闭分组（grouping: false）时不强行合并
            if (existingIndex !== -1 && toasts.value[existingIndex].grouping !== false) {
                const existing = toasts.value[existingIndex]
                const updatedCount = (existing.count ?? 1) + 1

                // 仅覆盖新 toast 显式提供的字段：description/size/duration 等未提供时
                // 保留已有值，避免被 undefined 覆盖造成信息丢失
                // （key 为联合类型时索引赋值需经 Record 断言，TS 无法逐键窄化 value）
                const mergedFields = (Object.keys(toast) as (keyof Omit<ToastItem, 'id'>)[])
                    .reduce<Partial<Omit<ToastItem, 'id'>>>((acc, key) => {
                        const value = toast[key]
                        if (value !== undefined) {
                            (acc as Record<string, unknown>)[key] = value
                        }
                        return acc
                    }, {})

                const updatedToast: ToastItem = {
                    ...existing,
                    ...mergedFields,
                    id: existing.id,
                    count: updatedCount,
                }
                const newToasts = [...toasts.value]
                newToasts[existingIndex] = updatedToast
                toasts.value = newToasts

                return existing.id
            }
        }

        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        if (toasts.value.length >= MAX_TOASTS) {
            toasts.value = toasts.value.slice(1)
        }
        toasts.value = [...toasts.value, { ...toast, id, count: toast.count ?? 1 }]

        return id
    }

    function removeToast(id: string) {
        toasts.value = toasts.value.filter((t) => t.id !== id)
    }

    /**
     * @deprecated 定时器已迁移至 Toast.vue 渲染层（由渲染层的 duration 定时器驱动离场，
     * 动画完成后 emit('close') 经 @close="removeToast(toast.id)" 回到状态层）。
     * 调用本方法没有任何效果；如需要清除当前所有 toast，请使用 clearToasts()。
     */
    function clearAllTimers() {}

    function clearToasts() {
        toasts.value = []
    }

    if (!isFallback && getCurrentScope()) {
        onScopeDispose(() => {
            clearToasts()
        })
    }

    function success(title: string, description?: string) {
        return addToast({ variant: 'success', title, description })
    }

    function error(title: string, description?: string) {
        return addToast({ variant: 'error', title, description })
    }

    function warning(title: string, description?: string) {
        return addToast({ variant: 'warning', title, description })
    }

    function info(title: string, description?: string) {
        return addToast({ variant: 'info', title, description })
    }

    async function promise<T>(
        promiseOrFn: Promise<T> | (() => Promise<T>),
        options: PromiseToastOptions<T>
    ): Promise<T> {
        // 函数形态经 Promise.resolve().then() 求值：同步抛错被转为 rejection 由下方 catch 捕获，
        // 保证 loading/error toast 都会展示（若在 try 外直接调用，同步异常会绕过 toast 反馈层）
        const promiseValue = typeof promiseOrFn === 'function'
            ? Promise.resolve().then(promiseOrFn)
            : Promise.resolve(promiseOrFn)
        const loadingId = addToast({
            variant: options.loadingVariant ?? 'default',
            title: options.loading,
            duration: 0,
        })

        try {
            const data = await promiseValue
            removeToast(loadingId)
            const successMessage = typeof options.success === 'function'
                ? options.success(data)
                : options.success
            addToast({
                variant: options.successVariant ?? 'success',
                title: successMessage,
                duration: options.duration,
            })
            return data
        } catch (err) {
            removeToast(loadingId)
            const errorObj = err instanceof Error ? err : new Error(String(err))
            const errorMessage = typeof options.error === 'function'
                ? options.error(errorObj)
                : options.error
            addToast({
                variant: options.errorVariant ?? 'error',
                title: errorMessage,
                duration: options.duration,
            })
            throw err
        }
    }

    return {
        toasts: readonly(toasts),
        addToast,
        removeToast,
        clearToasts,
        clearAllTimers,
        success,
        error,
        warning,
        info,
        promise,
    }
}

let fallbackInstance: UseToastReturn | null = null
// 引用计数：多组件共享 fallback 单例时，仅在最后一个组件卸载时才清空单例，
// 避免提前 clearToasts 导致其他仍使用单例的组件丢失 toast（仿 useTheme 的 fallback 引用计数模式）
let fallbackRefCount = 0

// beforeunload 全局监听句柄：destroyFallback() 时移除，防止 HMR/多应用同页重复注册累积
let beforeUnloadHandler: (() => void) | null = null

if (isClient) {
    beforeUnloadHandler = () => destroyFallback()
    getWindow()?.addEventListener('beforeunload', beforeUnloadHandler)
}

function destroyFallback() {
    // 移除 beforeunload 全局监听：为 destroyBrutxUI() 提供清理出口，避免 HMR/多应用同页重复注册累积
    if (beforeUnloadHandler) {
        getWindow?.()?.removeEventListener('beforeunload', beforeUnloadHandler)
        beforeUnloadHandler = null
    }
    if (fallbackInstance) {
        fallbackInstance.clearToasts()
        fallbackInstance = null
        fallbackRefCount = 0
    }
}

export function provideToast(globalOptions?: { grouping?: boolean }): UseToastReturn {
    const toast = createToast(false, globalOptions)
    provide(TOAST_KEY, toast)
    return toast
}

export function useToast(): UseToastReturn {
    const toast = inject(TOAST_KEY)
    if (toast) return toast
    if (typeof console !== 'undefined') {
        console.warn('[BrutxUI] useToast() called without provideToast(). Falling back to shared singleton. Call provideToast() in your root component.')
    }
    if (!fallbackInstance) {
        fallbackInstance = createToast(true)
    }
    // 组件级清理：引用计数归零时清空单例 toasts（仿 useTheme 的 fallback 引用计数模式）。
    // 仅当在组件 setup 上下文中调用时才注册清理（与 provideTheme/useTheme 行为一致）。
    // 共享单例状态下，一处的 clearToasts 仍会清空全部；如需按作用域隔离请在应用根部调用 provideToast()。
    if (getCurrentInstance()) {
        // 捕获本次 setup 使用的实例：若外部（beforeunload/显式调用）先 destroyFallback
        // 导致单例被重建，本组件卸载时不得误减新实例的引用计数或误清空新单例
        const instance = fallbackInstance
        fallbackRefCount++
        onUnmounted(() => {
            if (fallbackInstance !== instance) return
            fallbackRefCount--
            if (fallbackRefCount <= 0) {
                destroyFallback()
            }
        })
    }
    return fallbackInstance
}

export { destroyFallback }
