<script setup lang="ts">
import { computed } from 'vue'
import {
    DropdownMenuPortal as DropdownMenuPortalPrimitive,
    DropdownMenuContent as DropdownMenuContentPrimitive,
    injectDropdownMenuRootContext,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { floatingContentSideOffsets } from '@/lib/floating-content-variants'
import { dropdownMenuContentVariants } from './dropdown-menu-variants'
import { useFloatingOverlayLayer } from '@/lib/overlay-layer'

interface DropdownMenuContentProps {
    sideOffset?: number
    /** 对齐方式 */
    align?: 'start' | 'center' | 'end'
    /** 挂载目标（默认 body） */
    to?: string | HTMLElement
    class?: string
}

const props = withDefaults(defineProps<DropdownMenuContentProps>(), {
    sideOffset: floatingContentSideOffsets.dropdownMenu,
    // undefined 触发 reka-ui 默认 'center'——与本组件未暴露 align 时（原始行为）一致
    align: undefined,
    to: undefined,
    class: undefined,
})

const { style: overlayLayerStyle, ref: floatingLayerRef } = useFloatingOverlayLayer('dropdown', injectDropdownMenuRootContext().open)

const classes = computed(() =>
    cn(dropdownMenuContentVariants(), props.class)
)

// 根节点为 Portal（Teleport，不渲染 DOM）：$attrs 需显式转发到内容原语，
// 否则 style/id/data-*/aria-* 等属性会被静默吞掉
defineOptions({ inheritAttrs: false })
</script>

<template>
    <DropdownMenuPortalPrimitive :to="to">
        <DropdownMenuContentPrimitive
            :ref="floatingLayerRef"
            v-bind="$attrs"
            :side-offset="sideOffset"
            :align="align"
            :class="classes"
            :style="[overlayLayerStyle, $attrs.style]"
        >
            <slot />
        </DropdownMenuContentPrimitive>
    </DropdownMenuPortalPrimitive>
</template>
