<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { SelectTrigger as SelectTriggerPrimitive, SelectIcon as SelectIconPrimitive } from 'reka-ui'
import { ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { selectTriggerVariants } from './select-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

type SelectTriggerVariantProps = VariantProps<typeof selectTriggerVariants>

interface SelectTriggerProps {
    size?: NonNullable<SelectTriggerVariantProps['size']>
    variant?: NonNullable<SelectTriggerVariantProps['variant']>
    errorMessage?: string
    disabled?: boolean
    class?: string
    iconClass?: string
}

const props = withDefaults(defineProps<SelectTriggerProps>(), {
    size: 'default',
    variant: 'default',
    errorMessage: undefined,
    disabled: false,
    class: undefined,
    iconClass: undefined,
})

const SIZE_TO_ICON: Record<NonNullable<SelectTriggerVariantProps['size']>, IconSize> = {
    sm: 'sm',
    default: 'default',
    lg: 'lg',
}

const classes = computed(() =>
    cn(selectTriggerVariants({ size: props.size, variant: props.variant }), props.class)
)

const iconClasses = computed(() =>
    cn(
        iconSizeVariants({ size: SIZE_TO_ICON[props.size] }),
        'stroke-[3]',
        props.iconClass,
    )
)
</script>

<template>
    <div class="w-full">
        <SelectTriggerPrimitive :class="classes" :disabled="disabled" aria-haspopup="listbox">
            <slot />
            <SelectIconPrimitive as-child>
                <ChevronDown :class="iconClasses" />
            </SelectIconPrimitive>
        </SelectTriggerPrimitive>
        <p
            v-if="variant === 'error' && errorMessage"
            class="text-sm text-brutal-danger mt-1"
            role="alert"
        >
            {{ errorMessage }}
        </p>
    </div>
</template>
