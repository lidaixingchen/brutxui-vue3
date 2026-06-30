<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuItem as DropdownMenuItemPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { dropdownMenuItemVariants } from './dropdown-menu-variants'

interface DropdownMenuItemProps {
    inset?: boolean
    class?: string
}

const props = defineProps<DropdownMenuItemProps>()

const classes = computed(() =>
    cn(dropdownMenuItemVariants(), props.inset && 'pl-8', props.class)
)
</script>

<template>
    <DropdownMenuItemPrimitive :class="classes">
        <slot />
    </DropdownMenuItemPrimitive>
</template>
