<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'

interface BreadcrumbSeparatorProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbSeparatorProps>(), {
    class: '',
})

const classes = computed(() =>
    cn('[&>svg]:w-3.5 [&>svg]:h-3.5 font-bold text-brutal-fg/60', props.class)
)
</script>

<template>
    <li
        role="presentation"
        aria-hidden="true"
        :class="classes"
    >
        <slot>
            <span>/</span>
        </slot>
    </li>
</template>
