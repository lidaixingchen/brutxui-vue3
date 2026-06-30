<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { DEFAULT_AUTOPLAY_INTERVAL_MS } from '../../lib/defaults'
import { useReducedMotion } from '../../composables/useReducedMotion'
import { Loader2 } from '@lucide/vue'
import { Primitive } from 'reka-ui'
import { glitchButtonVariants } from './glitch-button-variants'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'

type GlitchButtonVariantProps = VariantProps<typeof glitchButtonVariants>

interface GlitchButtonProps {
    variant?: NonNullable<GlitchButtonVariantProps['variant']>
    size?: NonNullable<GlitchButtonVariantProps['size']>
    speed?: NonNullable<GlitchButtonVariantProps['speed']>
    direction?: NonNullable<GlitchButtonVariantProps['direction']>
    trigger?: 'hover' | 'click' | 'autoplay' | 'none'
    interval?: number
    asChild?: boolean
    loading?: boolean
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<GlitchButtonProps>(), {
    variant: 'default',
    size: 'default',
    speed: 'medium',
    direction: 'horizontal',
    trigger: 'hover',
    interval: DEFAULT_AUTOPLAY_INTERVAL_MS,
    asChild: false,
    loading: false,
    disabled: false,
    class: undefined,
})

const isActive = ref(false)
const isDisabled = computed(() => props.disabled || props.loading)
const prefersReducedMotion = useReducedMotion()

const AUTOPLAY_ACTIVE_DURATION_MS = 1000

let autoplayTimer: ReturnType<typeof setInterval> | null = null
let autoplayStopTimer: ReturnType<typeof setTimeout> | null = null

const startAutoplay = () => {
    stopAutoplay()
    const interval = Math.max(Number(props.interval) || DEFAULT_AUTOPLAY_INTERVAL_MS, 100)
    autoplayTimer = setInterval(() => {
        if (prefersReducedMotion.value) return
        isActive.value = true
        autoplayStopTimer = setTimeout(() => {
            isActive.value = false
        }, AUTOPLAY_ACTIVE_DURATION_MS)
    }, interval)
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

watch(() => props.trigger, (newTrigger, oldTrigger) => {
    if (oldTrigger === 'autoplay') {
        stopAutoplay()
        isActive.value = false
    }
    if (newTrigger === 'autoplay') {
        startAutoplay()
    }
})

watch(() => props.interval, () => {
    if (props.trigger === 'autoplay') {
        startAutoplay()
    }
})

watch(prefersReducedMotion, (prefersReduced) => {
    if (prefersReduced) {
        isActive.value = false
        if (props.trigger === 'autoplay') {
            stopAutoplay()
        }
    } else if (props.trigger === 'autoplay') {
        startAutoplay()
    }
})

const onMouseEnter = () => {
    if (isDisabled.value) return
    if (props.trigger === 'hover') {
        isActive.value = true
    } else if (props.trigger === 'autoplay') {
        isActive.value = false
        stopAutoplay()
    }
}

const onMouseLeave = () => {
    if (isDisabled.value) return
    if (props.trigger === 'hover') {
        isActive.value = false
    } else if (props.trigger === 'autoplay') {
        startAutoplay()
    }
}

const onClick = () => {
    if (isDisabled.value) return
    if (props.trigger === 'click') {
        isActive.value = !isActive.value
    }
}

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

const GLITCH_BUTTON_SIZE_TO_ICON: Record<NonNullable<GlitchButtonVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'default',
    lg: 'lg',
    xl: 'xl',
    icon: 'default',
}

const loaderClasses = computed(() =>
    cn(iconSizeVariants({ size: GLITCH_BUTTON_SIZE_TO_ICON[props.size] }), 'animate-spin')
)

const classes = computed(() =>
    cn(
        glitchButtonVariants({
            variant: props.variant,
            size: props.size,
            speed: props.speed,
            direction: props.direction,
        }),
        isActive.value && !prefersReducedMotion.value ? 'is-glitching' : '',
        props.asChild && isDisabled.value && 'pointer-events-none',
        props.class,
    )
)
</script>

<template>
    <Primitive
        :as="asChild ? undefined : 'button'"
        :as-child="asChild"
        :class="classes"
        :disabled="!asChild && isDisabled"
        :aria-busy="loading || undefined"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
        @click="onClick"
    >
        <Loader2 v-if="loading" :class="loaderClasses" />
        <slot />
    </Primitive>
</template>

<style scoped>
.glitch-button::before,
.glitch-button::after {
    display: none;
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    clip-path: inset(0 0 0 0);
    pointer-events: none;
}

.glitch-button.is-glitching::before,
.glitch-button.is-glitching::after {
    display: block;
}

.glitch-button.is-glitching.glitch-horizontal::before {
    left: 2px;
    text-shadow: -2px 0 var(--brutal-destructive);
    animation: glitch-anim-1 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-button.is-glitching.glitch-horizontal::after {
    left: -2px;
    text-shadow: -2px 0 var(--brutal-info);
    animation: glitch-anim-2 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-button.is-glitching.glitch-vertical::before {
    top: 2px;
    text-shadow: 0 -2px var(--brutal-destructive);
    animation: glitch-anim-vertical-1 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-button.is-glitching.glitch-vertical::after {
    top: -2px;
    text-shadow: 0 -2px var(--brutal-info);
    animation: glitch-anim-vertical-2 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-button.is-glitching.glitch-both::before {
    left: 2px;
    text-shadow: -2px 0 var(--brutal-destructive);
    animation: glitch-anim-1 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-button.is-glitching.glitch-both::after {
    top: -2px;
    text-shadow: 0 -2px var(--brutal-info);
    animation: glitch-anim-vertical-2 var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-button.is-glitching.glitch-horizontal {
    animation: glitch-skew-x var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

.glitch-button.is-glitching.glitch-vertical {
    animation: glitch-skew-y var(--glitch-duration, 300ms) infinite linear alternate-reverse;
}

@keyframes glitch-skew-x {
    0% {
        transform: skew(-2deg);
    }
    20% {
        transform: skew(3deg);
    }
    40% {
        transform: skew(-1deg);
    }
    60% {
        transform: skew(2deg);
    }
    80% {
        transform: skew(-3deg);
    }
    100% {
        transform: skew(1deg);
    }
}

@keyframes glitch-skew-y {
    0% {
        transform: skewY(-2deg);
    }
    20% {
        transform: skewY(3deg);
    }
    40% {
        transform: skewY(-1deg);
    }
    60% {
        transform: skewY(2deg);
    }
    80% {
        transform: skewY(-3deg);
    }
    100% {
        transform: skewY(1deg);
    }
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
    .glitch-button::before,
    .glitch-button::after,
    .glitch-button.is-glitching::before,
    .glitch-button.is-glitching::after {
        display: none !important;
        animation: none !important;
    }

    .glitch-button.is-glitching {
        animation: none !important;
        transform: none !important;
    }
}
</style>