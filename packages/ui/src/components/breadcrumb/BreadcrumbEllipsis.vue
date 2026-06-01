<script setup lang="ts">
import { computed } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'
import { cn } from '../../lib/utils'
import { breadcrumbEllipsisVariants } from './breadcrumb-variants'

interface BreadcrumbEllipsisProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbEllipsisProps>(), {
    class: '',
})

const classes = computed(() =>
    cn(breadcrumbEllipsisVariants(), props.class)
)
</script>

<template>
    <span
        role="presentation"
        aria-hidden="true"
        :class="classes"
    >
        <slot>
            <MoreHorizontal class="h-4 w-4 stroke-[3]" />
        </slot>
        <span class="sr-only">More</span>
    </span>
</template>
