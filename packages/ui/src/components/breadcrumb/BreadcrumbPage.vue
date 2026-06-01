<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'

interface BreadcrumbPageProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbPageProps>(), {
    class: '',
})

const classes = computed(() =>
    cn(
        'font-black text-brutal-fg bg-brutal-accent px-2 py-0.5 border-2 border-brutal rounded-brutal shadow-brutal-sm select-none',
        props.class
    )
)
</script>

<template>
    <span
        role="link"
        aria-disabled="true"
        aria-current="page"
        :class="classes"
    >
        <slot />
    </span>
</template>
