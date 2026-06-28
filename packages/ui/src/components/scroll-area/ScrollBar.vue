<script setup lang="ts">
import { computed } from 'vue'
import {
    ScrollAreaScrollbar as ScrollAreaScrollbarPrimitive,
    ScrollAreaThumb as ScrollAreaThumbPrimitive,
} from 'reka-ui'
import { cn } from '../../lib/utils'
import { scrollAreaScrollbarVariants, scrollAreaThumbVariants } from './scroll-area-variants'

interface ScrollBarProps {
    orientation?: 'vertical' | 'horizontal'
    class?: string
}

const props = withDefaults(defineProps<ScrollBarProps>(), {
    orientation: 'vertical',
    class: undefined,
})

const classes = computed(() =>
    cn(scrollAreaScrollbarVariants({ orientation: props.orientation }), props.class)
)

const thumbClasses = computed(() => scrollAreaThumbVariants())
</script>

<template>
    <ScrollAreaScrollbarPrimitive :orientation="orientation" :class="classes">
        <ScrollAreaThumbPrimitive :class="thumbClasses" />
    </ScrollAreaScrollbarPrimitive>
</template>
