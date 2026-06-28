<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Label as LabelRoot } from 'reka-ui'
import { labelVariants } from './label-variants'

type LabelVariantProps = VariantProps<typeof labelVariants>

interface LabelProps {
    variant?: NonNullable<LabelVariantProps['variant']>
    size?: NonNullable<LabelVariantProps['size']>
    required?: boolean
    for?: string
    class?: string
}

const props = withDefaults(defineProps<LabelProps>(), {
    variant: 'default',
    size: 'default',
    required: false,
    for: undefined,
    class: undefined,
})

const classes = computed(() =>
    cn(labelVariants({ variant: props.variant, size: props.size }), props.class)
)
</script>

<template>
    <LabelRoot :class="classes" :for="props.for">
        <slot />
        <span v-if="required" class="text-brutal-destructive" aria-hidden="true">*</span>
    </LabelRoot>
</template>
