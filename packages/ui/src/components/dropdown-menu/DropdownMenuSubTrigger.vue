<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuSubTrigger as DropdownMenuSubTriggerPrimitive } from 'reka-ui'
import { ChevronRight } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { dropdownMenuItemVariants } from './dropdown-menu-variants'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'

interface DropdownMenuSubTriggerProps {
    inset?: boolean
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<DropdownMenuSubTriggerProps>(), {
    inset: undefined,
    class: undefined,
    iconSize: 'default',
})

const classes = computed(() =>
    cn(
        dropdownMenuItemVariants(),
        'data-[state=open]:bg-brutal-accent data-[state=open]:text-brutal-fg',
        props.inset && 'pl-8',
        props.class
    )
)

const iconClasses = computed(() =>
    cn('ml-auto', iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <DropdownMenuSubTriggerPrimitive :class="classes">
        <slot />
        <ChevronRight :class="iconClasses" />
    </DropdownMenuSubTriggerPrimitive>
</template>
