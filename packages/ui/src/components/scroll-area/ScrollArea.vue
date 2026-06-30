<script setup lang="ts">
import { computed } from 'vue'
import {
    ScrollAreaRoot as ScrollAreaRootPrimitive,
    ScrollAreaViewport as ScrollAreaViewportPrimitive,
    ScrollAreaCorner as ScrollAreaCornerPrimitive,
} from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { scrollAreaRootVariants, scrollAreaScrollbarVariants } from './scroll-area-variants'
import ScrollBar from './ScrollBar.vue'

type ScrollAreaVariantProps = VariantProps<typeof scrollAreaScrollbarVariants>

interface ScrollAreaProps {
    variant?: NonNullable<ScrollAreaVariantProps['variant']>
    size?: NonNullable<ScrollAreaVariantProps['size']>
    class?: string
}

const props = withDefaults(defineProps<ScrollAreaProps>(), {
    variant: 'default',
    size: 'default',
    class: undefined,
})

const classes = computed(() =>
    cn(scrollAreaRootVariants(), props.class)
)
</script>

<template>
    <ScrollAreaRootPrimitive :class="classes">
        <ScrollAreaViewportPrimitive class="h-full w-full rounded-[inherit]">
            <slot />
        </ScrollAreaViewportPrimitive>
        <ScrollBar :variant="variant" :size="size" />
        <ScrollAreaCornerPrimitive />
    </ScrollAreaRootPrimitive>
</template>
