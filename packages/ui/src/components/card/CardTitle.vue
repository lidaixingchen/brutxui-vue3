<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
type HeadingTag = (typeof HEADING_TAGS)[number]

interface CardTitleProps {
    as?: HeadingTag
    class?: string
}

const props = withDefaults(defineProps<CardTitleProps>(), {
    as: 'h3',
    class: undefined,
})

// 运行时校验：白名单之外的非法值回退 h3，避免 resolveDynamicComponent 解析为全局组件
// 或拼错的标签静默渲染出非标题元素（JS 调用方可绕过 TS 联合类型传入任意字符串）
const resolvedAs = computed<HeadingTag>(() =>
    HEADING_TAGS.includes(props.as) ? props.as : 'h3'
)

const classes = computed(() =>
    cn('text-2xl font-black tracking-tight leading-none', props.class)
)
</script>

<template>
    <component :is="resolvedAs" :class="classes">
        <slot />
    </component>
</template>
