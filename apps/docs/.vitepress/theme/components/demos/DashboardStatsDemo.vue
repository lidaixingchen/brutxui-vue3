<script setup lang="ts">
import { DashboardStats } from 'brutx-ui-vue'
import { DollarSign, Users, Activity, ShoppingCart } from '@lucide/vue'
import type { StatItem } from 'brutx-ui-vue'

const stats: StatItem[] = [
    {
        title: 'Revenue',
        value: '$45,231',
        description: 'from last month',
        change: '+20.1%',
        trend: 'up',
        icon: DollarSign,
        accentColor: 'success',
        progress: 72,
    },
    {
        title: 'Users',
        value: '2,350',
        description: 'from last week',
        change: '+12.5%',
        trend: 'up',
        icon: Users,
        accentColor: 'info',
        progress: 58,
    },
    {
        title: 'Bounce Rate',
        value: '18.2%',
        description: 'from last month',
        change: '-3.1%',
        trend: 'down',
        icon: Activity,
        accentColor: 'destructive',
        progress: 18,
    },
    {
        title: 'Orders',
        value: '1,247',
        description: 'from last week',
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
        title="Dashboard Overview"
        subtitle="Key metrics for this quarter"
        :stats="stats"
    />
</template>
