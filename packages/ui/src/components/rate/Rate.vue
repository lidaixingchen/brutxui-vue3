<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { Star } from '@lucide/vue'
import { useReducedMotion } from '@/composables/useReducedMotion'
import BrutalShape from '../brutal-shape/BrutalShape.vue'
import { isBrutalShapeName } from '../brutal-shape/shapes'

interface RateProps {
    modelValue?: number
    max?: number
    allowHalf?: boolean
    readonly?: boolean
    size?: 'sm' | 'md' | 'lg'
    /** 图腾图标名（brutal-shape 图腾库）；缺省渲染默认星形 */
    icon?: string
}

const props = withDefaults(defineProps<RateProps>(), {
    modelValue: 0,
    max: 5,
    allowHalf: false,
    readonly: false,
    size: 'md',
    icon: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [value: number]
    change: [value: number]
}>()

const prefersReducedMotion = useReducedMotion()
const hoverValue = ref<number>(0)
/** 最近被敲选的图腾序号：驱动 Stamp Impact 敲印回弹动效 */
const stampedIndex = ref<number | null>(null)

const usesGlyphIcon = computed(() => Boolean(props.icon && isBrutalShapeName(props.icon)))

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
    if (val === props.modelValue) return
    emit('update:modelValue', val)
    emit('change', val)
    triggerStampImpact(val - 1)
}

/** 敲印回弹：瞬间放大带微旋转后回弹归位；减弱动效环境下瞬时切换不播动画 */
function triggerStampImpact(index: number): void {
    if (props.readonly || prefersReducedMotion.value) return
    stampedIndex.value = index
}

function clearStampImpact(): void {
    stampedIndex.value = null
}

const handleKeydown = (event: KeyboardEvent) => {
    if (props.readonly) return
    const step = props.allowHalf ? 0.5 : 1
    let nextValue: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        nextValue = Math.min(props.max, props.modelValue + step)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        nextValue = Math.max(0, props.modelValue - step)
    } else if (event.key === 'Home') {
        nextValue = 0
    } else if (event.key === 'End') {
        nextValue = props.max
    }

    if (nextValue !== null) {
        event.preventDefault()
        if (nextValue !== props.modelValue) {
            emit('update:modelValue', nextValue)
            emit('change', nextValue)
        }
    }
}
</script>

<template>
    <div
        :class="cn('inline-flex items-center select-none', gapClass)"
        role="slider"
        :aria-valuenow="displayValue"
        :aria-valuemin="0"
        :aria-valuemax="max"
        :aria-valuetext="`${displayValue} / ${max}`"
        :aria-readonly="readonly"
        :tabindex="readonly ? -1 : 0"
        @mouseleave="handleMouseLeave"
        @keydown="handleKeydown"
    >
        <div
            v-for="i in max"
            :key="i"
            :class="cn(
                'relative inline-block transition-all duration-150',
                starSizeClass,
                !readonly && 'cursor-pointer active:scale-90 active:translate-y-0',
                isStarActive(i - 1) && 'scale-115 -translate-y-0.5',
                stampedIndex === i - 1 && 'animate-brutal-stamp'
            )"
            @animationend="stampedIndex === i - 1 && clearStampImpact()"
        >
            <!-- 底层未选中灰图腾 -->
            <Star
                v-if="!usesGlyphIcon"
                :class="cn(
                    'w-full h-full text-brutal-muted stroke-brutal-muted-foreground stroke-[1.5px]',
                    readonly ? 'opacity-60' : 'opacity-80'
                )"
            />
            <BrutalShape
                v-else
                :name="props.icon!"
                :size="36"
                color="var(--brutal-muted)"
                stroke="var(--brutal-muted-foreground)"
                :stroke-width="2"
                class="h-full w-full opacity-80"
                :class="starSizeClass"
            />

            <!-- 上层选中高亮图腾（通过 width 和 overflow-hidden 实现半星剪裁） -->
            <div
                class="absolute left-0 top-0 h-full overflow-hidden pointer-events-none transition-all duration-75"
                :style="{ width: getStarWidth(i - 1) }"
            >
                <Star
                    v-if="!usesGlyphIcon"
                    :class="cn(
                        'fill-brutal-accent text-brutal-fg stroke-brutal-fg stroke-[2px]',
                        starSizeClass
                    )"
                />
                <BrutalShape
                    v-else
                    :name="props.icon!"
                    :size="36"
                    color="var(--brutal-accent)"
                    stroke="var(--brutal-fg)"
                    :stroke-width="2"
                    :class="starSizeClass"
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
