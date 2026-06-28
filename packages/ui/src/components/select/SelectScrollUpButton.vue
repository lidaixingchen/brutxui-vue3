<script setup lang="ts">
import { computed } from 'vue'
import { SelectScrollUpButton as SelectScrollUpButtonPrimitive } from 'reka-ui'
import { ChevronUp } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'

interface SelectScrollUpButtonProps {
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<SelectScrollUpButtonProps>(), {
    class: undefined,
    iconSize: 'default',
})

const classes = computed(() =>
    cn('flex cursor-default items-center justify-center py-1 bg-brutal-bg', props.class)
)

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <SelectScrollUpButtonPrimitive :class="classes">
        <ChevronUp :class="iconClasses" />
    </SelectScrollUpButtonPrimitive>
</template>
