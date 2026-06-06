<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { skeletonVariants } from './skeleton-variants'

type SkeletonVariantProps = VariantProps<typeof skeletonVariants>

interface SkeletonProps {
    variant?: NonNullable<SkeletonVariantProps['variant']>
    class?: string
}

const props = withDefaults(defineProps<SkeletonProps>(), {
    variant: 'default',
    class: undefined,
})

const classes = computed(() =>
    cn(skeletonVariants({ variant: props.variant }), props.class)
)
</script>

<template>
    <div :class="classes" role="status" aria-busy="true">
        <slot />
    </div>
</template>
