<script setup lang="ts">
import { computed, toRef } from 'vue'
import {
    DropdownMenuPortal as DropdownMenuPortalPrimitive,
    DropdownMenuContent as DropdownMenuContentPrimitive,
    injectDropdownMenuRootContext,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { floatingContentSideOffsets } from '@/lib/floating-content-variants'
import { dropdownMenuContentVariants } from './dropdown-menu-variants'
import { useFloatingOverlayLayer } from '@/lib/overlay-layer'
import { usePortalThemeInheritance } from '@/lib/portal-theme'

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
    // 省略时沿用原语的默认居中对齐。
    align: undefined,
    to: undefined,
    class: undefined,
})

const dropdownMenuContext = injectDropdownMenuRootContext()
const { style: overlayLayerStyle, ref: floatingLayerRef, element: floatingElement } = useFloatingOverlayLayer('dropdown', dropdownMenuContext.open)
// 原语挂载时会替换触发器 ref，按当前上下文读取实际元素。
const triggerElement = toRef(() => dropdownMenuContext.triggerElement.value)
usePortalThemeInheritance(triggerElement, floatingElement)

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
