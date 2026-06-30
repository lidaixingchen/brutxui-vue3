<script setup lang="ts">
import type { PopoverRootProps } from 'reka-ui'
import { PopoverRoot as PopoverRootPrimitive, useForwardProps } from 'reka-ui'

const props = defineProps<PopoverRootProps>()

const forwardedProps = useForwardProps(props)
</script>

<template>
    <PopoverRootPrimitive v-bind="forwardedProps">
        <slot />
    </PopoverRootPrimitive>
</template>
