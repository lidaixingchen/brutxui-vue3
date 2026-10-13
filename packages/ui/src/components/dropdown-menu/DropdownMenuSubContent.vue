<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuSubContent as DropdownMenuSubContentPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { floatingContentSideOffsets } from '@/lib/floating-content-variants'
import { dropdownMenuSubContentVariants } from './dropdown-menu-variants'
import { useFloatingOverlayLayer } from '@/lib/overlay-layer'

interface DropdownMenuSubContentProps {
    sideOffset?: number
    class?: string
}

const props = withDefaults(defineProps<DropdownMenuSubContentProps>(), {
    sideOffset: floatingContentSideOffsets.dropdownMenu,
    class: undefined,
})

const { style: overlayLayerStyle, ref: floatingLayerRef } = useFloatingOverlayLayer('dropdown')

const classes = computed(() =>
    cn(
        dropdownMenuSubContentVariants(),
        props.class
    )
)

// 显式转发 $attrs：避免未来结构变化时隐式透传静默失效
defineOptions({ inheritAttrs: false })
</script>

<template>
    <DropdownMenuSubContentPrimitive
            :ref="floatingLayerRef"
        v-bind="$attrs"
        :side-offset="sideOffset"
        :class="classes"
        :style="[overlayLayerStyle, $attrs.style]"
    >
        <slot />
    </DropdownMenuSubContentPrimitive>
</template>
