<script setup lang="ts">
import { computed } from 'vue'
import {
    DropdownMenuRadioItem as DropdownMenuRadioItemPrimitive,
    DropdownMenuItemIndicator as DropdownMenuItemIndicatorPrimitive,
} from 'reka-ui'
import { Circle } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { dropdownMenuItemVariants } from './dropdown-menu-variants'

interface DropdownMenuRadioItemProps {
    value: string
    dataTone?: 'danger'
    class?: string
}

const props = defineProps<DropdownMenuRadioItemProps>()

const classes = computed(() =>
    cn(
        dropdownMenuItemVariants({
            tone: props.dataTone === 'danger' ? 'danger' : 'default',
        }),
        'pl-8',
        props.class
    )
)
</script>

<template>
    <DropdownMenuRadioItemPrimitive :value="value" :class="classes" :data-tone="props.dataTone">
        <span class="absolute left-2 flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
            <DropdownMenuItemIndicatorPrimitive>
                <Circle class="h-2 w-2 fill-current" />
            </DropdownMenuItemIndicatorPrimitive>
        </span>
        <slot />
    </DropdownMenuRadioItemPrimitive>
</template>
