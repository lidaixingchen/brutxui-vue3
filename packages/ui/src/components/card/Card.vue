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
    interactive?: boolean
    /** 禁用卡片交互：不可聚焦、aria-disabled，且不触发 activate */
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<CardProps>(), {
    variant: 'default',
    padding: 'default',
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
        cardVariants({ variant: props.variant, padding: props.padding }),
        (props.interactive && props.variant !== 'interactive') &&
            `cursor-pointer ${brutalHoverLiftNoX} transition-all`,
        props.class
    )
)

// 键盘激活（Enter keydown / Space keyup）后，浏览器会对 role="button" 的元素合成 click，
// 用标志位吞掉这次合成 click，避免与键盘 emit 重复触发
let suppressSyntheticClick = false

function onKeydown(e: KeyboardEvent) {
    if (!isInteractive.value || props.disabled || e.repeat) return
    if (e.key === 'Enter' || e.key === ' ') e.preventDefault()
    if (e.key === 'Enter') {
        suppressSyntheticClick = true
        emit('activate', e)
        requestAnimationFrame(() => { suppressSyntheticClick = false })
    }
}

function onKeyup(e: KeyboardEvent) {
    if (!isInteractive.value || props.disabled || e.repeat || e.key !== ' ') return
    e.preventDefault()
    suppressSyntheticClick = true
    emit('activate', e)
    requestAnimationFrame(() => { suppressSyntheticClick = false })
}

function onClick(e: MouseEvent) {
    if (!isInteractive.value || props.disabled) return
    // 忽略中键/右键激活
    if (e.button !== 0) return
    // 点击来自卡片内部交互元素时忽略：避免"子元素动作 + 卡片激活"双重触发。
    // closest 的选择器包含 [role="button"]，会命中卡片自身（根 div 同为 role="button"），
    // 因此须排除 currentTarget——否则点击卡片内部普通文本（如 <span>）也会被误判为嵌套交互
    const target = e.target as HTMLElement
    if (target !== e.currentTarget) {
        const nestedInteractive = target.closest('a, button, input, select, textarea, [role="button"]')
        if (nestedInteractive && nestedInteractive !== e.currentTarget) return
    }
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
