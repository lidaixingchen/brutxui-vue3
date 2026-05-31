<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'
import { blockSpinnerVariants } from './spinner-variants'

type BlockSpinnerSize = NonNullable<VariantProps<typeof blockSpinnerVariants>['size']>

interface BlockSpinnerProps {
    size?: BlockSpinnerSize
    color?: 'default' | 'primary' | 'secondary' | 'accent' | 'mixed'
    label?: string
    class?: string
}

const props = withDefaults(defineProps<BlockSpinnerProps>(), {
    size: 'default',
    color: 'default',
    label: 'Loading...',
})

const colorMap: Record<string, string[]> = {
    default: [
        'bg-black dark:bg-white',
        'bg-black dark:bg-white',
        'bg-black dark:bg-white',
        'bg-black dark:bg-white',
    ],
    primary: ['bg-[#FF6B6B]', 'bg-[#FF6B6B]', 'bg-[#FF6B6B]', 'bg-[#FF6B6B]'],
    secondary: ['bg-[#4ECDC4]', 'bg-[#4ECDC4]', 'bg-[#4ECDC4]', 'bg-[#4ECDC4]'],
    accent: ['bg-[#FFE66D]', 'bg-[#FFE66D]', 'bg-[#FFE66D]', 'bg-[#FFE66D]'],
    mixed: ['bg-[#FF6B6B]', 'bg-[#4ECDC4]', 'bg-[#FFE66D]', 'bg-[#A855F7]'],
}

const classes = computed(() =>
    cn(blockSpinnerVariants({ size: props.size }), props.class)
)

const blocks = computed(() => colorMap[props.color])
</script>

<template>
    <div :class="classes" role="status" :aria-label="label">
        <div
            v-for="(blockColor, i) in blocks"
            :key="i"
            :class="cn('border-2 border-black dark:border-white', blockColor, 'animate-pulse')"
            :style="{ animationDelay: `${i * 150}ms`, animationDuration: '600ms' }"
        />
        <span class="sr-only">{{ label }}</span>
    </div>
</template>
