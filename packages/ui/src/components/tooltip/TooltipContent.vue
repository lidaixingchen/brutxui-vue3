<script setup lang="ts">
import { computed } from 'vue'
import type { TooltipContentProps as RekaTooltipContentProps } from 'reka-ui'
import { TooltipPortal, TooltipContent as TooltipContentPrimitive, useForwardProps, injectTooltipProviderContext, injectTooltipRootContext } from 'reka-ui'
import { cn } from '@/lib/utils'
import { floatingContentSideOffsets } from '@/lib/floating-content-variants'
import { tooltipContentVariants } from './tooltip-variants'
import { useFloatingOverlay } from '@/lib/overlay-layer'

defineOptions({ inheritAttrs: false })

interface TooltipContentProps extends RekaTooltipContentProps {
    class?: string
    to?: string | HTMLElement
}

const props = withDefaults(defineProps<TooltipContentProps>(), {
    class: undefined,
    to: undefined,
})

const delegatedProps = computed(() => {
    const { class: _class, to: _to, sideOffset: _sideOffset, collisionPadding: _collisionPadding, ...delegated } = props
    return delegated
})

const forwarded = useForwardProps(delegatedProps)
const tooltipProvider = injectTooltipProviderContext(null)
const positioningProps = computed(() => {
    const providerPosition = tooltipProvider?.content.value
    const fallback = floatingContentSideOffsets.tooltip
    // 保持定位属性始终存在，使原语的属性转发可跟踪后续更新。
    return {
        sideOffset: props.sideOffset ?? providerPosition?.sideOffset ?? fallback,
        collisionPadding: props.collisionPadding ?? providerPosition?.collisionPadding ?? fallback,
    }
})
const tooltipContext = injectTooltipRootContext()
const { style: overlayLayerStyle, ref: floatingLayerRef } = useFloatingOverlay('tooltip', {
    anchor: () => tooltipContext.trigger.value,
    open: tooltipContext.open,
})

const classes = computed(() =>
    cn(tooltipContentVariants(), props.class)
)
</script>

<template>
    <TooltipPortal :to="to">
        <TooltipContentPrimitive
            :ref="floatingLayerRef"
            v-bind="{ ...forwarded, ...positioningProps, ...$attrs }"
            :class="classes"
            :style="[overlayLayerStyle, $attrs.style]"
        >
            <slot />
        </TooltipContentPrimitive>
    </TooltipPortal>
</template>
