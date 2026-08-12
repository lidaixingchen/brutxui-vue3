<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { isDev } from '@/lib/env'

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
const resolvedAs = computed<HeadingTag>(() => {
    if (HEADING_TAGS.includes(props.as)) return props.as
    // 开发环境提示非法 as 值，避免静默回退导致下游 DOM 结构无感知改变
    if (isDev()) {
        console.warn(
            `[BrutxUI CardTitle] 非法 as 值 "${String(props.as)}"，已回退为 h3（可选值：${HEADING_TAGS.join('、')}）`
        )
    }
    return 'h3'
})

const classes = computed(() =>
    cn('text-2xl font-black tracking-tight leading-none', props.class)
)
</script>

<template>
    <component :is="resolvedAs" :class="classes">
        <slot />
    </component>
</template>
