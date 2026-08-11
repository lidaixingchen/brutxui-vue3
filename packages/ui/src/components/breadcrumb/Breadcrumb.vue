<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
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
    <nav :aria-label="t('breadcrumb.label') || undefined" :class="rootClasses">
        <!-- 翻译缺失/返回空串时省略 aria-label，避免无意义的空可访问名称 -->
        <slot />
    </nav>
</template>
