<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { SelectTrigger as SelectTriggerPrimitive, SelectIcon as SelectIconPrimitive } from 'reka-ui'
import { ChevronDown } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { selectTriggerVariants } from './select-variants'

type SelectTriggerVariantProps = VariantProps<typeof selectTriggerVariants>

interface SelectTriggerProps {
    size?: NonNullable<SelectTriggerVariantProps['size']>
    disabled?: boolean
    class?: string
    iconClass?: string
}

const props = withDefaults(defineProps<SelectTriggerProps>(), {
    size: 'default',
    disabled: false,
    class: undefined,
    iconClass: undefined,
})

const classes = computed(() =>
    cn(selectTriggerVariants({ size: props.size }), props.class)
)

const iconClasses = computed(() =>
    cn('h-5 w-5 stroke-[3]', props.iconClass)
)
</script>

<template>
    <SelectTriggerPrimitive :class="classes" :disabled="disabled" aria-haspopup="listbox">
        <slot />
        <SelectIconPrimitive as-child>
            <ChevronDown :class="iconClasses" />
        </SelectIconPrimitive>
    </SelectTriggerPrimitive>
</template>
