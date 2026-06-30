<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
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
    click: [event: MouseEvent]
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
    const val = computed.getPropertyValue('--card3d-offset').trim()
    const parsed = parseInt(val, 10)
    return Number.isNaN(parsed) ? CSS_VAR_OFFSET_FALLBACK : parsed
}

// 阴影偏移量（响应式）
const initialOffset = ref(CSS_VAR_OFFSET_FALLBACK)

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
    const rect = cardRef.value?.getBoundingClientRect()
    if (!rect) return

    isHovered.value = true
    const x = (e.clientX - rect.left) / rect.width - CENTER_OFFSET // [-0.5, 0.5]
    const y = (e.clientY - rect.top) / rect.height - CENTER_OFFSET // [-0.5, 0.5]

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

const handleClick = (event: MouseEvent) => {
    if (props.disabled || !props.clickable) return
    emit('click', event)
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
            @pointermove="handlePointerMove"
            @pointerleave="handlePointerLeave"
            @click="handleClick"
        >
            <slot />
        </div>
        <!-- 绝对定位的底色 div 模拟物理阴影 -->
        <div :class="shadowClasses" :style="shadowStyles" aria-hidden="true" />
    </div>
</template>
