---
title: Dashboard Stats
description: Statistics card group block for displaying key performance indicators in dashboards.
---

# Dashboard Stats

A Neo-Brutalist styled statistics card group designed to showcase key business metrics and trend shifts. Each card supports custom trend indicators, icons, accent colors, and optional progress bars, automatically arranging inside a responsive grid layout.

## Preview

<ComponentPreview>
  <DashboardStatsDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="dashboard-stats" />

## Usage

```vue
<script setup>
import DashboardStats from '@/components/ui/dashboard-stats/DashboardStats.vue'
import { Users, DollarSign, FolderOpen, TrendingUp } from '@lucide/vue'

const stats = [
    {
        title: 'Total Users',
        value: '1,234',
        description: 'Active users this month',
        change: '+12.5%',
        trend: 'up',
        icon: Users,
    },
    {
        title: 'Revenue',
        value: '$45.6K',
        description: 'Monthly revenue',
        change: '+8.2%',
        trend: 'up',
        icon: DollarSign,
    },
    {
        title: 'Active Projects',
        value: '89',
        description: 'Currently active',
        change: '-3.1%',
        trend: 'down',
        icon: FolderOpen,
    },
    {
        title: 'Conversion',
        value: '24.8%',
        description: 'Visitor to customer',
        change: '0%',
        trend: 'neutral',
        icon: TrendingUp,
    },
]
</script>

<template>
    <DashboardStats :stats="stats" />
</template>
```

## Data Types

```ts
interface StatItem {
    title: string
    value: string
    description: string
    change: string
    trend: 'up' | 'down' | 'neutral'
    icon: Component
    accentColor?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'success' | 'info'
    progress?: number
}
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `stats` | `StatItem[]` | `[]` | Array of statistics items data. |
| `title` | `string` | locale: `dashboardStats.defaultTitle` | Main title of the statistics group. |
| `subtitle` | `string` | — | Subtitle description of the statistics group. |
| `class` | `string` | — | Custom CSS styling classes. |

## Events

| Event | Arguments | Description |
|------|------|------|
| `stat-click` | `[index: number]` | Emitted when a statistics card is clicked, returning the card index. |

## Accessibility

- **Keyboard Navigation**: Supports `Tab` to cycle focus states between cards, and `Space` / `Enter` to emit click events.
- **ARIA Attributes**: The card group wrapper utilizes semantic `role="region"` or `role="list"`, and individual cards leverage `role="listitem"`.
- **Focus Management**: Cards display distinct border focus rings when navigated via keyboard.
