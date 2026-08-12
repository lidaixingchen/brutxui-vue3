import { ref, readonly, computed, onActivated, onDeactivated, onMounted, onUnmounted, watch, toValue, type ComputedRef, type DeepReadonly, type MaybeRefOrGetter, type Ref } from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import { DEFAULT_AUTOPLAY_DELAY_MS } from '../lib/defaults'
import { useReducedMotion } from './useReducedMotion'

export const DEFAULT_AUTOPLAY_DELAY = DEFAULT_AUTOPLAY_DELAY_MS

export interface UseCarouselOptions {
    loop?: MaybeRefOrGetter<boolean | undefined>
    autoplay?: MaybeRefOrGetter<boolean | undefined>
    autoplayDelay?: MaybeRefOrGetter<number | undefined>
    /** autoplay 状态变化回调 */
    onAutoplayChange?: (enabled: boolean) => void
    /** autoplayDelay 变化后 autoplay 重启回调 */
    onAutoplayDelayChange?: () => void
    /** 复用的 reduced-motion 偏好引用：传入可避免同一组件重复实例化媒体查询与监听（useCarouselEnhanced 复用自身实例） */
    prefersReducedMotion?: Readonly<Ref<boolean>>
}

export interface UseCarouselReturn {
    emblaRef: Ref<HTMLElement | undefined>
    /** 只读视图：切换请经 scrollPrev / scrollNext / scrollTo */
    selectedIndex: Readonly<Ref<number>>
    /** 只读视图：由 embla 内部维护 */
    scrollSnaps: DeepReadonly<Ref<readonly number[]>>
    canScrollPrev: ComputedRef<boolean>
    canScrollNext: ComputedRef<boolean>
    scrollPrev: () => void
    scrollNext: () => void
    scrollTo: (index: number) => void
    startAutoplay: () => boolean
    stopAutoplay: () => void
}

