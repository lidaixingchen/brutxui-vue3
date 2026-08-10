import { computed, onUnmounted, readonly, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { DEFAULT_AUTOPLAY_INTERVAL_MS } from '../lib/defaults'
import { useCarousel, type UseCarouselOptions } from './useCarousel'
import { useReducedMotion } from './useReducedMotion'

const DEFAULT_PROGRESS_INTERVAL = 50

export interface UseCarouselEnhancedOptions extends UseCarouselOptions {
    /** 是否启用进度追踪（默认 false） */
    trackProgress?: MaybeRefOrGetter<boolean | undefined>
    /** 进度更新间隔（默认 50ms） */
    progressInterval?: MaybeRefOrGetter<number | undefined>
}

export function useCarouselEnhanced(options: UseCarouselEnhancedOptions = {}) {
    // 进度状态与计时器函数必须在 useCarousel 之前声明：
    // useCarousel 可能在 setup 阶段同步触发 onAutoplayChange/onAutoplayDelayChange 回调，
    // 若这些回调依赖后声明的 let/const 变量会因 TDZ 抛出 ReferenceError，
    // 消除对生命周期时序的隐式依赖
    const prefersReducedMotion = useReducedMotion()
    const autoplayProgress = ref(0)
    let progressTimer: ReturnType<typeof setInterval> | null = null

    const progressUpdateInterval = computed(() =>
        toValue(options.progressInterval) ?? DEFAULT_PROGRESS_INTERVAL
    )

    function startProgressTimer() {
        stopProgressTimer()
        if (!toValue(options.trackProgress)) return
        // 是否真的在自动播放由 useCarousel 的 onAutoplayChange 回调语义保证：
        // 该回调仅在自动播放真正启动/停止时触发（autoplay 开启且非 reduced motion），
        // 手动 startAutoplay 路径由下方增强版控制中的显式判断兜底，
        // 不再读取静态配置 options.autoplay（与手动启停的 API 语义不符）
        if (prefersReducedMotion.value) return

        const delay = toValue(options.autoplayDelay) ?? DEFAULT_AUTOPLAY_INTERVAL_MS
        const interval = progressUpdateInterval.value
        // delay/interval 非法（<= 0）时提前返回，避免除零与 Infinity/NaN
        if (interval <= 0 || delay <= 0) return
        const steps = Math.max(1, Math.round(delay / interval))

        // 基于 tick 计数计算进度：避免 delay/interval 非整数时浮点累加（100/steps 反复相加）
        // 长期停在 99.99… 不满足 >= 100 而无法复位，或提前越过 100；
        // 同时保证进度复位与实际轮播切换同步
        let tick = 0
        progressTimer = setInterval(() => {
            tick += 1
            if (tick >= steps) {
                // 本 tick 完成一个进度循环：显示满格（轮播切换瞬间），下一 tick 重新爬升。
                // 覆盖 steps=1 退化（delay≈interval 时取模恒 0 导致进度不显示）
                tick = 0
                autoplayProgress.value = 100
            } else {
                autoplayProgress.value = (tick / steps) * 100
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

    // 复用基础 composable，通过回调同步进度条
    const carousel = useCarousel({
        ...options,
        onAutoplayChange: (enabled) => {
            if (enabled) {
                startProgressTimer()
            } else {
                stopProgressTimer()
            }
            options.onAutoplayChange?.(enabled)
        },
        onAutoplayDelayChange: () => {
            startProgressTimer()
            options.onAutoplayDelayChange?.()
        },
    })

    // 增强版自动播放控制（集成进度追踪）
    function startAutoplay() {
        carousel.startAutoplay()
        // 配置允许自动播放时启动进度追踪：carousel.startAutoplay 内部同样受该配置约束，
        // 避免 autoplay=false 时"手动启动"出现轮播未动而进度条空转的假象；
        // 运行时启停（watch / onAutoplayChange 回调）由回调路径同步
        if (toValue(options.autoplay) === true) startProgressTimer()
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
        autoplayProgress: readonly(autoplayProgress),
        startAutoplay,
        stopAutoplay,
    }
}
