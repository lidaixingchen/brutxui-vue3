<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'

interface Props {
    align?: 'center' | 'start' | 'stretch'
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    align: 'center',
    class: '',
})

const containerClass = computed(() =>
    cn(
        'p-4 sm:p-8 flex min-h-[150px] sm:min-h-[200px] bg-gray-50 dark:bg-gray-900 border-3 border-brutal overflow-x-auto transition-all duration-150',
        props.align === 'center'
            ? 'items-center justify-center'
            : props.align === 'start'
              ? 'items-start justify-start'
              : 'items-stretch justify-start',
        props.class,
    ),
)

const innerClass = computed(() =>
    cn(
        'w-full gap-2 sm:gap-4',
        props.align === 'center'
            ? 'flex items-center justify-center flex-wrap'
            : 'flex flex-col items-stretch',
    ),
)
</script>

<template>
    <div :class="containerClass">
        <div :class="innerClass">
            <slot />
        </div>
    </div>
</template>
