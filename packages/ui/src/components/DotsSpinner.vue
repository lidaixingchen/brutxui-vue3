<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'
import { dotsSpinnerVariants } from './spinner-variants'

type DotsSpinnerSize = NonNullable<VariantProps<typeof dotsSpinnerVariants>['size']>

interface DotsSpinnerProps {
    size?: DotsSpinnerSize
    color?: 'default' | 'primary' | 'secondary' | 'accent'
    label?: string
    class?: string
}

const props = withDefaults(defineProps<DotsSpinnerProps>(), {
    size: 'default',
    color: 'default',
    label: 'Loading...',
})

const sizeMap: Record<string, string> = {
    sm: 'h-1.5 w-1.5',
    default: 'h-2.5 w-2.5',
    lg: 'h-3.5 w-3.5',
    xl: 'h-5 w-5',
}

const colorMap: Record<string, string> = {
    default: 'bg-black dark:bg-white',
    primary: 'bg-[#FF6B6B]',
    secondary: 'bg-[#4ECDC4]',
    accent: 'bg-[#FFE66D]',
}

const containerClasses = computed(() =>
    cn(dotsSpinnerVariants({ size: props.size }), props.class)
)
</script>

<template>
    <div :class="containerClasses" role="status" :aria-label="label">
        <div
            v-for="i in 3"
            :key="i"
            :class="cn(sizeMap[props.size ?? 'default'], 'border-2 border-black dark:border-white', colorMap[props.color], 'animate-bounce')"
            :style="{ animationDelay: `${(i - 1) * 100}ms`, animationDuration: '500ms' }"
        />
        <span class="sr-only">{{ label }}</span>
    </div>
</template>
