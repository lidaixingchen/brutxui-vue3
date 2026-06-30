<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { tableRowVariants } from './table-variants'

interface TableRowProps {
    class?: string
}

const props = defineProps<TableRowProps>()

const classes = computed(() =>
    cn(tableRowVariants(), props.class)
)
</script>

<template>
    <tr :class="classes">
        <slot />
    </tr>
</template>
