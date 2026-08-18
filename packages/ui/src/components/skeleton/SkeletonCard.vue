<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { type SkeletonVariantProps } from './skeleton-variants'
import Skeleton from './Skeleton.vue'
import SkeletonText from './SkeletonText.vue'

interface SkeletonCardProps {
    variant?: NonNullable<SkeletonVariantProps['variant']>
    label?: string
    class?: string
}

const props = withDefaults(defineProps<SkeletonCardProps>(), {
    variant: 'default',
    label: undefined,
    class: undefined,
})

const { t } = useLocale()
const resolvedLabel = computed(() => props.label?.trim() || t('spinner.loading'))

const classes = computed(() =>
    cn('p-4 border-3 border-brutal shadow-brutal bg-brutal-bg', props.class)
)
</script>

<template>
    <div :class="classes" role="status" :aria-label="resolvedLabel">
        <span class="sr-only">{{ resolvedLabel }}</span>
        <div class="space-y-4" aria-hidden="true">
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
