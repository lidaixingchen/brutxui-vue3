<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuSubContent as DropdownMenuSubContentPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { floatingContentSideOffsets } from '@/lib/floating-content-variants'
import { dropdownMenuSubContentVariants } from './dropdown-menu-variants'
import { useFloatingOverlay } from '@/lib/overlay-layer'

interface DropdownMenuSubContentProps {
    sideOffset?: number
    class?: string
}

const props = withDefaults(defineProps<DropdownMenuSubContentProps>(), {
    sideOffset: floatingContentSideOffsets.dropdownMenu,
    class: undefined,
})

const { style: overlayLayerStyle, ref: floatingLayerRef } = useFloatingOverlay('dropdown', {
    anchor: (content) => {
        if (!content) return null
        const triggerId = content.getAttribute('aria-labelledby')
        return triggerId ? content.ownerDocument.getElementById(triggerId) : null
    },
})

const classes = computed(() =>
    cn(
        dropdownMenuSubContentVariants(),
        props.class
    )
)

// 内容原语接收调用方的样式和无障碍属性。
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
