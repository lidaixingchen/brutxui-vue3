<script setup lang="ts">
import { computed } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'
import { cn } from '../../lib/utils'

interface BreadcrumbEllipsisProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbEllipsisProps>(), {
    class: '',
})

const classes = computed(() =>
    cn(
        'flex h-7 w-7 items-center justify-center border-2 border-brutal bg-brutal-bg text-brutal-fg shadow-brutal-sm rounded-sm transition-all hover:bg-brutal-muted active:translate-y-[1px] active:shadow-none select-none cursor-pointer',
        props.class
    )
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
