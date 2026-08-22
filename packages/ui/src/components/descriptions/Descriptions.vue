<script setup lang="ts">
import { Comment, computed, provide, toRef, useSlots } from 'vue'
import { cn } from '@/lib/utils'
import { descriptionsBorderKey, descriptionsDirectionKey } from './descriptions-key'

interface DescriptionsProps {
    /** 列数 */
    column?: number
    /** 是否带边框 */
    border?: boolean
    /** 排列方向 */
    direction?: 'horizontal' | 'vertical'
    /** 尺寸 */
    size?: 'sm' | 'default' | 'lg'
    /** 标题 */
    title?: string
    class?: string
}

const props = withDefaults(defineProps<DescriptionsProps>(), {
    column: 3,
    border: false,
    direction: 'horizontal',
    size: 'default',
    title: undefined,
    class: undefined,
})

provide(descriptionsBorderKey, toRef(props, 'border'))
provide(descriptionsDirectionKey, toRef(props, 'direction'))

const slots = useSlots()

// 计算尺寸样式
const sizeClasses = computed(() => {
    switch (props.size) {
        case 'sm':
            return 'text-sm'
        case 'lg':
            return 'text-lg'
        default:
            return 'text-base'
    }
})

// 标题是否实际有内容：title 文本或 title 插槽渲染出非注释节点。
// 单独 computed 避免 v-if 与真实渲染各调用一次插槽（双创建副作用），
// 并排除仅含注释节点的插槽（被误判为有内容会渲染空标题块）
const hasTitle = computed(() => {
    if (props.title) return true
    const nodes = slots.title?.()
    return Boolean(nodes?.some((node) => (node.type as unknown) !== Comment))
})

// 计算网格样式（column 归一化为正整数，避免非法 CSS 声明；非有限值兜底为 1）
const gridStyle = computed(() => {
    const n = Number(props.column)
    const safeColumn = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
    const cols = props.border && props.direction === 'horizontal' ? safeColumn * 2 : safeColumn
    return {
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
    }
})
</script>

<template>
    <div :class="cn('w-full', props.class)">
        <!-- 标题（title 或 title 插槽实际有内容时才渲染） -->
        <div
            v-if="hasTitle"
            class="mb-4"
        >
            <slot name="title">
                <h3 class="text-lg font-bold text-brutal-fg">
                    {{ title }}
                </h3>
            </slot>
        </div>

        <!-- 带边框的描述列表 -->
        <div
            v-if="border"
            :class="cn(
                'relative border-3 border-brutal rounded-brutal overflow-hidden',
                sizeClasses,
            )"
        >
            <!-- 技术档案印章插槽：右上角悬浮（容器 overflow-hidden，印章不越界负偏移以免被裁剪） -->
            <div v-if="$slots.stamp" class="absolute top-0 right-4 z-10">
                <slot name="stamp" />
            </div>
            <div
                class="grid"
                :style="gridStyle"
            >
                <slot />
            </div>
        </div>

        <!-- 无边框的描述列表 -->
        <div
            v-else
            :class="cn(
                'grid gap-2',
                sizeClasses,
            )"
            :style="gridStyle"
        >
            <slot />
        </div>
    </div>
</template>
