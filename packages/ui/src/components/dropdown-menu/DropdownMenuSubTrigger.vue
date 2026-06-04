<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuSubTrigger as DropdownMenuSubTriggerPrimitive } from 'reka-ui'
import { ChevronRight } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { dropdownMenuItemVariants } from './dropdown-menu-variants'

interface DropdownMenuSubTriggerProps {
    inset?: boolean
    class?: string
}

const props = defineProps<DropdownMenuSubTriggerProps>()

const classes = computed(() =>
    cn(
        dropdownMenuItemVariants(),
        'data-[state=open]:bg-brutal-accent data-[state=open]:text-brutal-fg',
        props.inset && 'pl-8',
        props.class
    )
)
</script>

<template>
    <DropdownMenuSubTriggerPrimitive :class="classes">
        <slot />
        <ChevronRight class="ml-auto h-4 w-4 stroke-[3]" />
    </DropdownMenuSubTriggerPrimitive>
</template>
