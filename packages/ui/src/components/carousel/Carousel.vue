<script setup lang="ts">
import { computed, type ComputedRef } from 'vue';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { cn } from '@/lib/utils';
import { carouselRootVariants } from './carousel-variants';
import { dotActiveClasses, dotInactiveClasses, prevButtonClasses, nextButtonClasses } from './carousel-shared';
import { useLocale } from '@/composables/useLocale';
import { DEFAULT_AUTOPLAY_DELAY } from '@/composables/useCarousel';
import { useCarouselEnhanced } from '@/composables/useCarouselEnhanced';
import { brutalHoverLiftSmNoX, brutalPress } from '@/lib/brutal-interaction-variants';
import Button from '../button/Button.vue';
import type { CarouselProps } from './types';

const { t } = useLocale();

const props = withDefaults(defineProps<CarouselProps>(), {
    loop: false,
    autoplay: false,
    autoplayDelay: DEFAULT_AUTOPLAY_DELAY,
    showArrows: true,
    showDots: true,
    size: 'default',
    thumbnails: () => ({ show: false, position: 'bottom', size: 'sm', gap: 8, highlightCurrent: true }),
    autoplayIndicator: undefined,
    parallax: undefined,
    class: undefined,
});

const { emblaRef, selectedIndex, scrollSnaps, canScrollPrev, canScrollNext, scrollPrev, scrollNext, scrollTo, startAutoplay, stopAutoplay, autoplayProgress } = useCarouselEnhanced({
    loop: () => props.loop,
    autoplay: () => props.autoplay,
    autoplayDelay: () => props.autoplayDelay,
    trackProgress: () => !!props.autoplayIndicator,
});

const rootClass = computed(() =>
    cn(carouselRootVariants({ size: props.size }), props.class)
);

const thumbnailClasses = computed(() => {
    const sizeMap = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-20 h-20',
    }
    return cn(
        'border-3 border-brutal rounded-brutal cursor-pointer transition-all duration-150 overflow-hidden',
        brutalHoverLiftSmNoX,
        brutalPress,
        sizeMap[props.thumbnails?.size ?? 'sm']
    )
})

const thumbnailActiveClasses = computed(() =>
    cn(thumbnailClasses.value, 'border-brutal-primary shadow-brutal')
)

const thumbnailContainerClasses = computed(() => {
    const position = props.thumbnails?.position ?? 'bottom'
    if (position === 'left' || position === 'right') {
        return cn(
            'flex flex-col',
            position === 'left' ? 'order-first' : 'order-last'
        )
    }
    return 'flex flex-row justify-center'
})

// 消费 thumbnails.gap 配置（默认 8px，与 Tailwind gap-2 等价）
const thumbnailGapStyle = computed(() => ({ gap: `${props.thumbnails?.gap ?? 8}px` }))

const containerClasses = computed(() => {
    const position = props.thumbnails?.position ?? 'bottom'
    if (position === 'left' || position === 'right') {
        return 'flex'
    }
    return 'flex flex-col'
})

const wrapperClass = computed(() =>
    props.thumbnails?.show ? containerClasses.value : rootClass.value
)

const carouselFrameClass = computed(() =>
    props.thumbnails?.show ? rootClass.value : 'h-full'
)

const parallaxStyle = computed(() => {
    if (!props.parallax?.enabled) return undefined
    return {
        '--parallax-scale': props.parallax.scale ?? 1.1,
        // opacity 关闭时变量为 1（无过渡变化），开启时为 0，供 CSS 过渡到 1
        '--parallax-opacity': props.parallax.opacity === true ? 0 : 1,
        '--parallax-duration': `${props.parallax.duration ?? 300}ms`,
        '--parallax-easing': props.parallax.easing ?? 'ease-out',
    }
})

// 未配置 autoplayIndicator 时默认悬停暂停（与多数轮播惯例一致，属有意设计）
const shouldPauseOnHover = computed(() =>
    props.autoplayIndicator ? !!props.autoplayIndicator.pauseOnHover : true
)

// 消费 autoplayIndicator.position：progress/fraction 靠边贴边，dots 留出呼吸间距
const indicatorBarPositionClasses = computed(() =>
    props.autoplayIndicator?.position === 'bottom'
        ? 'absolute bottom-0 left-0 right-0 z-10'
        : 'absolute top-0 left-0 right-0 z-10'
)
const dotsPositionClasses = computed(() =>
    props.autoplayIndicator?.position === 'top'
        ? 'absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 z-10'
        : 'absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10'
)

