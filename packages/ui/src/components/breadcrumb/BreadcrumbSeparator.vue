<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { breadcrumbSeparatorVariants } from './breadcrumb-variants'

interface BreadcrumbSeparatorProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbSeparatorProps>(), {
    class: undefined,
})

const classes = computed(() =>
    cn(breadcrumbSeparatorVariants(), props.class)
)
</script>

<template>
    <li
        aria-hidden="true"
        :class="classes"
    >
        <!-- 设计说明：分隔符建模为 <li>（HTML 规范下 <ol> 只允许 <li> 子元素，用 <span> 会产生无效 HTML），
             依赖 aria-hidden 从可访问性树移除（读屏统计条目数不受影响），并依赖 variants 的 list-none 清除列表标记；
             role="presentation" 与 aria-hidden 语义重叠且无法在 aria-hidden 被误删时兜底分隔符文本，故不保留 -->
        <slot>
            <span>/</span>
        </slot>
    </li>
</template>
