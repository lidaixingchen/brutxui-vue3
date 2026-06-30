<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { injectCommandRootContext } from './command-context'

interface CommandEmptyProps {
    class?: string
}

const props = defineProps<CommandEmptyProps>()

const { t } = useLocale()
const rootContext = injectCommandRootContext()

const isRender = computed(() => rootContext.filterState.value.count === 0)

const classes = computed(() =>
    cn(
        'py-8 text-center text-sm font-bold',
        'text-brutal-muted-foreground',
        props.class
    )
)
</script>

<template>
    <p v-if="isRender" :class="classes" data-slot="command-empty">
        <slot>{{ t('command.emptyText') }}</slot>
    </p>
</template>
