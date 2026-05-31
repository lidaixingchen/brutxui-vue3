<script setup lang="ts">
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'
import { blockSpinnerVariants } from './spinner-variants'

type DotsSpinnerSize = NonNullable<VariantProps<typeof blockSpinnerVariants>['size']>

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

const gapMap: Record<string, string> = {
    sm: 'gap-1',
    default: 'gap-2',
    lg: 'gap-3',
    xl: 'gap-4',
}

const colorMap: Record<string, string> = {
    default: 'bg-black dark:bg-white',
    primary: 'bg-[#FF6B6B]',
    secondary: 'bg-[#4ECDC4]',
    accent: 'bg-[#FFE66D]',
}
</script>

<template>
    <div :class="cn('flex items-center', gapMap[props.size ?? 'default'], props.class)" role="status" :aria-label="label">
        <div
            v-for="i in 3"
            :key="i"
            :class="cn(sizeMap[props.size ?? 'default'], 'border-2 border-black dark:border-white', colorMap[props.color], 'animate-bounce')"
            :style="{ animationDelay: `${(i - 1) * 100}ms`, animationDuration: '500ms' }"
        />
        <span class="sr-only">{{ label }}</span>
    </div>
</template>
