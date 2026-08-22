<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { tableHeaderVariants } from './table-variants'

type TableHeaderVariantProps = VariantProps<typeof tableHeaderVariants>

interface TableHeaderProps {
    variant?: NonNullable<TableHeaderVariantProps['variant']>
    /** 表头底纹：工程剖面线 / 报刊点阵 */
    texture?: NonNullable<TableHeaderVariantProps['texture']>
    class?: string
}

const props = withDefaults(defineProps<TableHeaderProps>(), {
    variant: 'default',
    texture: 'none',
    class: undefined,
})

const classes = computed(() =>
    cn(tableHeaderVariants({ variant: props.variant, texture: props.texture }), props.class)
)
</script>

<template>
    <thead :class="classes">
        <slot />
    </thead>
</template>
