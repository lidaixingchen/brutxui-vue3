<script setup lang="ts">
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'
import { skeletonVariants } from './skeleton-variants'
import Skeleton from './Skeleton.vue'
import SkeletonText from './SkeletonText.vue'

type SkeletonVariantProps = VariantProps<typeof skeletonVariants>

interface SkeletonCardProps {
    variant?: NonNullable<SkeletonVariantProps['variant']>
    class?: string
}

const props = withDefaults(defineProps<SkeletonCardProps>(), {
    variant: 'default',
})
</script>

<template>
    <div :class="cn('p-4 border-3 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#FFFFFF] bg-white dark:bg-gray-900', props.class)">
        <div class="space-y-4">
            <Skeleton :variant="variant" class="h-32 w-full" />
            <Skeleton :variant="variant" class="h-6 w-3/4" />
            <SkeletonText :variant="variant" :lines="2" />
            <div class="flex gap-2">
                <Skeleton :variant="variant" class="h-10 w-24" />
                <Skeleton :variant="variant" class="h-10 w-24" />
            </div>
        </div>
    </div>
</template>
