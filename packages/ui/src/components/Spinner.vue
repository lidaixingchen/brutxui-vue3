<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'
import { spinnerVariants } from './spinner-variants'

type SpinnerVariantProps = VariantProps<typeof spinnerVariants>

interface SpinnerProps {
    size?: NonNullable<SpinnerVariantProps['size']>
    variant?: NonNullable<SpinnerVariantProps['variant']>
    label?: string
    class?: string
}

const props = withDefaults(defineProps<SpinnerProps>(), {
    size: 'default',
    variant: 'default',
    label: 'Loading...',
    class: '',
})

const classes = computed(() =>
    cn(spinnerVariants({ size: props.size, variant: props.variant }), props.class)
)
</script>

<template>
    <div :class="classes" role="status" :aria-label="label">
        <span class="sr-only">{{ label }}</span>
    </div>
</template>
