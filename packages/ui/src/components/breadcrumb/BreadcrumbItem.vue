<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'

interface BreadcrumbItemProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbItemProps>(), {
    class: '',
})

const classes = computed(() =>
    cn('inline-flex items-center gap-1.5', props.class)
)
</script>

<template>
    <li :class="classes">
        <slot />
    </li>
</template>
