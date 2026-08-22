<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { timelineDotVariants } from './timeline-variants'

type TimelineDotVariantProps = VariantProps<typeof timelineDotVariants>

interface TimelineDotProps {
    variant?: NonNullable<TimelineDotVariantProps['variant']>
    shape?: NonNullable<TimelineDotVariantProps['shape']>
    /** 工业 LED 脉冲光晕（status-success 色扩散，纯装饰；reduced-motion 静止） */
    led?: boolean
    class?: string
}

const props = withDefaults(defineProps<TimelineDotProps>(), {
    variant: 'accent',
    shape: 'circle',
    led: false,
    class: undefined,
})

const classes = computed(() =>
    cn(
        timelineDotVariants({ variant: props.variant, shape: props.shape }),
        props.led && 'animate-brutal-led',
        props.class,
    )
)
</script>

<template>
    <div :class="classes" aria-hidden="true">
        <span class="inline-flex items-center justify-center font-black">
            <slot />
        </span>
    </div>
</template>
