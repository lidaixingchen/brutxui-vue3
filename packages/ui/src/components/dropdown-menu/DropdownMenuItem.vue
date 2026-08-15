<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuItem as DropdownMenuItemPrimitive } from 'reka-ui'
import type { DropdownMenuItemProps as DropdownMenuItemPrimitiveProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { dropdownMenuItemVariants } from './dropdown-menu-variants'

// 继承原语 props（disabled/textValue 等），获得类型提示与编译期校验
interface DropdownMenuItemProps extends DropdownMenuItemPrimitiveProps {
    inset?: boolean
    class?: string
}

const props = withDefaults(defineProps<DropdownMenuItemProps>(), {
    inset: false,
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
