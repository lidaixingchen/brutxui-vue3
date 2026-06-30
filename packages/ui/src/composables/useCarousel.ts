import { ref, computed, onMounted, onUnmounted, watch, toValue, type MaybeRefOrGetter } from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import { useReducedMotion } from './useReducedMotion'

export const DEFAULT_AUTOPLAY_DELAY = 3000

export interface UseCarouselOptions {
    loop?: MaybeRefOrGetter<boolean | undefined>
    autoplay?: MaybeRefOrGetter<boolean | undefined>
    autoplayDelay?: MaybeRefOrGetter<number | undefined>
}

export function useCarousel(options: UseCarouselOptions = {}) {
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

    onMounted(() => {
        if (!emblaApi.value) return
        emblaApi.value.on('init', onInit)
        emblaApi.value.on('select', onSelect)
        emblaApi.value.on('reInit', onInit)
        onInit()
        startAutoplay()
    })

    watch(() => toValue(options.autoplay), (val) => {
        if (val) startAutoplay()
        else stopAutoplay()
    })

    watch(() => toValue(options.loop), () => {
        if (emblaApi.value) emblaApi.value.reInit({ loop: toValue(options.loop) ?? false })
    })

    watch(() => toValue(options.autoplayDelay), () => {
        if (toValue(options.autoplay)) startAutoplay()
    })

    watch(prefersReducedMotion, (reduced) => {
        if (!emblaApi.value) return
        if (reduced) {
            stopAutoplay()
            emblaApi.value.reInit({ duration: 0 })
        } else {
            emblaApi.value.reInit({})
            if (toValue(options.autoplay)) startAutoplay()
        }
    }, { immediate: true })

    onUnmounted(() => {
        stopAutoplay()
        if (emblaApi.value) {
            emblaApi.value.off('init', onInit)
            emblaApi.value.off('select', onSelect)
            emblaApi.value.off('reInit', onInit)
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
