<script setup lang="ts">
import { computed } from 'vue'
import {
    DropdownMenuCheckboxItem as DropdownMenuCheckboxItemPrimitive,
    DropdownMenuItemIndicator as DropdownMenuItemIndicatorPrimitive,
} from 'reka-ui'
import { Check } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { dropdownMenuItemVariants } from './dropdown-menu-variants'

interface DropdownMenuCheckboxItemProps {
    modelValue?: boolean | 'indeterminate'
    class?: string
}

const props = defineProps<DropdownMenuCheckboxItemProps>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean | 'indeterminate']
}>()

const classes = computed(() =>
    cn(dropdownMenuItemVariants(), 'pl-8', props.class)
)
</script>

<template>
    <DropdownMenuCheckboxItemPrimitive :model-value="modelValue" :class="classes" @update:model-value="emit('update:modelValue', $event)">
        <span class="absolute left-2 flex h-4 w-4 items-center justify-center">
            <DropdownMenuItemIndicatorPrimitive>
                <Check class="h-4 w-4 stroke-[3]" />
            </DropdownMenuItemIndicatorPrimitive>
        </span>
        <slot />
    </DropdownMenuCheckboxItemPrimitive>
</template>
