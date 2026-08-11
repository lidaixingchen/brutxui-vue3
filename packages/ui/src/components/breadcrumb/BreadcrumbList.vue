<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { breadcrumbListVariants } from './breadcrumb-variants'

// 契约：BreadcrumbList 自身无 aria-label，可访问性语义由外层 Breadcrumb 的
// `<nav aria-label="breadcrumb.label">` 提供，独立使用时须自行包裹带命名标签的 nav
interface BreadcrumbListProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbListProps>(), {
    class: undefined,
})

const classes = computed(() =>
    cn(breadcrumbListVariants(), props.class)
)
</script>

<template>
    <ol class="breadcrumb-list" :class="classes">
        <slot />
    </ol>
</template>
