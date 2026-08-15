<script setup lang="ts">
import { computed } from 'vue'
import {
    DropdownMenuCheckboxItem as DropdownMenuCheckboxItemPrimitive,
    DropdownMenuItemIndicator as DropdownMenuItemIndicatorPrimitive,
} from 'reka-ui'
import { Check, Minus } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { dropdownMenuItemVariants } from './dropdown-menu-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

interface DropdownMenuCheckboxItemProps {
    modelValue?: boolean | 'indeterminate'
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<DropdownMenuCheckboxItemProps>(), {
    modelValue: undefined,
    class: undefined,
    iconSize: 'md',
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean | 'indeterminate']
}>()

const isIndeterminate = computed(() => props.modelValue === 'indeterminate')

const classes = computed(() =>
    cn(dropdownMenuItemVariants(), 'pl-8', props.class)
)

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <DropdownMenuCheckboxItemPrimitive :checked="modelValue" :class="classes" @update:checked="emit('update:modelValue', $event)">
        <span class="absolute left-2 flex h-4 w-4 items-center justify-center" aria-hidden="true">
            <DropdownMenuItemIndicatorPrimitive>
                <Minus v-if="isIndeterminate" :class="iconClasses" />
                <Check v-else :class="iconClasses" />
            </DropdownMenuItemIndicatorPrimitive>
        </span>
        <slot />
    </DropdownMenuCheckboxItemPrimitive>
</template>
