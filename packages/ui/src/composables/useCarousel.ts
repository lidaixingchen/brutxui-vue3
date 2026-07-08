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
                if (!(toValue(options.loop) ?? false) && selectedIndex.value === scrollSnaps.value.length - 1) {
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

    onMounted(() => {
        if (!emblaApi.value) return
        cachedApi = emblaApi.value
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
    })

    watch(() => toValue(options.autoplay), (val) => {
        if (val) {
            startAutoplay()
            options.onAutoplayChange?.(true)
        } else {
            stopAutoplay()
            options.onAutoplayChange?.(false)
        }
    })

    watch(() => toValue(options.loop), () => {
        if (emblaApi.value) emblaApi.value.reInit({ loop: toValue(options.loop) ?? false })
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
