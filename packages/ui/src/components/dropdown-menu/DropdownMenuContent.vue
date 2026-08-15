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
    /** 对齐方式 */
    align?: 'start' | 'center' | 'end'
    /** 挂载目标（默认 body） */
    to?: string | HTMLElement
    class?: string
}

const props = withDefaults(defineProps<DropdownMenuContentProps>(), {
    sideOffset: floatingContentSideOffsets.dropdownMenu,
    align: 'start',
    to: undefined,
    class: undefined,
})

const classes = computed(() =>
    cn(dropdownMenuContentVariants(), props.class)
)

// 根节点为 Portal（Teleport，不渲染 DOM）：$attrs 需显式转发到内容原语，
// 否则 style/id/data-*/aria-* 等属性会被静默吞掉
defineOptions({ inheritAttrs: false })
</script>

<template>
    <DropdownMenuPortalPrimitive :to="to">
        <DropdownMenuContentPrimitive v-bind="$attrs" :side-offset="sideOffset" :align="align" :class="classes">
            <slot />
        </DropdownMenuContentPrimitive>
    </DropdownMenuPortalPrimitive>
</template>
