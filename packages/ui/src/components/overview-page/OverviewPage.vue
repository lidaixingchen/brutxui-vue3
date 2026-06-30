<script setup lang="ts">
import { computed } from 'vue'
import { Activity } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import DashboardStats from '../dashboard-stats/DashboardStats.vue'
import type { StatItem } from '../dashboard-stats/DashboardStats.vue'
import Card from '../card/Card.vue'
import CardHeader from '../card/CardHeader.vue'
import CardTitle from '../card/CardTitle.vue'
import CardContent from '../card/CardContent.vue'
import EmptyState from '../empty-state/EmptyState.vue'
import type { OverviewStat } from './types'

export type { OverviewStat };

interface OverviewPageProps {
    title?: string
    stats?: OverviewStat[]
    class?: string
}

const props = withDefaults(defineProps<OverviewPageProps>(), {
    title: undefined,
    stats: () => [],
    class: undefined,
})

const { t } = useLocale()

const emit = defineEmits<{
    'stat-click': [index: number]
}>()

const rootClasses = computed(() => cn('w-full max-w-6xl mx-auto p-6', props.class))

const resolvedTitle = computed(() => props.title ?? t('overviewPage.defaultTitle'))
const resolvedRecentActivity = computed(() => t('overviewPage.recentActivity'))
const resolvedQuickStats = computed(() => t('overviewPage.quickStats'))

const dashboardStats = computed<StatItem[]>(() =>
    props.stats.map((stat) => ({
        title: stat.title,
        value: stat.value,
        description: '',
        change: stat.change,
        trend: stat.trend,
        icon: Activity,
    }))
)
</script>

<template>
    <div :class="rootClasses">
        <slot name="header">
            <h1 class="text-3xl font-black tracking-tight mb-8">
{{ resolvedTitle }}
</h1>
        </slot>

        <DashboardStats :stats="dashboardStats" @stat-click="(index) => emit('stat-click', index)" />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card variant="default">
                <CardHeader>
                    <CardTitle>{{ resolvedRecentActivity }}</CardTitle>
                </CardHeader>
                <CardContent>
                    <slot />
                </CardContent>
            </Card>
            <Card variant="default">
                <CardHeader>
                    <CardTitle>{{ resolvedQuickStats }}</CardTitle>
                </CardHeader>
                <CardContent>
                    <template v-if="stats.length > 0">
                        <div class="space-y-3">
                            <div
                                v-for="(stat, index) in stats"
                                :key="stat.title"
                                class="flex items-center justify-between p-3 bg-brutal-muted border-3 border-brutal shadow-brutal-sm cursor-pointer hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all"
                                tabindex="0"
                                @click="emit('stat-click', index)"
                                @keydown.enter="emit('stat-click', index)"
                            >
                                <span class="font-bold text-sm">{{ stat.title }}</span>
                                <span class="font-black">{{ stat.value }}</span>
                            </div>
                        </div>
                    </template>
                    <EmptyState v-else :title="t('overviewPage.emptyTitle')" />
                </CardContent>
            </Card>
        </div>

        <slot name="footer" />
    </div>
</template>
