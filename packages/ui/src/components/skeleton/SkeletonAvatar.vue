<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { type SkeletonVariantProps, skeletonCircleWidthVariants } from './skeleton-variants'
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

const classes = computed(() =>
    cn(skeletonCircleWidthVariants[props.size], props.class)
)
</script>

<template>
    <Skeleton :variant="variant" :size="size" :class="classes" />
</template>
