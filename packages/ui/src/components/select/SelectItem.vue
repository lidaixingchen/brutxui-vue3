<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { SelectItem as SelectItemPrimitive, SelectItemIndicator as SelectItemIndicatorPrimitive, SelectItemText as SelectItemTextPrimitive } from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { cn } from '../../lib/utils'
import { selectItemVariants } from './select-variants'

type SelectItemVariantProps = VariantProps<typeof selectItemVariants>

interface SelectItemProps {
    value: string
    disabled?: boolean
    variant?: NonNullable<SelectItemVariantProps['variant']>
    class?: string
}

const props = withDefaults(defineProps<SelectItemProps>(), {
    disabled: false,
    variant: 'default',
    class: undefined,
})

const classes = computed(() =>
    cn(selectItemVariants({ variant: props.variant }), props.class)
)
</script>

<template>
    <SelectItemPrimitive :value="value" :disabled="disabled" :class="classes">
        <span class="absolute left-2 flex h-4 w-4 items-center justify-center">
            <SelectItemIndicatorPrimitive>
                <Check class="h-4 w-4 stroke-[3]" />
            </SelectItemIndicatorPrimitive>
        </span>
        <SelectItemTextPrimitive>
            <slot />
        </SelectItemTextPrimitive>
    </SelectItemPrimitive>
</template>
