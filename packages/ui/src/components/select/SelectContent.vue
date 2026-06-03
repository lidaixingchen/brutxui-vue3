<script setup lang="ts">
import { computed } from 'vue'
import {
    SelectPortal as SelectPortalPrimitive,
    SelectContent as SelectContentPrimitive,
    SelectViewport as SelectViewportPrimitive,
} from 'reka-ui'
import { cn } from '../../lib/utils'
import SelectScrollUpButton from './SelectScrollUpButton.vue'
import SelectScrollDownButton from './SelectScrollDownButton.vue'
import { selectContentVariants } from './select-variants'

interface SelectContentProps {
    position?: 'popper' | 'item-aligned'
    class?: string
}

const props = withDefaults(defineProps<SelectContentProps>(), {
    position: 'popper',
    class: undefined,
})

const contentClasses = computed(() =>
    cn(
        selectContentVariants(),
        props.position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        props.class
    )
)

const viewportClasses = computed(() =>
    cn(
        'p-1',
        props.position === 'popper' &&
            'h-[var(--reka-select-trigger-height)] w-full min-w-[var(--reka-select-trigger-width)]'
    )
)
</script>

<template>
    <SelectPortalPrimitive>
        <SelectContentPrimitive :class="contentClasses" :position="position">
            <SelectScrollUpButton />
            <SelectViewportPrimitive :class="viewportClasses">
                <slot />
            </SelectViewportPrimitive>
            <SelectScrollDownButton />
        </SelectContentPrimitive>
    </SelectPortalPrimitive>
</template>
