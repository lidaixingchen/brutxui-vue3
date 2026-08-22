<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { breadcrumbListVariants } from './breadcrumb-variants'

// 契约：BreadcrumbList 自身无 aria-label，可访问性语义由外层 Breadcrumb 的
// `<nav aria-label="breadcrumb.label">` 提供，独立使用时须自行包裹带命名标签的 nav
interface BreadcrumbListProps {
    class?: string
    /** 档案插片形态：链接渲染为文件夹标签插片 */
    variant?: 'default' | 'folder'
}

const props = withDefaults(defineProps<BreadcrumbListProps>(), {
    class: undefined,
    variant: 'default',
})

const classes = computed(() =>
    cn(breadcrumbListVariants({ variant: props.variant }), props.class)
)
</script>

<template>
    <ol class="breadcrumb-list" :class="classes">
        <slot />
    </ol>
</template>
