<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'

interface BreadcrumbProps {
    class?: string
}

const props = withDefaults(defineProps<BreadcrumbProps>(), {
    class: undefined,
})

const { t } = useLocale()

const rootClasses = computed(() => cn(props.class))
</script>

<template>
    <nav :aria-label="t('breadcrumb.label')" :class="rootClasses">
        <slot />
    </nav>
</template>
