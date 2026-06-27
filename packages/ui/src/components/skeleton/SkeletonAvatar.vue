<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { type SkeletonVariantProps } from './skeleton-variants'
import Skeleton from './Skeleton.vue'

interface SkeletonAvatarProps {
    variant?: NonNullable<SkeletonVariantProps['variant']>
    size?: 'sm' | 'default' | 'lg' | 'xl'
    class?: string
}

const props = withDefaults(defineProps<SkeletonAvatarProps>(), {
    variant: 'default',
    size: 'default',
    class: undefined,
})

const sizeClasses: Record<string, string> = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
}

const classes = computed(() => cn(sizeClasses[props.size], props.class))
</script>

<template>
    <Skeleton :variant="variant" :class="classes" />
</template>
