<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import Card from '../card/Card.vue'
import CardContent from '../card/CardContent.vue'
import CardHeader from '../card/CardHeader.vue'
import Button from '../button/Button.vue'
import Badge from '../badge/Badge.vue'
import EmptyState from '../empty-state/EmptyState.vue'
import type { ActionItem } from './types'

export type { ActionItem };

interface QuickActionsProps {
    title?: string
    actions?: ActionItem[]
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<QuickActionsProps>(), {
    title: undefined,
    actions: () => [],
    class: undefined,
    iconSize: 'lg',
})

const { t } = useLocale()

const emit = defineEmits<{
    'action-click': [index: number]
}>()

const rootClasses = computed(() => cn('w-full max-w-md', props.class))

const resolvedTitle = computed(() => props.title ?? t('quickActions.defaultTitle'))
const resolvedBadge = computed(() => t('quickActions.badge'))

const actionIconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <Card :class="rootClasses" variant="default">
        <CardHeader>
            <div class="flex items-center gap-2">
                <Badge variant="accent" size="sm">
{{ resolvedBadge }}
</Badge>
                <h3 class="text-lg font-black tracking-tight">
{{ resolvedTitle }}
</h3>
            </div>
        </CardHeader>
        <CardContent>
            <template v-if="actions.length > 0">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Button
                        v-for="(action, index) in actions"
                        :key="action.label"
                        :variant="action.variant ?? 'outline'"
                        class="flex flex-col items-center gap-2 h-auto py-3 px-2"
                        @click="emit('action-click', index)"
                    >
                        <component :is="action.icon" :class="actionIconClasses" />
                        <span class="text-xs font-bold">{{ action.label }}</span>
                    </Button>
                </div>
                <slot name="actions" />
            </template>
            <EmptyState v-else :title="t('quickActions.emptyTitle')" />
        </CardContent>
    </Card>
</template>
