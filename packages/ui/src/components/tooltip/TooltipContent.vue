<script setup lang="ts">
import { computed } from 'vue'
import { TooltipPortal, TooltipContent as TooltipContentPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { floatingContentSideOffsets } from '@/lib/floating-content-variants'
import { tooltipContentVariants } from './tooltip-variants'

defineOptions({ inheritAttrs: false })

interface TooltipContentProps {
    sideOffset?: number
    class?: string
}

const props = withDefaults(defineProps<TooltipContentProps>(), {
    sideOffset: floatingContentSideOffsets.tooltip,
    class: undefined,
})

const classes = computed(() =>
    cn(tooltipContentVariants(), props.class)
)
</script>

<template>
    <TooltipPortal>
        <TooltipContentPrimitive v-bind="$attrs" :side-offset="sideOffset" :class="classes">
            <slot />
        </TooltipContentPrimitive>
    </TooltipPortal>
</template>
