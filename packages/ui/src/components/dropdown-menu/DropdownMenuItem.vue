<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuItem as DropdownMenuItemPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { dropdownMenuItemVariants } from './dropdown-menu-variants'

interface DropdownMenuItemProps {
    inset?: boolean
    /** 显式声明并转发原语 props；其余原语 props（closeOnSelect/as/asChild 等）经 attrs 透传 */
    disabled?: boolean
    textValue?: string
    class?: string
}

const props = withDefaults(defineProps<DropdownMenuItemProps>(), {
    inset: false,
    disabled: false,
    textValue: undefined,
    class: undefined,
})

const classes = computed(() =>
    cn(dropdownMenuItemVariants({ inset: props.inset }), props.class)
)
</script>

<template>
    <DropdownMenuItemPrimitive :class="classes" :disabled="disabled" :text-value="textValue">
        <slot />
    </DropdownMenuItemPrimitive>
</template>
