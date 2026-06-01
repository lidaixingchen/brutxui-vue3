<script setup lang="ts">
import { computed } from 'vue'
import {
    DropdownMenuCheckboxItem as DropdownMenuCheckboxItemPrimitive,
    DropdownMenuItemIndicator as DropdownMenuItemIndicatorPrimitive,
} from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { cn } from '../lib/utils'

interface DropdownMenuCheckboxItemProps {
    checked?: boolean | 'indeterminate'
    class?: string
}

const props = defineProps<DropdownMenuCheckboxItemProps>()

const classes = computed(() =>
    cn(
        'relative flex cursor-pointer select-none items-center py-2 pl-8 pr-3',
        'font-bold outline-none transition-colors',
        'focus:bg-brutal-accent focus:text-brutal-fg',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class
    )
)
</script>

<template>
    <DropdownMenuCheckboxItemPrimitive :checked="checked" :class="classes">
        <span class="absolute left-2 flex h-4 w-4 items-center justify-center">
            <DropdownMenuItemIndicatorPrimitive>
                <Check class="h-4 w-4 stroke-[3]" />
            </DropdownMenuItemIndicatorPrimitive>
        </span>
        <slot />
    </DropdownMenuCheckboxItemPrimitive>
</template>
