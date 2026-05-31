<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'

interface CommandEmptyProps {
    class?: string
}

const props = defineProps<CommandEmptyProps>()

const classes = computed(() =>
    cn(
        'py-8 text-center text-sm font-bold',
        'text-gray-500 dark:text-gray-400',
        props.class
    )
)
</script>

<template>
    <p :class="classes">
        <slot>No results found.</slot>
    </p>
</template>
