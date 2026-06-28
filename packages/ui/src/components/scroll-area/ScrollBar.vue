<script setup lang="ts">
import { computed } from 'vue'
import {
    ScrollAreaScrollbar as ScrollAreaScrollbarPrimitive,
    ScrollAreaThumb as ScrollAreaThumbPrimitive,
} from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { scrollAreaScrollbarVariants, scrollAreaThumbVariants } from './scroll-area-variants'

type ScrollAreaScrollbarVariantProps = VariantProps<typeof scrollAreaScrollbarVariants>

interface ScrollBarProps {
    orientation?: 'vertical' | 'horizontal'
    variant?: NonNullable<ScrollAreaScrollbarVariantProps['variant']>
    size?: NonNullable<ScrollAreaScrollbarVariantProps['size']>
    class?: string
}

const props = withDefaults(defineProps<ScrollBarProps>(), {
    orientation: 'vertical',
    variant: 'default',
    size: 'default',
    class: undefined,
})

const classes = computed(() =>
    cn(
        scrollAreaScrollbarVariants({
            orientation: props.orientation,
            variant: props.variant,
            size: props.size,
        }),
        props.class,
    ),
)

const thumbClasses = computed(() =>
    cn(scrollAreaThumbVariants({ variant: props.variant }))
)
</script>

<template>
    <ScrollAreaScrollbarPrimitive :orientation="orientation" :class="classes">
        <ScrollAreaThumbPrimitive :class="thumbClasses" />
    </ScrollAreaScrollbarPrimitive>
</template>
