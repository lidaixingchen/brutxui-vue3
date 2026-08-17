<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { tableCaptionVariants } from './table-variants'

interface TableCaptionProps {
    class?: string
}

const props = defineProps<TableCaptionProps>()

const classes = computed(() =>
    cn(tableCaptionVariants(), props.class)
)
</script>

<template>
    <caption :class="classes">
        <slot />
    </caption>
</template>
