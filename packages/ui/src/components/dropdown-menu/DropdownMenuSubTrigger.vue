<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuSubTrigger as DropdownMenuSubTriggerPrimitive } from 'reka-ui'
import { ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { dropdownMenuItemVariants } from './dropdown-menu-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

interface DropdownMenuSubTriggerProps {
    inset?: boolean
    disabled?: boolean
    dataTone?: 'danger'
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<DropdownMenuSubTriggerProps>(), {
    inset: false,
    dataTone: undefined,
    disabled: false,
    class: undefined,
    iconSize: 'md',
})

const classes = computed(() =>
    cn(
        dropdownMenuItemVariants({
            inset: props.inset,
            tone: props.dataTone === 'danger' ? 'danger' : 'default',
        }),
        props.class
    )
)

const iconClasses = computed(() =>
    cn('ml-auto shrink-0', iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <DropdownMenuSubTriggerPrimitive :class="classes" :disabled="disabled" :data-tone="props.dataTone">
        <slot />
        <ChevronRight :class="iconClasses" />
    </DropdownMenuSubTriggerPrimitive>
</template>
