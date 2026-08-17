<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { tableBodyVariants } from './table-variants'

interface TableBodyProps {
    class?: string
}

const props = defineProps<TableBodyProps>()

const classes = computed(() =>
    cn(tableBodyVariants(), props.class)
)
</script>

<template>
    <tbody :class="classes">
        <slot />
    </tbody>
</template>