export function useCarousel(options: UseCarouselOptions = {}): UseCarouselReturn {
    const prefersReducedMotion = options.prefersReducedMotion ?? useReducedMotion()

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: toValue(options.loop) ?? false })

    const selectedIndex = ref(0)
    const scrollSnaps = ref<number[]>([])
    let autoplayTimer: ReturnType<typeof setInterval> | null = null
    // KeepAlive 停用标记：停用期间禁止启动定时器，避免隐藏轮播空转
    const isDeactivated = ref(false)
    // KeepAlive 停用前自动播放是否仍在运行：重新激活时据此决定是否恢复计时
    let wasAutoplayRunningBeforeDeactivate = false

    const canScrollPrev = computed(() => (toValue(options.loop) ?? false) || selectedIndex.value > 0)
    const canScrollNext = computed(() => (toValue(options.loop) ?? false) || selectedIndex.value < scrollSnaps.value.length - 1)

    function onInit() {
        if (!emblaApi.value) return
        scrollSnaps.value = emblaApi.value.scrollSnapList()
        selectedIndex.value = emblaApi.value.selectedScrollSnap()
    }

    function onSelect() {
        if (!emblaApi.value) return
        selectedIndex.value = emblaApi.value.selectedScrollSnap()
    }

    function scrollPrev() {
        emblaApi.value?.scrollPrev()
    }

    function scrollNext() {
        emblaApi.value?.scrollNext()
    }

    function scrollTo(index: number) {
        emblaApi.value?.scrollTo(index)
    }

    function startAutoplay(): boolean {
        stopAutoplay()
        if (!toValue(options.autoplay) || prefersReducedMotion.value) return false
        // KeepAlive 停用期间不启动定时器，避免隐藏轮播空转
        if (isDeactivated.value) return false
        const delay = toValue(options.autoplayDelay) ?? DEFAULT_AUTOPLAY_DELAY
        // 非法延迟（<= 0）直接返回：setInterval 会退化为浏览器下限（约 4ms）疯狂滚动，与 useCarouselEnhanced 守卫一致
        if (delay <= 0) return false
        autoplayTimer = setInterval(() => {
            if (emblaApi.value && scrollSnaps.value.length > 0) {
                // 用 canScrollNext() 同步判断是否到达末尾：selectedIndex 由 'select' 事件异步更新，
                // 动画时长大于 autoplayDelay 时定时器触发时索引可能尚未更新到末页，
                // 会导致末页重复调用 scrollNext（空转）或无法及时停止
                if (!(toValue(options.loop) ?? false) && !emblaApi.value.canScrollNext()) {
                    stopAutoplay()
                    // 内部自动停止同样上报，保证 onAutoplayChange 反映真实运行态
                    // （useCarouselEnhanced 依赖该回调停止进度计时器）
                    options.onAutoplayChange?.(false)
                } else {
                    emblaApi.value.scrollNext()
                }
            }
        }, delay)
        return true
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer)
            autoplayTimer = null
        }
    }

    let cachedApi: NonNullable<typeof emblaApi.value> | null = null

    function initCarousel(api: NonNullable<typeof emblaApi.value>) {
        cachedApi = api
        cachedApi.on('init', onInit)
        cachedApi.on('select', onSelect)
        cachedApi.on('reInit', onInit)
        if (prefersReducedMotion.value) {
            cachedApi.reInit({ duration: 0 })
        }
        onInit()
        // 仅真正启动（autoplay 开启且非 reduced-motion、delay 合法）才上报启用，
        // 与 startAutoplay 返回值对齐，避免静默失败路径误报
        if (startAutoplay()) {
            options.onAutoplayChange?.(true)
        }
    }

    onMounted(() => {
        // 挂载阶段 emblaApi 通常已由 ref 回调填充并触发 watch(emblaApi) 完成初始化，
        // 增加 cachedApi 守卫避免同一实例上 init/select/reInit 监听器重复注册
        if (!emblaApi.value || cachedApi === emblaApi.value) return
        initCarousel(emblaApi.value)
    })

    watch(emblaApi, (api) => {
        if (!api || cachedApi === api) return
        // API 实例被替换时先解绑旧实例监听器，避免旧实例残留、卸载后仍收到回调
        if (cachedApi) {
            cachedApi.off('init', onInit)
            cachedApi.off('select', onSelect)
            cachedApi.off('reInit', onInit)
        }
        initCarousel(api)
    })

    watch(() => toValue(options.autoplay), (val) => {
        if (val) {
            // prefersReducedMotion 或非法 delay 时 startAutoplay 返回 false（定时器并未启动），
            // 不应上报启用，避免外部回调收到与实际启停状态不一致的通知
            if (prefersReducedMotion.value) return
            if (startAutoplay()) {
                options.onAutoplayChange?.(true)
            }
        } else {
            stopAutoplay()
            options.onAutoplayChange?.(false)
        }
    })

    watch(() => toValue(options.loop), () => {
        if (emblaApi.value) emblaApi.value.reInit({ loop: toValue(options.loop) ?? false })
        // loop 由 false 切 true 前，非 loop 模式自动播放可能已在末页 stopAutoplay()，
        // 而 autoplay 值本身未变化、其 watcher 不会再次触发，需在此主动恢复
        if (toValue(options.autoplay) && !prefersReducedMotion.value) startAutoplay()
    })

    watch(() => toValue(options.autoplayDelay), () => {
        if (toValue(options.autoplay)) {
            startAutoplay()
            options.onAutoplayDelayChange?.()
        }
    })

    watch(prefersReducedMotion, (reduced) => {
        if (!emblaApi.value) return
        if (reduced) {
            stopAutoplay()
            emblaApi.value.reInit({ duration: 0 })
            options.onAutoplayChange?.(false)
        } else {
            emblaApi.value.reInit({})
            if (toValue(options.autoplay)) {
                if (startAutoplay()) {
                    options.onAutoplayChange?.(true)
                }
            }
        }
    })

    onDeactivated(() => {
        // KeepAlive 缓存停用时停止自动播放定时器，避免隐藏轮播继续 scrollNext 空转
        isDeactivated.value = true
        wasAutoplayRunningBeforeDeactivate = autoplayTimer !== null
        stopAutoplay()
    })

    onActivated(() => {
        // 重新激活时恢复：停用前在运行、或停用期间 autoplay 被外部开启（watcher 被 isDeactivated 拦截
        // 未启动定时器）都重启——startAutoplay 内部复核 autoplay / reduced / delay 条件
        isDeactivated.value = false
        if (wasAutoplayRunningBeforeDeactivate || toValue(options.autoplay)) {
            startAutoplay()
        }
    })

    onUnmounted(() => {
        stopAutoplay()
        if (cachedApi) {
            cachedApi.off('init', onInit)
            cachedApi.off('select', onSelect)
            cachedApi.off('reInit', onInit)
        }
    })

    return {
        emblaRef,
        selectedIndex: readonly(selectedIndex),
        scrollSnaps: readonly(scrollSnaps),
        canScrollPrev,
        canScrollNext,
        scrollPrev,
        scrollNext,
        scrollTo,
        startAutoplay,
        stopAutoplay,
    }
}
