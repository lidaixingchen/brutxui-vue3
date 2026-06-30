<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { tableHeadVariants } from './table-variants'

type TableHeadVariantProps = VariantProps<typeof tableHeadVariants>

interface TableHeadProps {
    variant?: NonNullable<TableHeadVariantProps['variant']>
    class?: string
}

const props = withDefaults(defineProps<TableHeadProps>(), {
    variant: 'default',
    class: undefined,
})

const classes = computed(() =>
    cn(tableHeadVariants({ variant: props.variant }), props.class)
)
</script>

<template>
    <th :class="classes">
        <slot />
    </th>
</template>
