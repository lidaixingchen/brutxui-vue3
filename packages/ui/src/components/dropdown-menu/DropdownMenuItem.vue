<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuItem as DropdownMenuItemPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { dropdownMenuItemVariants } from './dropdown-menu-variants'

interface DropdownMenuItemProps {
    inset?: boolean
    /** 显式声明并转发原语常用 props；其余原语 props（as/asChild 等）经 attrs 透传 */
    disabled?: boolean
    textValue?: string
    /** 点击后是否关闭菜单（原语 props，显式声明以获得类型提示） */
    closeOnSelect?: boolean
    class?: string
}

const props = withDefaults(defineProps<DropdownMenuItemProps>(), {
    inset: false,
    disabled: false,
    textValue: undefined,
    closeOnSelect: undefined,
    class: undefined,
})

const classes = computed(() =>
    cn(dropdownMenuItemVariants({ inset: props.inset }), props.class)
)
</script>

<template>
    <DropdownMenuItemPrimitive :class="classes" :disabled="disabled" :text-value="textValue" :close-on-select="closeOnSelect">
        <slot />
    </DropdownMenuItemPrimitive>
</template>
