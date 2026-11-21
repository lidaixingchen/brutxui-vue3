<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { breadcrumbSeparatorVariants } from './breadcrumb-variants'

interface BreadcrumbSeparatorProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbSeparatorProps>(), {
    class: undefined,
})

const classes = computed(() =>
    cn(breadcrumbSeparatorVariants(), props.class)
)
</script>

<template>
    <li
        aria-hidden="true"
        data-brutx-breadcrumb-separator
        :class="classes"
    >
        <wbr>
        <span class="inline-flex w-(--brutx-breadcrumb-separator-width) items-center justify-center align-middle">
            <slot>/</slot>
        </span>
    </li>
</template>
