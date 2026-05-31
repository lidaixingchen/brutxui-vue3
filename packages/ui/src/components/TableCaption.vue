<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'

interface TableCaptionProps {
    class?: string
}

const props = defineProps<TableCaptionProps>()

const classes = computed(() =>
    cn('mt-4 text-sm font-bold text-gray-600 dark:text-gray-400', props.class)
)
</script>

<template>
    <caption :class="classes">
        <slot />
    </caption>
</template>
