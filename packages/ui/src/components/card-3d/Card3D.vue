<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { getComputedStyle, requestAnimationFrame } from '@/lib/env'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useLocale } from '@/composables/useLocale'
import { card3dVariants, card3dShadowClasses, DEFAULT_CARD3D_OFFSET_PX } from './card-3d-variants'
import { CARD_3D_DEFAULT_PERSPECTIVE_PX } from '@/lib/defaults'

type Card3DVariantProps = VariantProps<typeof card3dVariants>

interface Card3DProps {
    maxRotation?: number
    perspective?: number
    scale?: number
    shadowOffset?: number
    shadow?: NonNullable<Card3DVariantProps['shadow']>
    variant?: NonNullable<Card3DVariantProps['variant']>
    disabled?: boolean
    clickable?: boolean
    class?: string
}

const props = withDefaults(defineProps<Card3DProps>(), {
    maxRotation: 15,
    perspective: CARD_3D_DEFAULT_PERSPECTIVE_PX,
    scale: 1.02,
    shadowOffset: 10,
    shadow: 'default',
    variant: 'default',
    disabled: false,
    clickable: false,
    class: undefined,
})

const emit = defineEmits<{
    // 键盘激活（Enter/Space）时发出 KeyboardEvent，指针点击时发出 MouseEvent
    click: [event: MouseEvent | KeyboardEvent]
}>()

const cardRef = ref<HTMLDivElement | null>(null)
const rx = ref(0)
const ry = ref(0)
const isHovered = ref(false)

const prefersReducedMotion = useReducedMotion()
const { t } = useLocale()

const CSS_VAR_OFFSET_FALLBACK = DEFAULT_CARD3D_OFFSET_PX

// 从 CSS 变量 --card3d-offset 读取阴影偏移量（变量定义在卡片元素上）
const readOffsetFromCSSVar = (): number => {
    if (!cardRef.value) return CSS_VAR_OFFSET_FALLBACK
    const computed = getComputedStyle(cardRef.value)
    const val = computed?.getPropertyValue('--card3d-offset').trim()
    const parsed = val ? parseInt(val, 10) : Number.NaN
    return Number.isNaN(parsed) ? CSS_VAR_OFFSET_FALLBACK : parsed
}

// 阴影偏移量（响应式）；显式标注 number，避免 CARD3D_SHADOW_OFFSETS 的 as const 使
// DEFAULT_CARD3D_OFFSET_PX 收窄为字面量类型，导致运行时读取值无法赋值
const initialOffset = ref<number>(CSS_VAR_OFFSET_FALLBACK)

// 在挂载后从 CSS 变量读取初始偏移量
onMounted(() => {
    initialOffset.value = readOffsetFromCSSVar()
})

// 当 shadow 变体变化时重新读取
watch(() => props.shadow, () => {
    nextTick(() => {
        initialOffset.value = readOffsetFromCSSVar()
    })
})

// 动态阴影偏移量
const sx = ref(0)
const sy = ref(0)

const CENTER_OFFSET = 0.5

const handlePointerMove = (e: PointerEvent) => {
    if (props.disabled || prefersReducedMotion.value) return
    const cardEl = cardRef.value
    const rect = cardEl?.getBoundingClientRect()
    if (!cardEl || !rect || rect.width <= 0 || rect.height <= 0) return

    const width = rect.width
    const height = rect.height

    isHovered.value = true
    const x = (e.clientX - rect.left) / width - CENTER_OFFSET // [-0.5, 0.5]
    const y = (e.clientY - rect.top) / height - CENTER_OFFSET // [-0.5, 0.5]
    if (!Number.isFinite(x) || !Number.isFinite(y)) return

    rx.value = -y * props.maxRotation
    ry.value = x * props.maxRotation

    // 阴影向反方向位移，加上初始阴影值作为偏移基数
    sx.value = -x * props.shadowOffset + initialOffset.value
    sy.value = -y * props.shadowOffset + initialOffset.value
}

