<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'

interface CommandEmptyProps {
    class?: string
}

const props = defineProps<CommandEmptyProps>()

const classes = computed(() =>
    cn(
        'py-8 text-center text-sm font-bold',
        'text-brutal-muted-foreground',
        props.class
    )
)
</script>

<template>
    <p :class="classes" data-slot="command-empty">
        <slot>No results found.</slot>
    </p>
</template>
