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
    viewportClass?: string
}

const props = withDefaults(defineProps<ScrollAreaProps>(), {
    variant: 'default',
    size: 'default',
    class: undefined,
    viewportClass: undefined,
})

const classes = computed(() =>
    cn(scrollAreaRootVariants(), props.class)
)

const viewportClasses = computed(() =>
    cn('h-full w-full rounded-[inherit]', props.viewportClass)
)
</script>

<template>
    <ScrollAreaRootPrimitive :class="classes">
        <ScrollAreaViewportPrimitive :class="viewportClasses">
            <slot />
        </ScrollAreaViewportPrimitive>
        <ScrollBar :variant="variant" :size="size" />
        <ScrollAreaCornerPrimitive />
    </ScrollAreaRootPrimitive>
</template>
