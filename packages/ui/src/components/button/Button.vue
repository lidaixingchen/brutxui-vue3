<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from '@lucide/vue'
import { Primitive } from 'reka-ui'
import { buttonVariants } from './button-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import { useLocale } from '@/composables/useLocale'
import { DEFAULT_AUTOPLAY_INTERVAL_MS } from '@/lib/defaults'
import { useGlitchEffect, type GlitchTrigger } from '@/composables/useGlitchEffect'

type ButtonVariantProps = VariantProps<typeof buttonVariants>
type ButtonGlitchSpeed = NonNullable<ButtonVariantProps['glitchSpeed']>
type ButtonGlitchDirection = NonNullable<ButtonVariantProps['glitchDirection']>

interface ButtonProps {
    variant?: NonNullable<ButtonVariantProps['variant']>
    size?: NonNullable<ButtonVariantProps['size']>
    asChild?: boolean
    type?: 'button' | 'submit' | 'reset'
    loading?: boolean
    disabled?: boolean
    /** 加载中显示的等待文本，作为默认插槽的回退内容；仅在 `type="submit"` 且 `loading` 时生效，未传入时回退到 i18n 默认值；提供插槽内容时优先显示插槽 */
    pendingText?: string
    /** 按钮是否处于按下状态（切换按钮） */
    pressed?: boolean
    /** 按钮控制的内容是否展开 */
    expanded?: boolean
    effect?: 'none' | 'glitch'
    glitchTrigger?: GlitchTrigger
    glitchInterval?: number
    glitchSpeed?: ButtonGlitchSpeed
    glitchDirection?: ButtonGlitchDirection
    class?: string
}

const props = withDefaults(defineProps<ButtonProps>(), {
    variant: 'default',
    size: 'default',
    asChild: false,
    type: undefined,
    loading: false,
    disabled: false,
    pendingText: undefined,
    pressed: undefined,
    expanded: undefined,
    effect: 'none',
    glitchTrigger: 'hover',
    glitchInterval: DEFAULT_AUTOPLAY_INTERVAL_MS,
    glitchSpeed: 'medium',
    glitchDirection: 'horizontal',
    class: undefined,
})

const { t } = useLocale()

const isDisabled = computed(() => props.disabled || props.loading)

const {
    isGlitching,
    onMouseEnter,
    onMouseLeave,
    onClick,
    play,
    stop,
} = useGlitchEffect({
    trigger: () => props.glitchTrigger,
    interval: () => props.glitchInterval,
    disabled: isDisabled,
})

const classes = computed(() =>
    cn(
        buttonVariants({
            variant: props.variant,
            size: props.size,
            effect: props.effect,
            glitchSpeed: props.glitchSpeed,
            glitchDirection: props.glitchDirection,
        }),
        props.effect === 'glitch' && isGlitching.value ? 'is-glitching' : '',
        props.asChild && isDisabled.value && 'pointer-events-none',
        props.class,
    )
)

const BUTTON_SIZE_TO_ICON: Record<NonNullable<ButtonVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'default',
    lg: 'lg',
    xl: 'xl',
    icon: 'default',
}

const loaderClasses = computed(() =>
    cn(iconSizeVariants({ size: BUTTON_SIZE_TO_ICON[props.size] }), 'animate-spin')
)

const resolvedPendingText = computed(() => props.pendingText ?? t('submitButton.submitting'))

const showPendingText = computed(() =>
    props.type === 'submit' && props.loading && !!resolvedPendingText.value
)

function handleMouseEnter() {
    if (props.effect === 'glitch') onMouseEnter()
}

function handleMouseLeave() {
    if (props.effect === 'glitch') onMouseLeave()
}

function handleClick() {
    if (props.effect === 'glitch') onClick()
}

defineExpose({
    play,
    stop,
})
</script>

<template>
    <Primitive
        :as="asChild ? undefined : 'button'"
        :as-child="asChild"
        :class="classes"
        :type="type"
        :disabled="!asChild && isDisabled"
        :aria-disabled="asChild && isDisabled ? true : undefined"
        :aria-busy="loading || undefined"
        :aria-pressed="pressed"
        :aria-expanded="expanded"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @click="handleClick"
    >
        <Loader2 v-if="loading" :class="loaderClasses" />
        <slot>
            <template v-if="showPendingText">
{{ resolvedPendingText }}
</template>
        </slot>
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
        clip-path: inset(20% 0 30% 0);
        transform: translate(-2px, 2px);
    }
    20% {
        clip-path: inset(60% 0 10% 0);
        transform: translate(2px, -2px);
    }
    40% {
        clip-path: inset(40% 0 40% 0);
        transform: translate(-2px, 1px);
    }
    60% {
        clip-path: inset(80% 0 5% 0);
        transform: translate(2px, -1px);
    }
    80% {
        clip-path: inset(10% 0 70% 0);
        transform: translate(-1px, 2px);
    }
    100% {
        clip-path: inset(50% 0 20% 0);
        transform: translate(1px, -2px);
    }
}

@keyframes glitch-anim-2 {
    0% {
        clip-path: inset(10% 0 60% 0);
        transform: translate(2px, -1px);
    }
    20% {
        clip-path: inset(70% 0 15% 0);
        transform: translate(-2px, 2px);
    }
    40% {
        clip-path: inset(30% 0 50% 0);
        transform: translate(2px, 1px);
    }
    60% {
        clip-path: inset(5% 0 80% 0);
        transform: translate(-2px, -2px);
    }
    80% {
        clip-path: inset(60% 0 20% 0);
        transform: translate(1px, 2px);
    }
    100% {
        clip-path: inset(25% 0 55% 0);
        transform: translate(-1px, -1px);
    }
}

@keyframes glitch-anim-vertical-1 {
    0% {
        clip-path: inset(0 20% 0 30%);
        transform: translate(2px, -2px);
    }
    25% {
        clip-path: inset(0 60% 0 10%);
        transform: translate(-2px, 2px);
    }
    50% {
        clip-path: inset(0 40% 0 40%);
        transform: translate(1px, -2px);
    }
    75% {
        clip-path: inset(0 10% 0 70%);
        transform: translate(-1px, 2px);
    }
    100% {
        clip-path: inset(0 50% 0 20%);
        transform: translate(2px, -1px);
    }
}

@keyframes glitch-anim-vertical-2 {
    0% {
        clip-path: inset(0 10% 0 60%);
        transform: translate(-2px, 1px);
    }
    25% {
        clip-path: inset(0 70% 0 15%);
        transform: translate(2px, -2px);
    }
    50% {
        clip-path: inset(0 30% 0 50%);
        transform: translate(-1px, 2px);
    }
    75% {
        clip-path: inset(0 5% 0 80%);
        transform: translate(1px, -2px);
    }
    100% {
        clip-path: inset(0 25% 0 55%);
        transform: translate(-2px, 1px);
    }
}

@media (prefers-reduced-motion: reduce) {
    .glitch-button,
    .glitch-button::before,
    .glitch-button::after {
        animation: none !important;
    }
}
</style>
