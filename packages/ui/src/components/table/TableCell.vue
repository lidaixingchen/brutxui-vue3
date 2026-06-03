<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { tableCellVariants } from './table-variants'

interface TableCellProps {
    class?: string
}

const props = defineProps<TableCellProps>()

const classes = computed(() =>
    cn(tableCellVariants(), props.class)
)
</script>

<template>
    <td :class="classes">
        <slot />
    </td>
</template>
