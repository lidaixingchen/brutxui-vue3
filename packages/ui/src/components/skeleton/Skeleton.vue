<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { skeletonVariants, skeletonCircleWidthVariants } from './skeleton-variants'

type SkeletonVariantProps = VariantProps<typeof skeletonVariants>

interface SkeletonProps {
    variant?: NonNullable<SkeletonVariantProps['variant']>
    size?: NonNullable<SkeletonVariantProps['size']>
    shape?: NonNullable<SkeletonVariantProps['shape']>
    width?: string
    class?: string
}

const props = withDefaults(defineProps<SkeletonProps>(), {
    variant: 'default',
    size: 'default',
    shape: 'rect',
    width: undefined,
    class: undefined,
})

const classes = computed(() => {
    const variantClasses = skeletonVariants({
        variant: props.variant,
        size: props.size,
        shape: props.shape,
    })
    const circleWidth = props.shape === 'circle'
        ? skeletonCircleWidthVariants[props.size]
        : ''
    return cn(variantClasses, circleWidth, props.class)
})

const style = computed(() => {
    if (!props.width) return undefined
    if (props.shape === 'circle') {
        return { width: props.width, height: props.width }
    }
    return { width: props.width }
})
</script>

<template>
    <div :class="classes" :style="style" role="status" aria-busy="true">
        <slot />
    </div>
</template>
