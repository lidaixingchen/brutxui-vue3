<script setup lang="ts">
import { computed } from 'vue'
import type { TooltipContentProps as RekaTooltipContentProps } from 'reka-ui'
import { TooltipPortal, TooltipContent as TooltipContentPrimitive, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { floatingContentSideOffsets } from '@/lib/floating-content-variants'
import { tooltipContentVariants } from './tooltip-variants'

defineOptions({ inheritAttrs: false })

interface TooltipContentProps extends RekaTooltipContentProps {
    class?: string
    to?: string | HTMLElement
}

const props = withDefaults(defineProps<TooltipContentProps>(), {
    sideOffset: floatingContentSideOffsets.tooltip,
    class: undefined,
    to: undefined,
})

const delegatedProps = computed(() => {
    const { class: _, to: __, ...delegated } = props
    return delegated
})

const forwarded = useForwardProps(delegatedProps)

const classes = computed(() =>
    cn(tooltipContentVariants(), props.class)
)
</script>

<template>
    <TooltipPortal :to="to">
        <TooltipContentPrimitive v-bind="{ ...forwarded, ...$attrs }" :class="classes">
            <slot />
        </TooltipContentPrimitive>
    </TooltipPortal>
</template>
