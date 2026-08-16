<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { RadioGroupItem as RadioGroupItemPrimitive, RadioGroupIndicator as RadioGroupIndicatorPrimitive } from 'reka-ui'
import { Square } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { radioGroupItemVariants } from './radio-group-variants'

type RadioGroupItemVariantProps = VariantProps<typeof radioGroupItemVariants>

interface RadioGroupItemProps {
    value: string
    disabled?: boolean
    class?: string
    variant?: NonNullable<RadioGroupItemVariantProps['variant']>
    size?: NonNullable<RadioGroupItemVariantProps['size']>
}

const props = withDefaults(defineProps<RadioGroupItemProps>(), {
    disabled: false,
    variant: 'default',
    size: 'default',
    class: undefined,
})

const classes = computed(() =>
    cn(radioGroupItemVariants({ variant: props.variant, size: props.size }), props.class)
)

const iconSizeClasses = computed(() => {
    if (props.size === 'sm') return 'h-2 w-2'
    if (props.size === 'lg') return 'h-3.5 w-3.5'
    return 'h-2.5 w-2.5'
})
</script>

<template>
    <RadioGroupItemPrimitive :value="value" :disabled="disabled" :class="classes">
        <RadioGroupIndicatorPrimitive class="flex items-center justify-center">
            <Square :class="cn(iconSizeClasses, 'fill-current stroke-none')" />
        </RadioGroupIndicatorPrimitive>
    </RadioGroupItemPrimitive>
</template>
