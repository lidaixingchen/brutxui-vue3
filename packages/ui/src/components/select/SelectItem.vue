<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { SelectItem as SelectItemPrimitive, SelectItemIndicator as SelectItemIndicatorPrimitive, SelectItemText as SelectItemTextPrimitive } from 'reka-ui'
import { Check } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { selectItemVariants } from './select-variants'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'

type SelectItemVariantProps = VariantProps<typeof selectItemVariants>

interface SelectItemProps {
    value: string
    disabled?: boolean
    variant?: NonNullable<SelectItemVariantProps['variant']>
    class?: string
    indicatorClass?: string
    iconClass?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<SelectItemProps>(), {
    disabled: false,
    variant: 'default',
    class: undefined,
    indicatorClass: undefined,
    iconClass: undefined,
    iconSize: 'default',
})

const classes = computed(() =>
    cn(selectItemVariants({ variant: props.variant }), props.class)
)

const indicatorClasses = computed(() =>
    cn('absolute left-2 flex h-4 w-4 items-center justify-center', props.indicatorClass)
)

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]', props.iconClass)
)
</script>

<template>
    <SelectItemPrimitive :value="value" :disabled="disabled" :class="classes">
        <span :class="indicatorClasses">
            <SelectItemIndicatorPrimitive>
                <Check :class="iconClasses" />
            </SelectItemIndicatorPrimitive>
        </span>
        <SelectItemTextPrimitive>
            <slot />
        </SelectItemTextPrimitive>
    </SelectItemPrimitive>
</template>
