<script setup lang="ts">
import { computed, type ComputedRef } from 'vue';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { cn } from '@/lib/utils';
import { carouselRootVariants, carouselButtonVariants } from './carousel-variants';
import { useLocale } from '@/composables/useLocale';
import { useCarousel, DEFAULT_AUTOPLAY_DELAY } from '@/composables/useCarousel';

const { t } = useLocale();

interface CarouselProps {
    loop?: boolean;
    autoplay?: boolean;
    autoplayDelay?: number;
    showArrows?: boolean;
    showDots?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'full' | 'default';
    class?: string;
}

const props = withDefaults(defineProps<CarouselProps>(), {
    loop: false,
    autoplay: false,
    autoplayDelay: DEFAULT_AUTOPLAY_DELAY,
    showArrows: true,
    showDots: true,
    size: 'default',
    class: undefined,
});

// @ts-expect-error vue-tsc does not recognize string-based template ref "emblaRef" as a usage of the destructured variable, causing TS6133.
const { emblaRef, selectedIndex, scrollSnaps, canScrollPrev, canScrollNext, scrollPrev, scrollNext, scrollTo, startAutoplay, stopAutoplay } = useCarousel({
    loop: () => props.loop,
    autoplay: () => props.autoplay,
    autoplayDelay: () => props.autoplayDelay,
});

const rootClass = computed(() =>
    cn(carouselRootVariants({ size: props.size }), props.class)
);

const prevButtonClass = computed(() =>
    cn(carouselButtonVariants({ direction: 'prev' }))
);

const nextButtonClass = computed(() =>
    cn(carouselButtonVariants({ direction: 'next' }))
);

const dotActiveClasses = computed(() =>
    cn(
        'w-3 h-3 border-3 border-brutal rounded-brutal cursor-pointer transition-all duration-150',
        'bg-brutal-primary shadow-brutal',
        'hover:shadow-brutal-lg hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'
    )
)

const dotInactiveClasses = computed(() =>
    cn(
        'w-3 h-3 border-3 border-brutal rounded-brutal cursor-pointer transition-all duration-150',
        'bg-brutal-bg hover:bg-brutal-muted',
        'hover:shadow-brutal hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none'
    )
);

const exposedSelectedIndex: ComputedRef<number> = computed(() => selectedIndex.value);

defineExpose({
    scrollPrev,
    scrollNext,
    scrollTo,
    selectedIndex: exposedSelectedIndex,
    canScrollPrev,
    canScrollNext,
});
</script>

<template>
    <div :class="rootClass" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
        <div ref="emblaRef" class="overflow-hidden h-full">
            <div class="flex h-full">
                <slot />
            </div>
        </div>

        <button
            v-if="showArrows"
            type="button"
            :class="prevButtonClass"
            :disabled="!canScrollPrev"
            :aria-label="t('carousel.previousSlide')"
            @click="scrollPrev"
        >
            <ChevronLeft class="w-5 h-5" />
        </button>

        <button
            v-if="showArrows"
            type="button"
            :class="nextButtonClass"
            :disabled="!canScrollNext"
            :aria-label="t('carousel.nextSlide')"
            @click="scrollNext"
        >
            <ChevronRight class="w-5 h-5" />
        </button>

        <div
            v-if="showDots && scrollSnaps.length > 1"
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
    </div>
</template>
