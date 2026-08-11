<script setup lang="ts">
import { computed } from 'vue'
import type { ClassValue } from 'clsx'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { injectCommandRootContext } from './command-context'

interface CommandEmptyProps {
    class?: ClassValue
}

const props = defineProps<CommandEmptyProps>()

const { t } = useLocale()
const rootContext = injectCommandRootContext()

const isRender = computed(() => rootContext.filterState.value.count === 0)

// role="status" 隐含 aria-live="polite"：搜索无结果时向屏幕阅读器播报结果已清空
const classes = computed(() =>
    cn(
        'py-8 text-center text-sm font-bold',
        'text-brutal-muted-foreground',
        props.class
    )
)
</script>

<template>
    <p v-if="isRender" :class="classes" data-slot="command-empty" role="status">
        <slot>{{ t('command.emptyText') }}</slot>
    </p>
</template>
