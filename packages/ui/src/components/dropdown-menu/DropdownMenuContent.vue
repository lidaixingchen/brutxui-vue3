<script setup lang="ts">
import { computed } from 'vue'
import {
    DropdownMenuPortal as DropdownMenuPortalPrimitive,
    DropdownMenuContent as DropdownMenuContentPrimitive,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { floatingContentSideOffsets } from '@/lib/floating-content-variants'
import { dropdownMenuContentVariants } from './dropdown-menu-variants'

interface DropdownMenuContentProps {
    sideOffset?: number
    class?: string
}

const props = withDefaults(defineProps<DropdownMenuContentProps>(), {
    sideOffset: floatingContentSideOffsets.dropdownMenu,
    class: undefined,
})

const classes = computed(() =>
    cn(dropdownMenuContentVariants(), props.class)
)
</script>

<template>
    <DropdownMenuPortalPrimitive>
        <DropdownMenuContentPrimitive :side-offset="sideOffset" :class="classes">
            <slot />
        </DropdownMenuContentPrimitive>
    </DropdownMenuPortalPrimitive>
</template>
