<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, useId } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { noiseBackgroundVariants } from './noise-background-variants'
import { useReducedMotion } from '../../composables/useReducedMotion'

type NoiseBackgroundVariantProps = VariantProps<typeof noiseBackgroundVariants>

interface NoiseBackgroundProps {
    /** 噪点类型 */
    type?: 'fractalNoise' | 'turbulence'
    /** 噪点频率 */
    frequency?: number
    /** 噪点层数 */
    octaves?: number
    /** 不透明度 */
    opacity?: number
    /** 是否启用动画 */
    animated?: boolean
    /** 动画速度（秒） */
    animationDuration?: number
    /** 动画频率变化范围 */
    animationRange?: number
    /** 圆角 */
    rounded?: NonNullable<NoiseBackgroundVariantProps['rounded']>
    /** 自定义类名 */
    class?: string
}

const props = withDefaults(defineProps<NoiseBackgroundProps>(), {
    type: 'fractalNoise',
    frequency: 0.65,
    octaves: 3,
    opacity: 0.5,
    animated: false,
    animationDuration: 8,
    animationRange: 0.1,
    rounded: 'none',
    class: undefined,
})

const prefersReducedMotion = useReducedMotion()

// 使用 Vue ref 替代直接 DOM 访问
const turbulenceRef = ref<SVGFETurbulenceElement | null>(null)

// 使用 useId 生成 SSR 安全且稳定的唯一 ID
const filterId = `noise-${useId()}`

// 动画相关
let animationFrame: number | null = null
const currentFrequency = ref(props.frequency)

function startAnimation() {
    // SSR 兼容性检查 + 动效降级
    if (!props.animated || typeof window === 'undefined' || props.animationDuration <= 0) return
    if (prefersReducedMotion.value) return

    stopAnimation()

    const startTime = performance.now()
    const baseFrequency = props.frequency
    const frequencyRange = props.animationRange

    function step(currentTime: number) {
        const elapsed = (currentTime - startTime) / 1000
        const progress = (elapsed % props.animationDuration) / props.animationDuration
        currentFrequency.value = baseFrequency + Math.sin(progress * Math.PI * 2) * frequencyRange

        // 使用 Vue ref 更新 SVG 滤镜属性
        if (turbulenceRef.value) {
            turbulenceRef.value.setAttribute('baseFrequency', currentFrequency.value.toString())
        }

        animationFrame = requestAnimationFrame(step)
    }

    animationFrame = requestAnimationFrame(step)
}

function stopAnimation() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame)
        animationFrame = null
    }
}

// 响应 animated 属性变化
watch(() => props.animated, (newVal) => {
    if (newVal) {
        startAnimation()
    } else {
        stopAnimation()
    }
})

// 响应 frequency 和 animationDuration 属性变化
watch(() => [props.frequency, props.animationDuration], () => {
    if (props.animated) {
        startAnimation()
    }
})

// 响应动效偏好变化
watch(prefersReducedMotion, (reduced) => {
    if (reduced) {
        stopAnimation()
    } else if (props.animated) {
        startAnimation()
    }
})

onMounted(() => {
    if (props.animated) {
        startAnimation()
    }
})

onUnmounted(() => {
    stopAnimation()
})

const classes = computed(() =>
    cn(noiseBackgroundVariants({ rounded: props.rounded }), props.class)
)
</script>

<template>
    <div :class="classes">
        <svg
            class="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
        >
            <filter :id="filterId">
                <feTurbulence
                    ref="turbulenceRef"
                    :type="type"
                    :baseFrequency="frequency"
                    :numOctaves="octaves"
                    stitchTiles="stitch"
                />
            </filter>
            <rect
                width="100%"
                height="100%"
                :filter="`url(#${filterId})`"
                :opacity="opacity"
            />
        </svg>
        <div class="relative z-10">
            <slot />
        </div>
    </div>
</template>
