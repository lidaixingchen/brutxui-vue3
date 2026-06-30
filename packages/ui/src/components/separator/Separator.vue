<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Separator as SeparatorPrimitive } from 'reka-ui'
import { separatorVariants, separatorLineVariants } from './separator-variants'

type SeparatorVariantProps = VariantProps<typeof separatorVariants>

interface SeparatorProps {
    variant?: NonNullable<SeparatorVariantProps['variant']>
    size?: NonNullable<SeparatorVariantProps['size']>
    orientation?: NonNullable<SeparatorVariantProps['orientation']>
    decorative?: boolean
    class?: string
}

const props = withDefaults(defineProps<SeparatorProps>(), {
    variant: 'default',
    size: 'default',
    orientation: 'horizontal',
    decorative: true,
    class: undefined,
})

const slots = useSlots()

// 检查 slot 是否实际包含内容，避免空 slot 被误判为有内容
const hasLabel = computed(() => {
    const defaultSlot = slots.default
    if (!defaultSlot) return false
    // 检查 slot 是否实际包含内容
    const vnodes = defaultSlot()
    return vnodes.length > 0
})

const isTextSeparator = computed(() => props.orientation === 'horizontal' && hasLabel.value)

const classes = computed(() =>
    cn(separatorVariants({ variant: props.variant, size: props.size, orientation: props.orientation }), props.class)
)

// 文字分隔线模式下，props.class 应用到线条上而非 wrapper，
// 与非文字模式下 props.class 应用到分隔线元素上的行为保持一致
const lineClasses = computed(() =>
    cn(separatorLineVariants({ variant: props.variant, size: props.size }), props.class)
)

const wrapperClasses = 'flex items-center gap-3 w-full'
</script>

<template>
    <div
        v-if="isTextSeparator"
        :class="wrapperClasses"
        :role="decorative ? 'none' : 'separator'"
        data-orientation="horizontal"
    >
        <div :class="lineClasses" />
        <slot />
        <div :class="lineClasses" />
    </div>
    <SeparatorPrimitive
        v-else
        :orientation="orientation"
        :decorative="decorative"
        :class="classes"
    >
        <slot />
    </SeparatorPrimitive>
</template>
