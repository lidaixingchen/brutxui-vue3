import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { hasIntersectionObserver, getIntersectionObserverCtor } from '@/lib/env'

export interface UseInfiniteScrollOptions {
    /** 触发距离阈值 (px) */
    distance?: number
    /** 防抖延迟 (ms) */
    delay?: number
    /** 是否禁用 */
    disabled?: boolean
    /** 是否立即检查 */
    immediate?: boolean
    /** 加载回调（可为异步；抛错或 reject 时自动复位 isLoading 并记录日志） */
    onLoad: () => void | Promise<void>
}

const DEFAULT_DISTANCE = 100
const DEFAULT_DELAY = 200
type ObserverSetupResult = 'observed' | 'unsupported' | 'missing-target'

export function useInfiniteScroll(
    targetRef: Ref<HTMLElement | null>,
    options: UseInfiniteScrollOptions
) {
    // 使用 getter 读取最新值，避免在 setup 时静态捕获导致后续变更不生效
    const getDistance = (): number => options.distance ?? DEFAULT_DISTANCE
    const getDelay = (): number => options.delay ?? DEFAULT_DELAY
    const getDisabled = (): boolean => options.disabled ?? false
    const getImmediate = (): boolean => options.immediate ?? true

    const isLoading = ref(false)
    const observer = ref<IntersectionObserver | null>(null)
    const loadTimer = ref<ReturnType<typeof setTimeout> | null>(null)
    // 目标元素未渲染（v-if/异步渲染）时，用于等待其出现后重试建立 observer 的 watch 停止函数
    let stopTargetWatch: (() => void) | undefined

    function shouldLoad(): boolean {
        if (getDisabled()) return false
        if (isLoading.value) return false
        return true
    }

    function triggerLoad() {
        if (!shouldLoad()) return

        if (loadTimer.value) {
            clearTimeout(loadTimer.value)
        }

        loadTimer.value = setTimeout(async () => {
            isLoading.value = true
            try {
                // async 回调的同步抛错与 Promise reject 统一由 catch 捕获
                await options.onLoad()
            } catch (error) {
                // onLoad 抛错时复位 isLoading，避免 shouldLoad 永久返回 false 导致加载卡死
                isLoading.value = false
                console.error('[useInfiniteScroll] onLoad 执行失败:', error)
            }
        }, getDelay())
    }

    function setupObserver(): ObserverSetupResult {
        if (!targetRef.value) return 'missing-target'
        if (!hasIntersectionObserver) return 'unsupported'

        const Ctor = getIntersectionObserverCtor()
        if (!Ctor) return 'unsupported'

        observer.value = new Ctor(
            (entries) => {
                const entry = entries[0]
                if (entry.isIntersecting) {
                    triggerLoad()
                }
            },
            {
                root: null,
                rootMargin: `${getDistance()}px`,
                threshold: 0,
            }
        )

        observer.value.observe(targetRef.value)
        return 'observed'
    }

    function cleanupObserver() {
        if (observer.value) {
            observer.value.disconnect()
            observer.value = null
        }
    }

    // 目标元素由 v-if/异步渲染产生、onMounted 时尚未存在时，
    // 监听其出现后重试建立 observer
    function watchForTarget() {
        if (stopTargetWatch) return
        stopTargetWatch = watch(targetRef, (target) => {
            if (target && !observer.value && !getDisabled()) {
                stopTargetWatch?.()
                stopTargetWatch = undefined
                const observerResult = setupObserver()
                if (observerResult === 'unsupported' && getImmediate()) {
                    triggerLoad()
                }
            }
        })
    }

    function resetLoading() {
        isLoading.value = false
        if (loadTimer.value) {
            clearTimeout(loadTimer.value)
            loadTimer.value = null
        }

        if (!targetRef.value || getDisabled()) return

        if (observer.value) {
            // 解除并重新观察目标，触发一次携带当前相交状态的初始回调。
            // IntersectionObserver 仅在交叉状态变化时回调，若数据加载后目标元素
            // 仍处于（含 distance 阈值扩展的）视口内，resetLoading 后不会产生新回调导致停滞；
            // 重新 observe 会触发 observer 初始回调重新拉取
            observer.value.unobserve(targetRef.value)
            observer.value.observe(targetRef.value)
        } else if (!hasIntersectionObserver) {
            // unsupported（无 IntersectionObserver）环境回退：与 InfiniteScroll.vue 组件版
            // 的 resetLoading 语义一致，无条件保守触发一次（不查 immediate——immediate=false
            // 仅约束挂载时机，不约束调用方主动复位）。
            // 契约：unsupported 环境下每次 resetLoading 都会触发一次加载，数据耗尽时须同步
            // 置 disabled=true，否则会形成「加载→复位→再加载」的自动循环
            triggerLoad()
        }
    }

    onMounted(() => {
        if (!getDisabled()) {
            const observerResult = setupObserver()
            if (observerResult === 'missing-target') {
                watchForTarget()
            }

            // 严格遵循 immediate 语义：immediate 为 false 时挂载不触发加载
            //（unsupported 环境同样不触发，加载依赖调用方后续主动 resetLoading/滚动触发）
            if (getImmediate()) {
                triggerLoad()
            }
        }
    })

    // 监听 distance 变化，重新创建 observer 以应用新的 rootMargin
    watch(
        () => options.distance,
        () => {
            if (observer.value) {
                cleanupObserver()
                if (!getDisabled()) {
                    setupObserver()
                }
            }
        }
    )

    // 监听 disabled 变化，动态启停 observer
    watch(
        () => options.disabled,
        (newDisabled) => {
            if (newDisabled) {
                cleanupObserver()
                stopTargetWatch?.()
                stopTargetWatch = undefined
                // 清理已排队的加载定时器，禁用后 onLoad 不应再被执行
                if (loadTimer.value) {
                    clearTimeout(loadTimer.value)
                    loadTimer.value = null
                }
            } else if (!observer.value) {
                // 重新启用时复位 isLoading：禁用前残留的 true 会拦截 observer 初始回调，
                // 导致组件一直无法加载直到外部手动 resetLoading
                isLoading.value = false
                const observerResult = setupObserver()
                if (observerResult === 'unsupported' && getImmediate()) {
                    triggerLoad()
                } else if (observerResult === 'missing-target') {
                    watchForTarget()
                }
            }
        }
    )

    onUnmounted(() => {
        stopTargetWatch?.()
        stopTargetWatch = undefined
        cleanupObserver()
        if (loadTimer.value) {
            clearTimeout(loadTimer.value)
        }
    })

    return {
        isLoading,
        resetLoading,
    }
}
