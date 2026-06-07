<script setup lang="ts">
import { computed } from 'vue'
import { MoreHorizontal } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { breadcrumbEllipsisVariants } from './breadcrumb-variants'
import { useLocale } from '@/composables/useLocale'

interface BreadcrumbEllipsisProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbEllipsisProps>(), {
    class: undefined,
})

const { t } = useLocale()

const classes = computed(() =>
    cn(breadcrumbEllipsisVariants(), props.class)
)
</script>

<template>
    <span
        role="presentation"
        :class="classes"
    >
        <span aria-hidden="true">
            <slot>
                <MoreHorizontal class="h-4 w-4" />
            </slot>
        </span>
        <span class="sr-only">{{ t('breadcrumb.more') }}</span>
    </span>
</template>
