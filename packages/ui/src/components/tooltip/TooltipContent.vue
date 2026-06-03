<script setup lang="ts">
import { computed } from 'vue'
import { TooltipPortal, TooltipContent as TooltipContentPrimitive } from 'reka-ui'
import { cn } from '../../lib/utils'
import { tooltipContentVariants } from './tooltip-variants'

const DEFAULT_SIDE_OFFSET = 6

interface TooltipContentProps {
    sideOffset?: number
    class?: string
}

const props = withDefaults(defineProps<TooltipContentProps>(), {
    sideOffset: DEFAULT_SIDE_OFFSET,
    class: undefined,
})

const classes = computed(() =>
    cn(tooltipContentVariants(), props.class)
)
</script>

<template>
    <TooltipPortal>
        <TooltipContentPrimitive :side-offset="sideOffset" :class="classes">
            <slot />
        </TooltipContentPrimitive>
    </TooltipPortal>
</template>
