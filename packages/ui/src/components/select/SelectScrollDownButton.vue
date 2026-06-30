<script setup lang="ts">
import { computed } from 'vue'
import { SelectScrollDownButton as SelectScrollDownButtonPrimitive } from 'reka-ui'
import { ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

interface SelectScrollDownButtonProps {
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<SelectScrollDownButtonProps>(), {
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
    <SelectScrollDownButtonPrimitive :class="classes">
        <ChevronDown :class="iconClasses" />
    </SelectScrollDownButtonPrimitive>
</template>
