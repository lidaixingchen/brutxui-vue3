---
title: Dashboard Stats
description: Dashboard statistics card displaying core business metrics with large numbers and comparison labels.
translated: true
---

# Dashboard Stats

A Neo-Brutalist dashboard statistics block for displaying key metrics, supporting trends, icons, and progress bars.

## Demo

<ComponentPreview>
  <DashboardStatsDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="dashboard-stats" />

## Usage

```vue
<script setup>
import { DashboardStats } from 'brutx-ui-vue'
import { DollarSign, Users, Activity } from '@lucide/vue'

const stats = [
    {
        title: 'Revenue',
        value: '$45,231',
        description: 'Total revenue this month',
        change: '+20.1%',
        trend: 'up',
        icon: DollarSign,
        accentColor: 'primary',
        progress: 75,
    },
    {
        title: 'Users',
        value: '+2,350',
        description: 'New users this month',
        change: '+12.5%',
        trend: 'up',
        icon: Users,
        accentColor: 'secondary',
        progress: 60,
    },
    {
        title: 'Bounce Rate',
        value: '12.3%',
        description: 'Visitor bounce rate',
        change: '-2.1%',
        trend: 'down',
        icon: Activity,
        accentColor: 'destructive',
    },
]
</script>

<template>
    <DashboardStats
        title="Overview Performance"
        subtitle="Key metrics for this month"
        :stats="stats"
    />
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

## Accent Colors

The `accentColor` property of each stat item controls the icon background and progress bar color:

| Value | Color |
|----|------|
| `primary` | Coral (`--brutal-primary`) |
| `secondary` | Mint cyan (`--brutal-secondary`) |
| `accent` | Yellow (`--brutal-accent`) |
| `destructive` | Red (`--brutal-destructive`) |
| `success` | Green (`--brutal-success`) |
| `info` | Blue (`--brutal-info`) |

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `stats` | `StatItem[]` | `[]` | Stat item data array |
| `title` | `string` | Internationalized default | Title text |
| `subtitle` | `string` | — | Subtitle text |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | Icon size |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Payload | Description |
|------|------|------|
| `stat-click` | `number` | Fired when a stat card is clicked; payload is the card index |

## Accessibility

- **Keyboard Operation**: Stat cards support keyboard navigation and `Enter` / `Space` activation
- **ARIA Attributes**: Cards contain title and description text content, accessible to screen readers
