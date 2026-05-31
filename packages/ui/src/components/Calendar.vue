<script setup lang="ts">
import { computed } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '../lib/utils'

const calendarVariants = cva(
    ['p-3'],
    {
        variants: {},
        defaultVariants: {},
    }
)

interface CalendarProps {
    class?: string
}

const props = defineProps<CalendarProps>()

const classes = computed(() =>
    cn(calendarVariants(), props.class)
)
</script>

<template>
    <div :class="classes">
        <p>Calendar placeholder - will be implemented in Phase 3</p>
    </div>
</template>
