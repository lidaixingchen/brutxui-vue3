<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'
import { barsSpinnerVariants } from './spinner-variants'

type BarsSpinnerSize = NonNullable<VariantProps<typeof barsSpinnerVariants>['size']>

interface BarsSpinnerProps {
    size?: BarsSpinnerSize
    color?: 'default' | 'primary' | 'secondary' | 'accent' | 'mixed'
    label?: string
    class?: string
}

const props = withDefaults(defineProps<BarsSpinnerProps>(), {
    size: 'default',
    color: 'default',
    label: 'Loading...',
})

const barWidthMap: Record<string, string> = {
    sm: 'w-1',
    default: 'w-1.5',
    lg: 'w-2',
    xl: 'w-3',
}

const colorMap: Record<string, string[]> = {
    default: ['bg-black dark:bg-white', 'bg-black dark:bg-white', 'bg-black dark:bg-white', 'bg-black dark:bg-white', 'bg-black dark:bg-white'],
    primary: ['bg-[#FF6B6B]', 'bg-[#FF6B6B]', 'bg-[#FF6B6B]', 'bg-[#FF6B6B]', 'bg-[#FF6B6B]'],
    secondary: ['bg-[#4ECDC4]', 'bg-[#4ECDC4]', 'bg-[#4ECDC4]', 'bg-[#4ECDC4]', 'bg-[#4ECDC4]'],
    accent: ['bg-[#FFE66D]', 'bg-[#FFE66D]', 'bg-[#FFE66D]', 'bg-[#FFE66D]', 'bg-[#FFE66D]'],
    mixed: ['bg-[#FF6B6B]', 'bg-[#4ECDC4]', 'bg-[#FFE66D]', 'bg-[#A855F7]', 'bg-[#FF6B6B]'],
}

const bars = computed(() => colorMap[props.color])

const barHeights = [0.7, 0.55, 0.85, 0.6, 0.75]

const containerClasses = computed(() =>
    cn(barsSpinnerVariants({ size: props.size }), props.class)
)
</script>

<template>
    <div :class="containerClasses" role="status" :aria-label="label">
        <div
            v-for="(barColor, i) in bars"
            :key="i"
            :class="cn(barWidthMap[props.size ?? 'default'], 'border border-black dark:border-white', barColor, 'animate-pulse origin-bottom')"
            :style="{
                height: `${barHeights[i] * 100}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: '400ms',
            }"
        />
        <span class="sr-only">{{ label }}</span>
    </div>
</template>
