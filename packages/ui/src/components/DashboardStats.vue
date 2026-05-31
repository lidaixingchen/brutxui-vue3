<script setup lang="ts">
import { computed, type Component } from 'vue'
import { ArrowUpRight, ArrowDownRight } from 'lucide-vue-next'
import { cn } from '../lib/utils'
import Card from './Card.vue'
import CardHeader from './CardHeader.vue'
import CardContent from './CardContent.vue'
import CardDescription from './CardDescription.vue'
import Badge from './Badge.vue'

export interface StatItem {
    title: string
    value: string
    description: string
    change: string
    trend: 'up' | 'down' | 'neutral'
    icon: Component
    accentColor: string
    progress?: number
}

interface DashboardStatsProps {
    stats?: StatItem[]
    title?: string
    subtitle?: string
    class?: string
}

const props = withDefaults(defineProps<DashboardStatsProps>(), {
    title: 'Overview Performance',
    stats: () => [],
})

const rootClasses = computed(() => cn('w-full max-w-5xl mx-auto', props.class))
</script>

<template>
    <div :class="rootClasses">
        <div class="mb-8">
            <h2 class="text-2xl font-black tracking-tight">{{ title }}</h2>
            <p v-if="subtitle" class="mt-1 text-gray-600 dark:text-gray-400 font-medium">{{ subtitle }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card v-for="stat in stats" :key="stat.title" variant="default">
                <CardHeader class="pb-2">
                    <div class="flex items-center justify-between">
                        <CardDescription>{{ stat.title }}</CardDescription>
                        <div class="h-8 w-8 flex items-center justify-center border-2 border-brutal" :style="{ backgroundColor: stat.accentColor }">
                            <component :is="stat.icon" class="h-4 w-4 stroke-[3]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-black">{{ stat.value }}</div>
                    <div class="flex items-center gap-2 mt-1">
                        <component :is="stat.trend === 'up' ? ArrowUpRight : ArrowDownRight" :class="cn('h-4 w-4 stroke-[3]', stat.trend === 'up' ? 'text-brutal-success' : 'text-brutal-destructive')" />
                        <Badge :variant="stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'danger' : 'default'" size="sm">{{ stat.change }}</Badge>
                    </div>
                    <p class="text-xs text-gray-500 mt-1 font-medium">{{ stat.description }}</p>
                    <div v-if="stat.progress !== undefined" class="mt-3 h-2 bg-brutal-muted border border-brutal overflow-hidden">
                        <div class="h-full transition-all" :style="{ width: `${stat.progress}%`, backgroundColor: stat.accentColor }" />
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>
