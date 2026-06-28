<script setup lang="ts">
import { ScrollArea, ScrollBar } from 'brutx-ui-vue'
import { User, Bell, Mail, Star, Heart, Zap, Shield, Flame, Coffee, Rocket } from '@lucide/vue'

const notifications = [
    { icon: Bell, name: 'Alice Chen', action: 'liked your post', time: '2m ago', accent: 'bg-brutal-primary' },
    { icon: Mail, name: 'Bob Wang', action: 'sent you a message', time: '5m ago', accent: 'bg-brutal-secondary' },
    { icon: Star, name: 'Carol Li', action: 'starred your repo', time: '12m ago', accent: 'bg-brutal-accent' },
    { icon: Heart, name: 'David Liu', action: 'followed you', time: '30m ago', accent: 'bg-brutal-destructive' },
    { icon: Zap, name: 'Eva Zhang', action: 'mentioned you', time: '1h ago', accent: 'bg-brutal-info' },
    { icon: Shield, name: 'Frank Wu', action: 'approved your PR', time: '2h ago', accent: 'bg-brutal-success' },
    { icon: Flame, name: 'Grace He', action: 'commented on issue', time: '3h ago', accent: 'bg-brutal-primary' },
    { icon: Coffee, name: 'Henry Xu', action: 'invited you to team', time: '5h ago', accent: 'bg-brutal-secondary' },
    { icon: Rocket, name: 'Ivy Zhao', action: 'deployed to prod', time: '8h ago', accent: 'bg-brutal-accent' },
    { icon: User, name: 'Jack Sun', action: 'reviewed your code', time: '1d ago', accent: 'bg-brutal-info' },
]

const tags = Array.from({ length: 20 }, (_, i) => [`Tag ${i + 1}`, ['primary', 'secondary', 'accent', 'info', 'success'][i % 5]] as const)
</script>

<template>
    <div class="flex flex-col gap-6 w-full max-w-2xl">
        <div>
            <h3 class="text-sm font-black mb-2">通知</h3>
            <ScrollArea class="h-72 w-full rounded-brutal border-3 border-brutal">
                <div class="p-4 space-y-1">
                    <div
                        v-for="(item, i) in notifications"
                        :key="i"
                        class="flex items-center gap-3 p-3 rounded-brutal hover:bg-brutal-muted transition-colors"
                    >
                        <div :class="['h-8 w-8 flex items-center justify-center border-2 border-brutal', item.accent]">
                            <component :is="item.icon" class="h-4 w-4 stroke-[3]" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-bold truncate">
                                {{ item.name }}
                                <span class="font-medium text-brutal-muted-foreground">{{ item.action }}</span>
                            </p>
                        </div>
                        <span class="text-xs font-bold text-brutal-muted-foreground whitespace-nowrap">{{ item.time }}</span>
                    </div>
                </div>
            </ScrollArea>
        </div>

        <div>
            <h3 class="text-sm font-black mb-2">标签</h3>
            <ScrollArea class="w-full rounded-brutal border-3 border-brutal">
                <div class="flex gap-2 p-4">
                    <span
                        v-for="([label, variant], i) in tags"
                        :key="i"
                        :class="[
                            'inline-flex items-center px-3 py-1.5 text-xs font-black border-2 border-brutal whitespace-nowrap',
                            variant === 'primary' && 'bg-brutal-primary',
                            variant === 'secondary' && 'bg-brutal-secondary',
                            variant === 'accent' && 'bg-brutal-accent',
                            variant === 'info' && 'bg-brutal-info',
                            variant === 'success' && 'bg-brutal-success',
                        ]"
                    >
                        {{ label }}
                    </span>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    </div>
</template>
