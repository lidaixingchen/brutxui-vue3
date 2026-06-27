<script setup lang="ts">
import { OverviewPage } from 'brutx-ui-vue'
import type { OverviewStat } from 'brutx-ui-vue'

const stats: OverviewStat[] = [
    { title: '总收入', value: '¥128,430', change: '+12.5%', trend: 'up' },
    { title: '活跃用户', value: '2,840', change: '+8.2%', trend: 'up' },
    { title: '转化率', value: '3.6%', change: '-0.4%', trend: 'down' },
    { title: '跳出率', value: '24.1%', change: '+0.1%', trend: 'neutral' },
]

const recentActivities = [
    { title: '新用户注册', time: '2 分钟前', badge: '新', badgeClass: 'bg-brutal-primary text-brutal-primary-foreground' },
    { title: '订单完成', time: '15 分钟前', badge: '成功', badgeClass: 'bg-green-500 text-white' },
    { title: '收到付款', time: '32 分钟前', badge: '信息', badgeClass: 'bg-blue-500 text-white' },
    { title: '系统更新', time: '1 小时前', badge: '警告', badgeClass: 'bg-yellow-500 text-black' },
]
</script>

<template>
    <div class="w-full overflow-x-auto">
        <OverviewPage :stats="stats">
            <div class="space-y-3">
                <div
                    v-for="(item, index) in recentActivities"
                    :key="index"
                    class="flex items-center gap-3 p-3 bg-brutal-muted border-3 border-brutal shadow-brutal-sm"
                >
                    <div class="flex-1">
                        <p class="font-bold text-sm">{{ item.title }}</p>
                        <p class="text-xs text-brutal-fg/60">{{ item.time }}</p>
                    </div>
                    <span
                        class="px-2 py-1 text-xs font-black border-2 border-brutal"
                        :class="item.badgeClass"
                    >
                        {{ item.badge }}
                    </span>
                </div>
            </div>
        </OverviewPage>
    </div>
</template>
