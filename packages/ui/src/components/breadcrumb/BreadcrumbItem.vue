<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { breadcrumbItemClasses } from './breadcrumb-variants'

interface BreadcrumbItemProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbItemProps>(), {
    class: undefined,
})

const classes = computed(() =>
    cn(breadcrumbItemClasses, props.class)
)
</script>

<template>
    <li :class="classes">
        <slot />
    </li>
</template>