function handleMouseEnter() {
    // 仅在自动播放激活时暂停：不依赖 composable 内部 autoplay 守卫（语义不清，守卫调整即失效）
    if (props.autoplay && shouldPauseOnHover.value) stopAutoplay()
}

function handleMouseLeave() {
    if (props.autoplay && shouldPauseOnHover.value) startAutoplay()
}

// 模板 ref="emblaRef" 消费该变量，vue-tsc 无法识别字符串模板 ref 的用法（TS6133 误报），
// 显式引用消除报错，替代 @ts-expect-error（避免 vue-tsc/TS 升级后该注释自身成为编译错误）
void emblaRef;

const exposedSelectedIndex: ComputedRef<number> = computed(() => selectedIndex.value);

defineExpose({
    scrollPrev,
    scrollNext,
    scrollTo,
    selectedIndex: exposedSelectedIndex,
    canScrollPrev,
    canScrollNext,
    startAutoplay,
    stopAutoplay,
});
</script>

<template>
    <div :class="wrapperClass" :style="parallaxStyle">
        <div :class="carouselFrameClass" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
            <div v-if="autoplayIndicator && autoplay" :class="indicatorBarPositionClasses">
                <div v-if="autoplayIndicator.type === 'progress'" class="h-1 bg-brutal-fg/20">
                    <div
                        class="h-full bg-brutal-primary transition-all duration-100"
                        :style="{ width: `${autoplayProgress}%` }"
                    />
                </div>
                <div
                    v-else-if="autoplayIndicator.type === 'fraction'"
                    class="absolute top-2 right-2 px-2 py-1 border-3 border-brutal rounded-brutal bg-brutal-bg text-xs font-bold"
                >
                    {{ selectedIndex + 1 }} / {{ scrollSnaps.length }}
                </div>
            </div>

            <div ref="emblaRef" class="overflow-hidden h-full">
                <div class="flex h-full">
                    <slot />
                </div>
            </div>

            <Button
                v-if="showArrows"
                type="button"
                variant="default"
                size="icon"
                :class="prevButtonClasses"
                :disabled="!canScrollPrev"
                :aria-label="t('carousel.previousSlide')"
                @click="scrollPrev"
            >
                <ChevronLeft class="w-5 h-5" />
            </Button>

            <Button
                v-if="showArrows"
                type="button"
                variant="default"
                size="icon"
                :class="nextButtonClasses"
                :disabled="!canScrollNext"
                :aria-label="t('carousel.nextSlide')"
                @click="scrollNext"
            >
                <ChevronRight class="w-5 h-5" />
            </Button>

            <div
                v-if="showDots && scrollSnaps.length > 1 && !thumbnails?.show && (autoplayIndicator?.type !== 'dots' || !autoplay)"
                class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10"
            >
                <button
                    v-for="(_, i) in scrollSnaps"
                    :key="i"
                    type="button"
                    :aria-label="t('carousel.goToSlide', { index: i + 1 })"
                    :class="i === selectedIndex ? dotActiveClasses : dotInactiveClasses"
                    @click="scrollTo(i)"
                />
            </div>

            <div
                v-if="autoplayIndicator?.type === 'dots' && autoplay && scrollSnaps.length > 1"
                :class="dotsPositionClasses"
            >
                <div
                    v-for="(_, i) in scrollSnaps"
                    :key="i"
                    class="w-2.5 h-2.5 border-3 border-brutal rounded-brutal transition-all duration-300"
                    :class="i === selectedIndex ? 'bg-brutal-primary shadow-brutal' : 'bg-brutal-bg'"
                />
            </div>
        </div>

        <div v-if="thumbnails?.show && scrollSnaps.length > 1" :class="thumbnailContainerClasses" :style="thumbnailGapStyle">
            <slot name="thumbnail" :index="selectedIndex" :scroll-to="scrollTo">
                <button
                    v-for="(_, i) in scrollSnaps"
                    :key="i"
                    type="button"
                    :class="i === selectedIndex && thumbnails?.highlightCurrent !== false ? thumbnailActiveClasses : thumbnailClasses"
                    :aria-label="t('carousel.goToSlide', { index: i + 1 })"
                    @click="scrollTo(i)"
                >
                    <div class="w-full h-full bg-brutal-muted flex items-center justify-center text-xs font-bold">
                        {{ i + 1 }}
                    </div>
                </button>
            </slot>
        </div>
    </div>
</template>
