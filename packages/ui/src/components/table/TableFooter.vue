<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { tableFooterVariants } from './table-variants'

type TableFooterVariantProps = VariantProps<typeof tableFooterVariants>

interface TableFooterProps {
    variant?: NonNullable<TableFooterVariantProps['variant']>
    class?: string
}

const props = withDefaults(defineProps<TableFooterProps>(), {
    variant: 'default',
    class: undefined,
})

const classes = computed(() =>
    cn(tableFooterVariants({ variant: props.variant }), props.class)
)
</script>

<template>
    <tfoot :class="classes">
        <slot />
    </tfoot>
</template>
