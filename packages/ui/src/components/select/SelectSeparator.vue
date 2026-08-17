<script setup lang="ts">
import { computed } from 'vue'
import { SelectSeparator as SelectSeparatorPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

interface SelectSeparatorProps {
    decorative?: boolean
    class?: string
}

const props = withDefaults(defineProps<SelectSeparatorProps>(), {
    decorative: true,
    class: undefined,
})

const classes = computed(() =>
    cn('-mx-1 my-1 h-[var(--sep-thickness,var(--brutal-border-width,3px))] bg-brutal-fg', props.class)
)
</script>

<template>
    <SelectSeparatorPrimitive :decorative="decorative" :class="classes" />
</template>
