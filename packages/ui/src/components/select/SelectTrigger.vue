<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { SelectTrigger as SelectTriggerPrimitive, SelectIcon as SelectIconPrimitive } from 'reka-ui'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '../../lib/utils'
import { selectTriggerVariants } from './select-variants'

type SelectTriggerVariantProps = VariantProps<typeof selectTriggerVariants>

interface SelectTriggerProps {
    size?: NonNullable<SelectTriggerVariantProps['size']>
    class?: string
}

const props = withDefaults(defineProps<SelectTriggerProps>(), {
    size: 'default',
    class: undefined,
})

const classes = computed(() =>
    cn(selectTriggerVariants({ size: props.size }), props.class)
)
</script>

<template>
    <SelectTriggerPrimitive :class="classes" aria-haspopup="listbox">
        <slot />
        <SelectIconPrimitive as-child>
            <ChevronDown class="h-5 w-5 stroke-[3]" />
        </SelectIconPrimitive>
    </SelectTriggerPrimitive>
</template>
