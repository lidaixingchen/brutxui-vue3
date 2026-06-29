<script setup lang="ts">
import type { TooltipProviderProps } from 'reka-ui'
import { TooltipProvider as TooltipProviderPrimitive, useForwardProps } from 'reka-ui'

const DEFAULT_DELAY_DURATION = 400

const props = withDefaults(defineProps<TooltipProviderProps>(), {
    delayDuration: DEFAULT_DELAY_DURATION,
})

const forwardedProps = useForwardProps(props)
</script>

<template>
    <TooltipProviderPrimitive v-bind="forwardedProps">
        <slot />
    </TooltipProviderPrimitive>
</template>
