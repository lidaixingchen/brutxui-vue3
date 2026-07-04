<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { Star } from '@lucide/vue'

interface RateProps {
    modelValue?: number
    max?: number
    allowHalf?: boolean
    readonly?: boolean
    size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<RateProps>(), {
    modelValue: 0,
    max: 5,
    allowHalf: false,
    readonly: false,
    size: 'md'
})

const emit = defineEmits<{
    'update:modelValue': [value: number]
    change: [value: number]
}>()

const hoverValue = ref<number>(0)

const displayValue = computed<number>(() => {
    return hoverValue.value > 0 ? hoverValue.value : props.modelValue
})

// 星星尺寸的类
const starSizeClass = computed<string>(() => {
    return cn(
        props.size === 'sm' && 'h-5 w-5',
        props.size === 'md' && 'h-7 w-7',
        props.size === 'lg' && 'h-9 w-9'
    )
})

// 星星间距的类
const gapClass = computed<string>(() => {
    return cn(
        props.size === 'sm' && 'gap-1',
        props.size === 'md' && 'gap-1.5',
        props.size === 'lg' && 'gap-2'
    )
})

// 获取每个星星的高亮宽度
const getStarWidth = (index: number): string => {
    const starVal = index + 1
    if (displayValue.value >= starVal) {
        return '100%'
    }
    if (props.allowHalf && displayValue.value >= starVal - 0.5) {
        return '50%'
    }
    return '0%'
}

// 是否处于被 hover 且高亮的状态（用于微交互，如悬停弹出/放大）
const isStarActive = (index: number): boolean => {
    if (props.readonly) return false
    const starVal = index + 1
    return hoverValue.value > 0 && displayValue.value >= starVal - (props.allowHalf ? 0.5 : 0)
}

const handleMouseEnter = (val: number) => {
    if (props.readonly) return
    hoverValue.value = val
}

const handleMouseLeave = () => {
    if (props.readonly) return
    hoverValue.value = 0
}

const handleSelect = (val: number) => {
    if (props.readonly) return
    emit('update:modelValue', val)
    emit('change', val)
}
</script>

<template>
    <div
        :class="cn('inline-flex items-center select-none', gapClass)"
        role="slider"
        :aria-valuenow="modelValue"
        :aria-valuemin="0"
        :aria-valuemax="max"
        :aria-readonly="readonly"
        @mouseleave="handleMouseLeave"
    >
        <div
            v-for="i in max"
            :key="i"
            :class="cn(
                'relative inline-block transition-all duration-150',
                starSizeClass,
                !readonly && 'cursor-pointer active:scale-90 active:translate-y-0',
                isStarActive(i - 1) && 'scale-115 -translate-y-0.5'
            )"
        >
            <!-- 底层未选中灰星 -->
            <Star
                :class="cn(
                    'w-full h-full text-brutal-muted stroke-brutal-muted-foreground stroke-[1.5px]',
                    readonly ? 'opacity-60' : 'opacity-80'
                )"
            />

            <!-- 上层选中高亮星（通过 width 和 overflow-hidden 实现半星剪裁） -->
            <div
                class="absolute left-0 top-0 h-full overflow-hidden pointer-events-none transition-all duration-75"
                :style="{ width: getStarWidth(i - 1) }"
            >
                <Star
                    :class="cn(
                        'fill-[hsl(48,100%,50%)] text-brutal-fg stroke-brutal-fg stroke-[2px]',
                        starSizeClass
                    )"
                />
            </div>

            <!-- 透明的鼠标事件交互区 -->
            <template v-if="!readonly">
                <!-- 如果是半星模式，渲染左右两个交互区 -->
                <template v-if="allowHalf">
                    <div
                        class="absolute left-0 top-0 w-1/2 h-full z-10 rate-interactive-area-left"
                        @mouseenter="handleMouseEnter(i - 0.5)"
                        @click="handleSelect(i - 0.5)"
                    />
                    <div
                        class="absolute right-0 top-0 w-1/2 h-full z-10 rate-interactive-area-right"
                        @mouseenter="handleMouseEnter(i)"
                        @click="handleSelect(i)"
                    />
                </template>
                <!-- 否则渲染一个覆盖整个星星的交互区 -->
                <div
                    v-else
                    class="absolute left-0 top-0 w-full h-full z-10 rate-interactive-area"
                    @mouseenter="handleMouseEnter(i)"
                    @click="handleSelect(i)"
                />
            </template>
        </div>
    </div>
</template>
