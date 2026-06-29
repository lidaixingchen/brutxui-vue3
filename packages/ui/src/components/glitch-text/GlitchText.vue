<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { useReducedMotion } from '../../composables/useReducedMotion'
import { glitchTextVariants } from './glitch-text-variants'

type GlitchTextVariantProps = VariantProps<typeof glitchTextVariants>

interface GlitchTextProps {
    text?: string
    trigger?: 'hover' | 'click' | 'autoplay' | 'none'
    interval?: number
    speed?: NonNullable<GlitchTextVariantProps['speed']>
    direction?: NonNullable<GlitchTextVariantProps['direction']>
    class?: string
}

const props = withDefaults(defineProps<GlitchTextProps>(), {
    text: '',
    trigger: 'hover',
    interval: 3000,
    speed: 'medium',
    direction: 'horizontal',
    class: undefined,
})

const isActive = ref(false)
const prefersReducedMotion = useReducedMotion()

const AUTOPLAY_ACTIVE_DURATION_MS = 1000
const MIN_INTERVAL_MS = 50

let autoplayTimer: ReturnType<typeof setInterval> | null = null
let autoplayStopTimer: ReturnType<typeof setTimeout> | null = null

const startAutoplay = () => {
    stopAutoplay()
    autoplayTimer = setInterval(() => {
        if (prefersReducedMotion.value) return
        isActive.value = true
        autoplayStopTimer = setTimeout(() => {
            isActive.value = false
        }, AUTOPLAY_ACTIVE_DURATION_MS)
    }, Math.max(props.interval, MIN_INTERVAL_MS))
}

const stopAutoplay = () => {
    if (autoplayTimer) {
        clearInterval(autoplayTimer)
        autoplayTimer = null
    }
    if (autoplayStopTimer) {
        clearTimeout(autoplayStopTimer)
        autoplayStopTimer = null
    }
}

onMounted(() => {
    if (props.trigger === 'autoplay') {
        startAutoplay()
    }
})

onUnmounted(() => {
    stopAutoplay()
})

const onMouseEnter = () => {
    if (props.trigger === 'hover') {
        isActive.value = true
    } else if (props.trigger === 'autoplay') {
        // Autoplay 模式下，hover 时暂停
        isActive.value = false
        stopAutoplay()
    }
}

const onMouseLeave = () => {
    if (props.trigger === 'hover') {
        isActive.value = false
    } else if (props.trigger === 'autoplay') {
        // 离开后重新开启
        startAutoplay()
    }
}

const onClick = () => {
    if (props.trigger === 'click') {
        isActive.value = !isActive.value
    }
}

// 暴露 API 供外部程序化控制
const play = () => {
    isActive.value = true
}

const stop = () => {
    isActive.value = false
}

defineExpose({
    play,
    stop,
})

const classes = computed(() =>
    cn(
        glitchTextVariants({ speed: props.speed, direction: props.direction }),
        isActive.value && !prefersReducedMotion.value ? 'is-glitching' : '',
        props.class
    )
)
</script>

<template>
    <span
        :class="classes"
        :data-text="text"
        role="status"
        aria-live="polite"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
        @click="onClick"
    >
        <slot>{{ text }}</slot>
    </span>
</template>

<style scoped>
.glitch-text::before,
.glitch-text::after {
    display: none;
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    clip-path: inset(0 0 0 0);
}

.glitch-text.is-glitching::before,
.glitch-text.is-glitching::after {
    display: block;
}

.glitch-text.is-glitching.glitch-horizontal::before {
    left: 2px;
    text-shadow: -2px 0 var(--brutal-destructive);
    animation: glitch-anim-1 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-text.is-glitching.glitch-horizontal::after {
    left: -2px;
    text-shadow: -2px 0 var(--brutal-info);
    animation: glitch-anim-2 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-text.is-glitching.glitch-vertical::before {
    top: 2px;
    text-shadow: 0 -2px var(--brutal-destructive);
    animation: glitch-anim-vertical-1 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-text.is-glitching.glitch-vertical::after {
    top: -2px;
    text-shadow: 0 -2px var(--brutal-info);
    animation: glitch-anim-vertical-2 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-text.is-glitching.glitch-both::before {
    left: 2px;
    text-shadow: -2px 0 var(--brutal-destructive);
    animation: glitch-anim-1 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-text.is-glitching.glitch-both::after {
    top: -2px;
    text-shadow: 0 -2px var(--brutal-info);
    animation: glitch-anim-vertical-2 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

@keyframes glitch-anim-1 {
    0% {
        clip-path: inset(20% 0 70% 0);
        transform: skew(-5deg);
    }
    20% {
        clip-path: inset(60% 0 10% 0);
        transform: skew(5deg);
    }
    40% {
        clip-path: inset(40% 0 50% 0);
        transform: skew(-2deg);
    }
    60% {
        clip-path: inset(80% 0 5% 0);
        transform: skew(3deg);
    }
    80% {
        clip-path: inset(10% 0 85% 0);
        transform: skew(-4deg);
    }
    100% {
        clip-path: inset(50% 0 35% 0);
        transform: skew(1deg);
    }
}

@keyframes glitch-anim-2 {
    0% {
        clip-path: inset(10% 0 85% 0);
        transform: skew(4deg);
    }
    25% {
        clip-path: inset(40% 0 45% 0);
        transform: skew(-3deg);
    }
    50% {
        clip-path: inset(70% 0 15% 0);
        transform: skew(5deg);
    }
    75% {
        clip-path: inset(25% 0 60% 0);
        transform: skew(-2deg);
    }
    100% {
        clip-path: inset(90% 0 2% 0);
        transform: skew(3deg);
    }
}

@keyframes glitch-anim-vertical-1 {
    0% {
        clip-path: inset(0 20% 0 70%);
        transform: skewY(-5deg);
    }
    20% {
        clip-path: inset(0 60% 0 10%);
        transform: skewY(5deg);
    }
    40% {
        clip-path: inset(0 40% 0 50%);
        transform: skewY(-2deg);
    }
    60% {
        clip-path: inset(0 80% 0 5%);
        transform: skewY(3deg);
    }
    80% {
        clip-path: inset(0 10% 0 85%);
        transform: skewY(-4deg);
    }
    100% {
        clip-path: inset(0 50% 0 35%);
        transform: skewY(1deg);
    }
}

@keyframes glitch-anim-vertical-2 {
    0% {
        clip-path: inset(0 10% 0 85%);
        transform: skewY(4deg);
    }
    25% {
        clip-path: inset(0 40% 0 45%);
        transform: skewY(-3deg);
    }
    50% {
        clip-path: inset(0 70% 0 15%);
        transform: skewY(5deg);
    }
    75% {
        clip-path: inset(0 25% 0 60%);
        transform: skewY(-2deg);
    }
    100% {
        clip-path: inset(0 90% 0 2%);
        transform: skewY(3deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .glitch-text::before,
    .glitch-text::after,
    .glitch-text.is-glitching::before,
    .glitch-text.is-glitching::after {
        display: none !important;
        animation: none !important;
    }
}
</style>
