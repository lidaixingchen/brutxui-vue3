<script setup lang="ts">
import { computed, type ComputedRef } from 'vue';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { cn } from '@/lib/utils';
import { carouselRootVariants } from './carousel-variants';
import { dotActiveClasses, dotInactiveClasses, prevButtonClasses, nextButtonClasses } from './carousel-shared';
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
            :class="prevButtonClasses"
            :disabled="!canScrollPrev"
            :aria-label="t('carousel.previousSlide')"
            @click="scrollPrev"
        >
            <ChevronLeft class="w-5 h-5" />
        </button>

        <button
            v-if="showArrows"
            type="button"
            :class="nextButtonClasses"
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