<script setup lang="ts">
import { computed, ref } from 'vue'
import Carousel from './Carousel.vue'
import type { CarouselEnhancedProps } from './types'

const props = defineProps<CarouselEnhancedProps>()

const carouselRef = ref<InstanceType<typeof Carousel> | null>(null)

const selectedIndex = computed(() => carouselRef.value?.selectedIndex ?? 0)
const canScrollPrev = computed(() => carouselRef.value?.canScrollPrev ?? false)
const canScrollNext = computed(() => carouselRef.value?.canScrollNext ?? false)

function scrollPrev() {
    carouselRef.value?.scrollPrev()
}

function scrollNext() {
    carouselRef.value?.scrollNext()
}

function scrollTo(index: number) {
    carouselRef.value?.scrollTo(index)
}

function startAutoplay() {
    carouselRef.value?.startAutoplay()
}

function stopAutoplay() {
    carouselRef.value?.stopAutoplay()
}

defineExpose({
    scrollPrev,
    scrollNext,
    scrollTo,
    selectedIndex,
    canScrollPrev,
    canScrollNext,
    startAutoplay,
    stopAutoplay,
})
</script>

<template>
    <Carousel ref="carouselRef" v-bind="props">
        <slot />
        <template v-if="$slots.thumbnail" #thumbnail="{ index, scrollTo: scrollToSlide }">
            <slot name="thumbnail" :index="index" :scroll-to="scrollToSlide" />
        </template>
    </Carousel>
</template>
