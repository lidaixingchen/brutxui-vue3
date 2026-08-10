import { ref, computed, onMounted, onUnmounted, watch, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
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
}

export interface UseCarouselReturn {
    emblaRef: Ref<HTMLElement | undefined>
    selectedIndex: Ref<number>
    scrollSnaps: Ref<number[]>
    canScrollPrev: ComputedRef<boolean>
    canScrollNext: ComputedRef<boolean>
    scrollPrev: () => void
    scrollNext: () => void
    scrollTo: (index: number) => void
    startAutoplay: () => void
    stopAutoplay: () => void
}

export function useCarousel(options: UseCarouselOptions = {}): UseCarouselReturn {
    const prefersReducedMotion = useReducedMotion()

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: toValue(options.loop) ?? false })

    const selectedIndex = ref(0)
    const scrollSnaps = ref<number[]>([])
    let autoplayTimer: ReturnType<typeof setInterval> | null = null

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

    function startAutoplay() {
        stopAutoplay()
        if (!toValue(options.autoplay) || prefersReducedMotion.value) return
        autoplayTimer = setInterval(() => {
            if (emblaApi.value && scrollSnaps.value.length > 0) {
                // 用 canScrollNext() 同步判断是否到达末尾：selectedIndex 由 'select' 事件异步更新，
                // 动画时长大于 autoplayDelay 时定时器触发时索引可能尚未更新到末页，
                // 会导致末页重复调用 scrollNext（空转）或无法及时停止
                if (!(toValue(options.loop) ?? false) && !emblaApi.value.canScrollNext()) {
                    stopAutoplay()
                } else {
                    emblaApi.value.scrollNext()
                }
            }
        }, toValue(options.autoplayDelay) ?? DEFAULT_AUTOPLAY_DELAY)
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
        startAutoplay()
        if (toValue(options.autoplay) && !prefersReducedMotion.value) {
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
            // prefersReducedMotion 时 startAutoplay 直接 return（定时器并未启动），
            // 不应上报启用，避免外部回调收到与实际启停状态不一致的通知
            if (prefersReducedMotion.value) return
            startAutoplay()
            options.onAutoplayChange?.(true)
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
                startAutoplay()
                options.onAutoplayChange?.(true)
            }
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
        selectedIndex,
        scrollSnaps,
        canScrollPrev,
        canScrollNext,
        scrollPrev,
        scrollNext,
        scrollTo,
        startAutoplay,
        stopAutoplay,
    }
}
