import { ref, computed, onUnmounted, toValue, type MaybeRefOrGetter } from 'vue'
import { DEFAULT_AUTOPLAY_INTERVAL_MS } from '../lib/defaults'
import { useCarousel, type UseCarouselOptions } from './useCarousel'

const DEFAULT_PROGRESS_INTERVAL = 50

export interface UseCarouselEnhancedOptions extends UseCarouselOptions {
    /** 是否启用进度追踪（默认 false） */
    trackProgress?: MaybeRefOrGetter<boolean | undefined>
    /** 进度更新间隔（默认 50ms） */
    progressInterval?: MaybeRefOrGetter<number | undefined>
}

export function useCarouselEnhanced(options: UseCarouselEnhancedOptions = {}) {
    // 复用基础 composable
    const carousel = useCarousel(options)

    // 增强功能：进度追踪
    const autoplayProgress = ref(0)
    let progressTimer: ReturnType<typeof setInterval> | null = null

    const progressUpdateInterval = computed(() =>
        toValue(options.progressInterval) ?? DEFAULT_PROGRESS_INTERVAL
    )

    function startProgressTimer() {
        stopProgressTimer()
        if (!toValue(options.trackProgress)) return

        const delay = toValue(options.autoplayDelay) ?? DEFAULT_AUTOPLAY_INTERVAL_MS
        const interval = progressUpdateInterval.value
        const steps = delay / interval

        progressTimer = setInterval(() => {
            autoplayProgress.value += 100 / steps
            if (autoplayProgress.value >= 100) {
                autoplayProgress.value = 0
            }
        }, interval)
    }

    function stopProgressTimer() {
        if (progressTimer) {
            clearInterval(progressTimer)
            progressTimer = null
        }
        autoplayProgress.value = 0
    }

    // 增强版自动播放控制（集成进度追踪）
    function startAutoplay() {
        carousel.startAutoplay()
        startProgressTimer()
    }

    function stopAutoplay() {
        carousel.stopAutoplay()
        stopProgressTimer()
    }

    onUnmounted(() => {
        stopProgressTimer()
    })

    return {
        // 基础功能（来自 useCarousel）
        emblaRef: carousel.emblaRef,
        selectedIndex: carousel.selectedIndex,
        scrollSnaps: carousel.scrollSnaps,
        canScrollPrev: carousel.canScrollPrev,
        canScrollNext: carousel.canScrollNext,
        scrollPrev: carousel.scrollPrev,
        scrollNext: carousel.scrollNext,
        scrollTo: carousel.scrollTo,

        // 增强功能
        autoplayProgress,
        startAutoplay,
        stopAutoplay,
    }
}
