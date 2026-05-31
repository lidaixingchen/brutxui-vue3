<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'

interface CommandGroupProps {
    heading?: string
    class?: string
}

const props = defineProps<CommandGroupProps>()

const classes = computed(() =>
    cn(
        'overflow-hidden p-1',
        props.class
    )
)

const headingClasses = computed(() =>
    cn(
        'px-3 py-2 text-xs font-black uppercase tracking-wider',
        'text-gray-500 dark:text-gray-400'
    )
)
</script>

<template>
    <div :class="classes" role="group">
        <div v-if="heading" :class="headingClasses">
            {{ heading }}
        </div>
        <slot />
    </div>
</template>
