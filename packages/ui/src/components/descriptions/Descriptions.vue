<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { cn } from '@/lib/utils'

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

// 计算网格样式
const gridStyle = computed(() => {
    return {
        gridTemplateColumns: `repeat(${props.column}, 1fr)`,
    }
})
</script>

<template>
    <div :class="cn('w-full', props.class)">
        <!-- 标题 -->
        <div
            v-if="title || slots.title"
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
                'border-3 border-brutal rounded-brutal overflow-hidden',
                sizeClasses,
            )"
        >
            <div
                :class="cn(
                    'grid',
                    direction === 'vertical' ? 'grid-cols-1' : '',
                )"
                :style="direction === 'horizontal' ? gridStyle : undefined"
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
