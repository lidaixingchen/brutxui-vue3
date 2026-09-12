<script setup lang="ts">
import { computed } from 'vue'
import type { PopoverContentProps as RekaPopoverContentProps } from 'reka-ui'
import {
    PopoverPortal as PopoverPortalPrimitive,
    PopoverContent as PopoverContentPrimitive,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { floatingContentSideOffsets } from '@/lib/floating-content-variants'
import { popoverContentVariants } from './popover-variants'

defineOptions({ inheritAttrs: false })

interface PopoverContentProps {
    align?: 'center' | 'start' | 'end'
    sideOffset?: number
    collisionPadding?: RekaPopoverContentProps['collisionPadding']
    class?: string
}

const props = withDefaults(defineProps<PopoverContentProps>(), {
    align: 'center',
    sideOffset: floatingContentSideOffsets.popover,
    collisionPadding: floatingContentSideOffsets.popover,
    class: undefined,
})

const classes = computed(() =>
    cn(popoverContentVariants(), props.class)
)
</script>

<template>
    <PopoverPortalPrimitive>
        <PopoverContentPrimitive
            v-bind="$attrs"
            :align="align"
            :side-offset="sideOffset"
            :collision-padding="collisionPadding"
            :class="classes"
        >
            <slot />
        </PopoverContentPrimitive>
    </PopoverPortalPrimitive>
</template>
