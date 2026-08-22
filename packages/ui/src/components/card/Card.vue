<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { requestAnimationFrame } from '@/lib/env'
import { brutalHoverLiftNoX } from '@/lib/brutal-interaction-variants'
import { cardVariants } from './card-variants'

type CardVariantProps = VariantProps<typeof cardVariants>

interface CardProps {
    variant?: NonNullable<CardVariantProps['variant']>
    padding?: NonNullable<CardVariantProps['padding']>
    /** 背景纹理：蓝图方格 / 半色调点阵，与底色叠加 */
    texture?: NonNullable<CardVariantProps['texture']>
    /** HUD 装饰形态：四角十字准星（纯装饰层） */
    deco?: NonNullable<CardVariantProps['deco']>
    interactive?: boolean
    /** 禁用卡片交互：不可聚焦、aria-disabled，且不触发 activate */
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<CardProps>(), {
    variant: 'default',
    padding: 'default',
    texture: undefined,
    deco: undefined,
    interactive: false,
    disabled: false,
    class: undefined,
})

const emit = defineEmits<{
    activate: [event: Event]
}>()

const isInteractive = computed(() => props.interactive || props.variant === 'interactive')

const classes = computed(() =>
    cn(
        // 禁用时剥离 interactive 变体的交互样式（悬停/按压/手型），保持视觉禁用
        cardVariants({
            variant: props.disabled && props.variant === 'interactive' ? 'default' : props.variant,
            padding: props.padding,
            texture: props.texture,
            deco: props.deco,
        }),
        props.interactive && !props.disabled && props.variant !== 'interactive' &&
            `cursor-pointer ${brutalHoverLiftNoX} transition-all`,
        props.class
    )
)

// 键盘激活（Enter keydown / Space keyup）后，浏览器会对 role="button" 的元素合成 click，
// 用标志位吞掉这次合成 click，避免与键盘 emit 重复触发
let suppressSyntheticClick = false

// 事件目标是否为卡片内部的嵌套交互元素（如内部按钮/链接/输入框）。
// 键盘 Enter/Space 与点击事件都会从子元素冒泡到卡片根节点，命中嵌套控件时须忽略，
// 避免"子元素动作 + 卡片 activate"双重触发。
// closest 的选择器包含 [role="button"]，会命中卡片自身（根 div 同为 role="button"），
// 因此须排除 currentTarget——否则事件落在卡片内部普通元素（如 <span>）时也会被误判
function isEventFromNestedInteractive(
    target: EventTarget | null,
    currentTarget: EventTarget | null,
): boolean {
    if (target === currentTarget || !(target instanceof Element)) return false
    const nestedInteractive = target.closest('a, button, input, select, textarea, [role="button"]')
    return !!nestedInteractive && nestedInteractive !== currentTarget
}

function onKeydown(e: KeyboardEvent) {
    if (!isInteractive.value || props.disabled || e.repeat) return
    if (isEventFromNestedInteractive(e.target, e.currentTarget)) return
    if (e.key === 'Enter' || e.key === ' ') e.preventDefault()
    if (e.key === 'Enter') {
        suppressSyntheticClick = true
        emit('activate', e)
        requestAnimationFrame(() => { suppressSyntheticClick = false })
    }
}

function onKeyup(e: KeyboardEvent) {
    if (!isInteractive.value || props.disabled || e.repeat || e.key !== ' ') return
    if (isEventFromNestedInteractive(e.target, e.currentTarget)) return
    e.preventDefault()
    suppressSyntheticClick = true
    emit('activate', e)
    requestAnimationFrame(() => { suppressSyntheticClick = false })
}

function onClick(e: MouseEvent) {
    if (!isInteractive.value || props.disabled) return
    // 忽略中键/右键激活
    if (e.button !== 0) return
    if (isEventFromNestedInteractive(e.target, e.currentTarget)) return
    if (suppressSyntheticClick) {
        suppressSyntheticClick = false
        return
    }
    emit('activate', e)
}
</script>

<template>
    <div
        :class="classes"
        :role="isInteractive ? 'button' : undefined"
        :tabindex="isInteractive ? (props.disabled ? -1 : 0) : undefined"
        :aria-disabled="isInteractive && props.disabled ? true : undefined"
        @click="onClick"
        @keydown="onKeydown"
        @keyup="onKeyup"
    >
        <slot />
    </div>
</template>
