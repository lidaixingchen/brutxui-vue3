<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { breadcrumbPageVariants } from './breadcrumb-variants'

interface BreadcrumbPageProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbPageProps>(), {
    class: undefined,
})

const classes = computed(() =>
    cn(breadcrumbPageVariants(), props.class)
)
</script>

<template>
    <span
        aria-current="page"
        :class="classes"
    >
        <!-- 当前页为非交互文本：去掉 role=link/aria-disabled 避免读屏播报「禁用链接」误导，
             仅用 aria-current="page" 表达当前页指示（WAI-ARIA 面包屑 APG 模式） -->
        <slot />
    </span>
</template>
