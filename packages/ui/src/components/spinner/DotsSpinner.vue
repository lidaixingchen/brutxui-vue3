<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { dotsSpinnerVariants, SPINNER_COLOR_CLASSES } from './spinner-variants'

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
    label: undefined,
    class: undefined,
})

const { t } = useLocale()

const resolvedLabel = computed(() => props.label ?? t('spinner.loading'))

const sizeMap: Record<string, string> = {
    sm: 'h-1.5 w-1.5',
    default: 'h-2.5 w-2.5',
    lg: 'h-3.5 w-3.5',
    xl: 'h-5 w-5',
}

const DOT_ANIMATION_DELAY_INCREMENT_MS = 100
const DOT_ANIMATION_DURATION_MS = 500

const containerClasses = computed(() =>
    cn(dotsSpinnerVariants({ size: props.size }), props.class)
)

const dotClasses = computed(() =>
    cn(sizeMap[props.size ?? 'default'], 'border-3 border-brutal', SPINNER_COLOR_CLASSES[props.color], 'animate-bounce')
)
</script>

<template>
    <div :class="containerClasses" role="status" :aria-label="resolvedLabel">
        <div
            v-for="i in 3"
            :key="i"
            :class="dotClasses"
            :style="{ animationDelay: `${(i - 1) * DOT_ANIMATION_DELAY_INCREMENT_MS}ms`, animationDuration: `${DOT_ANIMATION_DURATION_MS}ms` }"
        />
        <span class="sr-only">{{ resolvedLabel }}</span>
    </div>
</template>
