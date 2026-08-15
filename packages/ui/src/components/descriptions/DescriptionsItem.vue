<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { cn } from '@/lib/utils'
import { descriptionsBorderKey, descriptionsDirectionKey } from './descriptions-key'

interface DescriptionsItemProps {
    /** 标签 */
    label: string
    /** 跨列数 */
    span?: number
    /** 标签宽度（仅在父组件 direction='horizontal' 时有效） */
    labelWidth?: string | number
    class?: string
}

const props = withDefaults(defineProps<DescriptionsItemProps>(), {
    span: 1,
    labelWidth: undefined,
    class: undefined,
})

// 从父组件注入配置
const parentBorder = inject(descriptionsBorderKey, ref(false))
const parentDirection = inject(descriptionsDirectionKey, ref('horizontal'))

// 计算跨列样式（归一化为正整数，避免非法 CSS 声明；NaN/Infinity 等非有限值兜底为 1）
const normalizedSpan = computed(() => {
    const n = Number(props.span)
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
})

const spanStyle = computed(() => {
    if (normalizedSpan.value <= 1) return undefined
    return {
        gridColumn: `span ${normalizedSpan.value}`,
    }
})

// 计算标签宽度样式
const labelStyle = computed(() => {
    if (props.labelWidth === undefined || props.labelWidth === '') return undefined
    const width = typeof props.labelWidth === 'number' ? `${props.labelWidth}px` : props.labelWidth
    return { width }
})
</script>

<template>
    <!-- 带边框模式 -->
    <template v-if="parentBorder">
        <!-- 水平方向 -->
        <template v-if="parentDirection === 'horizontal'">
            <div
                v-if="normalizedSpan > 1"
                :class="cn('flex border-b-3 border-brutal', props.class)"
                :style="{ gridColumn: `span ${normalizedSpan * 2}` }"
            >
                <div
                    :class="cn(
                        'flex items-center px-3 py-2 bg-brutal-muted/30 font-medium text-brutal-fg border-r-3 border-brutal w-1/2 min-w-0 truncate',
                    )"
                    :style="labelStyle"
                >
                    <slot name="label">
                        {{ label }}
                    </slot>
                </div>
                <div :class="cn('flex-1 min-w-0 flex items-center px-3 py-2 text-brutal-fg')">
                    <slot />
                </div>
            </div>
            <!-- span<=1 时包装 label+value 为单个 grid item（占两轨），class 只应用一次 -->
            <div
                v-else
                :class="cn('flex', props.class)"
                :style="{ gridColumn: 'span 2' }"
            >
                <div
                    :class="cn(
                        'flex items-center px-3 py-2 bg-brutal-muted/30 font-medium text-brutal-fg border-b-3 border-brutal w-1/2 min-w-0 truncate',
                    )"
                    :style="labelStyle"
                >
                    <slot name="label">
                        {{ label }}
                    </slot>
                </div>
                <div
                    :class="cn(
                        'flex-1 min-w-0 flex items-center px-3 py-2 text-brutal-fg border-b-3 border-brutal',
                    )"
                >
                    <slot />
                </div>
            </div>
        </template>

        <!-- 垂直方向 -->
        <template v-else>
            <div
                :class="cn(
                    'flex flex-col border-b-3 border-brutal',
                    props.class,
                )"
                :style="spanStyle"
            >
                <div
                    class="px-3 py-2 bg-brutal-muted/30 font-medium text-brutal-fg border-b-3 border-brutal"
                >
                    <slot name="label">
                        {{ label }}
                    </slot>
                </div>
                <div
                    class="px-3 py-2 text-brutal-fg flex-1"
                >
                    <slot />
                </div>
            </div>
        </template>
    </template>

    <!-- 无边框模式 -->
    <div
        v-else
        :class="cn('flex flex-col gap-1', props.class)"
        :style="spanStyle"
    >
        <div class="font-medium text-brutal-placeholder text-sm">
            <slot name="label">
                {{ label }}
            </slot>
        </div>
        <div class="text-brutal-fg">
            <slot />
        </div>
    </div>
</template>
