<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { skeletonVariants, skeletonCircleWidthVariants } from './skeleton-variants'

type SkeletonVariantProps = VariantProps<typeof skeletonVariants>

interface SkeletonProps {
    variant?: NonNullable<SkeletonVariantProps['variant']>
    size?: NonNullable<SkeletonVariantProps['size']>
    shape?: NonNullable<SkeletonVariantProps['shape']>
    /** 加载质感效果：扫描线 / ASCII 终端块 */
    effect?: NonNullable<SkeletonVariantProps['effect']>
    width?: string | number
    class?: string
}

const props = withDefaults(defineProps<SkeletonProps>(), {
    variant: 'default',
    size: 'default',
    shape: 'rect',
    effect: 'none',
    width: undefined,
    class: undefined,
})

const classes = computed(() => {
    const variantClasses = skeletonVariants({
        variant: props.variant,
        size: props.size,
        shape: props.shape,
        effect: props.effect,
    })
    const circleWidth = props.shape === 'circle'
        ? skeletonCircleWidthVariants[props.size]
        : ''
    return cn(variantClasses, circleWidth, props.class)
})

const normalizedWidth = computed(() => {
    if (props.width === undefined || props.width === null || props.width === '') return undefined
    return typeof props.width === 'number' ? `${props.width}px` : props.width
})

const style = computed(() => {
    const w = normalizedWidth.value
    if (!w) return undefined
    if (props.shape === 'circle') {
        return { width: w, height: w }
    }
    return { width: w }
})
</script>

<template>
    <div :class="classes" :style="style" role="status" aria-busy="true">
        <!-- ASCII 终端块：等宽方块字符闪烁占位（纯装饰，读屏由 role=status 表达） -->
        <span
            v-if="effect === 'ascii' && !$slots.default"
            aria-hidden="true"
            class="font-mono text-sm font-black tracking-widest text-brutal-muted-foreground select-none"
        >██████</span>
        <slot />
    </div>
</template>
