<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { tableHeaderVariants } from './table-variants'

type TableHeaderVariantProps = VariantProps<typeof tableHeaderVariants>

interface TableHeaderProps {
    variant?: NonNullable<TableHeaderVariantProps['variant']>
    class?: string
}

const props = withDefaults(defineProps<TableHeaderProps>(), {
    variant: 'default',
    class: undefined,
})

const classes = computed(() =>
    cn(tableHeaderVariants({ variant: props.variant }), props.class)
)
</script>

<template>
    <thead :class="classes">
        <slot />
    </thead>
</template>
