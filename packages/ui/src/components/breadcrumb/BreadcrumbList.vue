<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'

interface BreadcrumbListProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbListProps>(), {
    class: '',
})

const classes = computed(() =>
    cn(
        'flex flex-wrap items-center gap-1.5 break-words text-sm font-black text-brutal-fg sm:gap-2.5',
        props.class
    )
)
</script>

<template>
    <ol :class="classes">
        <slot />
    </ol>
</template>
