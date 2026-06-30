<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuSubContent as DropdownMenuSubContentPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { dropdownMenuSubContentVariants } from './dropdown-menu-variants'

interface DropdownMenuSubContentProps {
    class?: string
}

const props = defineProps<DropdownMenuSubContentProps>()

const classes = computed(() =>
    cn(
        dropdownMenuSubContentVariants(),
        props.class
    )
)
</script>

<template>
    <DropdownMenuSubContentPrimitive :class="classes">
        <slot />
    </DropdownMenuSubContentPrimitive>
</template>
