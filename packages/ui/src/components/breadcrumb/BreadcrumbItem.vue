<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { breadcrumbItemVariants } from './breadcrumb-variants'

interface BreadcrumbItemProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbItemProps>(), {
    class: undefined,
})

// 变体无参调用返回静态类名，提升到组件级避免每次 computed 求值重复 cva 解析
const itemClasses = breadcrumbItemVariants()

const classes = computed(() =>
    cn(itemClasses, props.class)
)
</script>

<template>
    <li :class="classes">
        <slot />
    </li>
</template>
