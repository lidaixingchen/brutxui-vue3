<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { breadcrumbListVariants } from './breadcrumb-variants'

interface BreadcrumbListProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbListProps>(), {
    class: undefined,
})

const classes = computed(() =>
    cn(breadcrumbListVariants(), props.class)
)
</script>

<template>
    <ol class="breadcrumb-list" :class="classes">
        <slot />
    </ol>
</template>
