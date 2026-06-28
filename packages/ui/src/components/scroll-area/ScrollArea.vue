<script setup lang="ts">
import { computed } from 'vue'
import {
    ScrollAreaRoot as ScrollAreaRootPrimitive,
    ScrollAreaViewport as ScrollAreaViewportPrimitive,
    ScrollAreaCorner as ScrollAreaCornerPrimitive,
} from 'reka-ui'
import { cn } from '../../lib/utils'
import { scrollAreaRootVariants } from './scroll-area-variants'
import ScrollBar from './ScrollBar.vue'

interface ScrollAreaProps {
    class?: string
}

const props = defineProps<ScrollAreaProps>()

const classes = computed(() =>
    cn(scrollAreaRootVariants(), props.class)
)
</script>

<template>
    <ScrollAreaRootPrimitive :class="classes">
        <ScrollAreaViewportPrimitive class="h-full w-full rounded-[inherit]">
            <slot />
        </ScrollAreaViewportPrimitive>
        <ScrollBar />
        <ScrollAreaCornerPrimitive />
    </ScrollAreaRootPrimitive>
</template>