const handlePointerLeave = () => {
    isHovered.value = false
    rx.value = 0
    ry.value = 0
    sx.value = initialOffset.value
    sy.value = initialOffset.value
}

// 初始化时设定阴影位置
sx.value = initialOffset.value
sy.value = initialOffset.value

watch(initialOffset, (newVal) => {
    if (!isHovered.value) {
        sx.value = newVal
        sy.value = newVal
    }
})

// 悬停过程中 disabled / prefers-reduced-motion 变 true 时统一重置悬停状态：
// 否则开关恢复且指针仍停留在卡片上（不再触发 pointermove）时，卡片会残留旧的 transform 值
watch([() => props.disabled, prefersReducedMotion], ([disabled, reduced]) => {
    if (disabled || reduced) {
        isHovered.value = false
        rx.value = 0
        ry.value = 0
        sx.value = initialOffset.value
        sy.value = initialOffset.value
    }
})

const cardStyles = computed(() => {
    if (props.disabled || prefersReducedMotion.value) {
        return {}
    }
    return {
        transform: isHovered.value
            ? `perspective(${props.perspective}px) rotateX(${rx.value}deg) rotateY(${ry.value}deg) scale(${props.scale})`
            : `perspective(${props.perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`,
    }
})

const shadowStyles = computed(() => {
    if (props.disabled || prefersReducedMotion.value) {
        return {
            transform: `translate(${initialOffset.value}px, ${initialOffset.value}px)`,
        }
    }
    return {
        transform: `translate(${sx.value}px, ${sy.value}px)`,
    }
})

const containerClasses = computed(() =>
    cn('relative z-0 inline-block w-full', props.class)
)

const cardClasses = computed(() =>
    cn(
        card3dVariants({ shadow: props.shadow, variant: props.variant }),
        props.clickable && 'cursor-pointer',
    )
)

// 键盘激活（Enter keydown / Space keyup）后，浏览器会对 role="button" 的元素合成 click，
// 用标志位吞掉这次合成 click，避免与键盘 emit 重复触发
let suppressSyntheticClick = false

const cardAttrs = computed(() => props.clickable
    ? {
        tabindex: props.disabled ? -1 : 0,
        role: 'button' as const,
        'aria-disabled': props.disabled || undefined,
        'aria-label': t('card3d.ariaLabel'),
    }
    : {})

const handleClick = (event: MouseEvent) => {
    if (props.disabled || !props.clickable) return
    if (suppressSyntheticClick) {
        suppressSyntheticClick = false
        return
    }
    emit('click', event)
}

const handleKeydown = (event: KeyboardEvent) => {
    if (props.disabled || !props.clickable || event.repeat) return
    if (event.key === 'Enter') {
        event.preventDefault()
        suppressSyntheticClick = true
        emit('click', event)
        requestAnimationFrame(() => { suppressSyntheticClick = false })
    } else if (event.key === ' ') {
        // 阻止页面滚动；激活移到 keyup，符合 WAI-ARIA button 模式（可移开焦点取消）
        event.preventDefault()
    }
}

const handleKeyup = (event: KeyboardEvent) => {
    if (props.disabled || !props.clickable || event.repeat || event.key !== ' ') return
    event.preventDefault()
    suppressSyntheticClick = true
    emit('click', event)
    requestAnimationFrame(() => { suppressSyntheticClick = false })
}

const shadowClasses = computed(() =>
    cn(card3dShadowClasses)
)
</script>

<template>
    <div :class="containerClasses" role="group" :aria-label="t('card3d.ariaLabel')">
        <div
            ref="cardRef"
            :class="cardClasses"
            :style="cardStyles"
            v-bind="cardAttrs"
            @pointermove="handlePointerMove"
            @pointerleave="handlePointerLeave"
            @click="handleClick"
            @keydown="handleKeydown"
            @keyup="handleKeyup"
        >
            <slot />
        </div>
        <!-- 绝对定位的底色 div 模拟物理阴影 -->
        <div :class="shadowClasses" :style="shadowStyles" aria-hidden="true" />
    </div>
</template>
