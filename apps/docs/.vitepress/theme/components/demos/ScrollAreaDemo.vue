<script setup lang="ts">
import { ScrollArea, ScrollBar } from 'brutx-ui-vue'
import { User, Bell, Mail, Star, Heart, Zap, Shield, Flame, Coffee, Rocket } from '@lucide/vue'

const notifications = [
    { icon: Bell, name: 'Alice Chen', action: '赞了你的帖子', time: '2 分钟前', accent: 'bg-brutal-primary' },
    { icon: Mail, name: 'Bob Wang', action: '给你发了消息', time: '5 分钟前', accent: 'bg-brutal-secondary' },
    { icon: Star, name: 'Carol Li', action: '收藏了你的仓库', time: '12 分钟前', accent: 'bg-brutal-accent' },
    { icon: Heart, name: 'David Liu', action: '关注了你', time: '30 分钟前', accent: 'bg-brutal-destructive' },
    { icon: Zap, name: 'Eva Zhang', action: '提到了你', time: '1 小时前', accent: 'bg-brutal-info' },
    { icon: Shield, name: 'Frank Wu', action: '批准了你的 PR', time: '2 小时前', accent: 'bg-brutal-success' },
    { icon: Flame, name: 'Grace He', action: '评论了议题', time: '3 小时前', accent: 'bg-brutal-primary' },
    { icon: Coffee, name: 'Henry Xu', action: '邀请你加入团队', time: '5 小时前', accent: 'bg-brutal-secondary' },
    { icon: Rocket, name: 'Ivy Zhao', action: '部署到生产环境', time: '8 小时前', accent: 'bg-brutal-accent' },
    { icon: User, name: 'Jack Sun', action: '审查了你的代码', time: '1 天前', accent: 'bg-brutal-info' },
]

const tags = Array.from({ length: 20 }, (_, i) => [`标签 ${i + 1}`, ['primary', 'secondary', 'accent', 'info', 'success'][i % 5]] as const)
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

        <div>
            <h3 class="text-sm font-black mb-2">变体</h3>
            <div class="flex flex-wrap gap-4">
                <div class="space-y-1">
                    <span class="text-xs font-bold">default</span>
                    <ScrollArea variant="default" class="h-48 w-40 rounded-brutal border-3 border-brutal">
                        <div class="p-3 space-y-1">
                            <div v-for="n in 12" :key="n" class="text-xs font-medium">项目 {{ n }}</div>
                        </div>
                    </ScrollArea>
                </div>
                <div class="space-y-1">
                    <span class="text-xs font-bold">primary</span>
                    <ScrollArea variant="primary" class="h-48 w-40 rounded-brutal border-3 border-brutal">
                        <div class="p-3 space-y-1">
                            <div v-for="n in 12" :key="n" class="text-xs font-medium">项目 {{ n }}</div>
                        </div>
                    </ScrollArea>
                </div>
                <div class="space-y-1">
                    <span class="text-xs font-bold">accent</span>
                    <ScrollArea variant="accent" class="h-48 w-40 rounded-brutal border-3 border-brutal">
                        <div class="p-3 space-y-1">
                            <div v-for="n in 12" :key="n" class="text-xs font-medium">项目 {{ n }}</div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-2">尺寸</h3>
            <div class="flex flex-wrap items-start gap-4">
                <div class="space-y-1">
                    <span class="text-xs font-bold">sm</span>
                    <ScrollArea size="sm" class="h-48 w-40 rounded-brutal border-3 border-brutal">
                        <div class="p-3 space-y-1">
                            <div v-for="n in 12" :key="n" class="text-xs font-medium">项目 {{ n }}</div>
                        </div>
                    </ScrollArea>
                </div>
                <div class="space-y-1">
                    <span class="text-xs font-bold">default</span>
                    <ScrollArea size="default" class="h-48 w-40 rounded-brutal border-3 border-brutal">
                        <div class="p-3 space-y-1">
                            <div v-for="n in 12" :key="n" class="text-xs font-medium">项目 {{ n }}</div>
                        </div>
                    </ScrollArea>
                </div>
                <div class="space-y-1">
                    <span class="text-xs font-bold">lg</span>
                    <ScrollArea size="lg" class="h-48 w-40 rounded-brutal border-3 border-brutal">
                        <div class="p-3 space-y-1">
                            <div v-for="n in 12" :key="n" class="text-xs font-medium">项目 {{ n }}</div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    </div>
</template>
