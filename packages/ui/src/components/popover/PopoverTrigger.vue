<script setup lang="ts">
import type { PopoverTriggerProps } from 'reka-ui'
import { PopoverTrigger as PopoverTriggerPrimitive } from 'reka-ui'

const props = defineProps<PopoverTriggerProps>()
</script>

<template>
    <PopoverTriggerPrimitive v-bind="props">
        <slot />
    </PopoverTriggerPrimitive>
</template>
