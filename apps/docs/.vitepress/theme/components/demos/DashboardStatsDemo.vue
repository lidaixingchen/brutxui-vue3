<script setup lang="ts">
import { DashboardStats } from 'brutx-ui-vue'
import { DollarSign, Users, Activity, ShoppingCart } from '@lucide/vue'
import type { StatItem } from 'brutx-ui-vue'

const stats: StatItem[] = [
    {
        title: '收入',
        value: '$45,231',
        description: '较上月',
        change: '+20.1%',
        trend: 'up',
        icon: DollarSign,
        accentColor: 'success',
        progress: 72,
    },
    {
        title: '用户',
        value: '2,350',
        description: '较上周',
        change: '+12.5%',
        trend: 'up',
        icon: Users,
        accentColor: 'info',
        progress: 58,
    },
    {
        title: '跳出率',
        value: '18.2%',
        description: '较上月',
        change: '-3.1%',
        trend: 'down',
        icon: Activity,
        accentColor: 'destructive',
        progress: 18,
    },
    {
        title: '订单',
        value: '1,247',
        description: '较上周',
        change: '+8.7%',
        trend: 'up',
        icon: ShoppingCart,
        accentColor: 'secondary',
        progress: 85,
    },
]
</script>

<template>
    <DashboardStats
        title="仪表盘概览"
        subtitle="本季度关键指标"
        :stats="stats"
    />
</template>
