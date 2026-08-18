<script setup lang="ts">
import { type SkeletonVariantProps } from './skeleton-variants'
import Skeleton from './Skeleton.vue'

interface SkeletonAvatarProps {
    variant?: NonNullable<SkeletonVariantProps['variant']>
    size?: NonNullable<SkeletonVariantProps['size']>
    class?: string
}

const props = withDefaults(defineProps<SkeletonAvatarProps>(), {
    variant: 'default',
    size: 'default',
    class: undefined,
})
</script>

<template>
    <Skeleton shape="circle" :variant="props.variant" :size="props.size" :class="props.class" />
</template>
