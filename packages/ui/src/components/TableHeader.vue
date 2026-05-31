<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'

interface TableHeaderProps {
    class?: string
}

const props = defineProps<TableHeaderProps>()

const classes = computed(() =>
    cn('bg-brutal-accent text-black [&_tr]:border-b-3 [&_tr]:border-brutal', props.class)
)
</script>

<template>
    <thead :class="classes">
        <slot />
    </thead>
</template>
