<script setup lang="ts">
import { computed } from 'vue'
import {
    PopoverPortal as PopoverPortalPrimitive,
    PopoverContent as PopoverContentPrimitive,
} from 'reka-ui'
import { cn } from '../../lib/utils'
import { popoverContentVariants } from './popover-variants'

const DEFAULT_SIDE_OFFSET = 8

interface PopoverContentProps {
    align?: 'center' | 'start' | 'end'
    sideOffset?: number
    class?: string
}

const props = withDefaults(defineProps<PopoverContentProps>(), {
    align: 'center',
    sideOffset: DEFAULT_SIDE_OFFSET,
    class: undefined,
})

const classes = computed(() =>
    cn(popoverContentVariants(), props.class)
)
</script>

<template>
    <PopoverPortalPrimitive>
        <PopoverContentPrimitive :align="align" :side-offset="sideOffset" :class="classes">
            <slot />
        </PopoverContentPrimitive>
    </PopoverPortalPrimitive>
</template>
