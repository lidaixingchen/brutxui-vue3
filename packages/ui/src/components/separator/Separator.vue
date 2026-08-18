<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { hasSlotContent } from '@/lib/slot-utils'
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

// 检查 slot 是否实际包含内容，过滤空文本、空白字符和注释节点
const hasLabel = computed(() => {
    const defaultSlot = slots.default
    if (!defaultSlot) return false
    return hasSlotContent(defaultSlot())
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
        :aria-orientation="decorative ? undefined : 'horizontal'"
        data-orientation="horizontal"
    >
        <div :class="lineClasses" aria-hidden="true" />
        <slot />
        <div :class="lineClasses" aria-hidden="true" />
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
