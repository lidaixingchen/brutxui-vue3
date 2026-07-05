<script setup lang="ts">
import { type PopoverRootProps, type PopoverRootEmits, PopoverRoot as PopoverRootPrimitive, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<PopoverRootProps>()
const emit = defineEmits<PopoverRootEmits>()

const forwardedProps = useForwardPropsEmits(props, emit)
</script>

<template>
    <PopoverRootPrimitive v-bind="forwardedProps">
        <slot />
    </PopoverRootPrimitive>
</template>
