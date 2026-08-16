<script setup lang="ts">
import { computed, useSlots, type VNodeChild } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { DEFAULT_AUTOPLAY_INTERVAL_MS } from '@/lib/defaults'
import { useGlitchEffect } from '@/composables/useGlitchEffect'
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
    interval: DEFAULT_AUTOPLAY_INTERVAL_MS,
    speed: 'medium',
    direction: 'horizontal',
    class: undefined,
})

const slots = useSlots()

// 复用 useGlitchEffect（autoplay 调度统一实现）：
// - interval 动态变化会重建定时器（无需额外 watcher）
// - interval 自动钳制到激活时长，避免 interval 过短时毛刺退化为持续动画
// - 切出 autoplay 时复位激活态，避免 isActive 卡死在 true
// - prefers-reduced-motion 变化时启停定时器，避免空转
const { isActive, isGlitching, onMouseEnter, onMouseLeave, onClick, play, stop } = useGlitchEffect({
    trigger: () => props.trigger,
    interval: () => props.interval,
})

// 毛刺由伪元素 content: attr(data-text) 渲染：优先 text prop，
// 缺失时取插槽文本，保证效果与页面实际展示内容一致。
// 注意：useSlots() 本身非响应式，插槽文本需来自响应式数据源（与 CodeBlock 同约束）
const dataText = computed(() => {
    if (props.text) return props.text
    return (slots.default?.() ?? []).map(extractText).join('')
})

function extractText(node: VNodeChild): string {
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(extractText).join('')
    if (node && typeof node === 'object' && 'children' in node) {
        const children = node.children
        if (typeof children === 'string') return children
        if (Array.isArray(children)) return children.map(extractText).join('')
        // 组件型 VNode：Vue normalizeChildren 会把函数 children 归一化为插槽对象
        // { default: fn, _ctx }，两个形态都需处理
        if (typeof children === 'function') return extractText((children as () => VNodeChild)())
        if (children && typeof children === 'object') {
            const defaultSlot = (children as { default?: () => VNodeChild }).default
            if (typeof defaultSlot === 'function') return extractText(defaultSlot())
        }
    }
    return ''
}

// play/stop 为无条件编程接口（与 useGlitchEffect 契约一致）：autoplay 模式下不联动定时器，
// 停止自动播放请将 trigger 切换为非 autoplay
const classes = computed(() =>
    cn(
        glitchTextVariants({ speed: props.speed, direction: props.direction }),
        isGlitching.value ? 'is-glitching' : '',
        props.class
    )
)

defineExpose({
    play,
    stop,
})
</script>

<template>
    <span
        :class="classes"
        :data-text="dataText"
        :role="trigger === 'click' ? 'button' : undefined"
        :tabindex="trigger === 'click' ? '0' : undefined"
        :aria-pressed="trigger === 'click' ? (isActive ? 'true' : 'false') : undefined"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
        @click="onClick"
        @keydown.enter.prevent="onClick"
        @keydown.space.prevent="onClick"
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
