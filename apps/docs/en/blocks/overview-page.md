---
title: Overview Page
description: Dashboard overview page section with stat cards and activity panel.
translated: true
---

# Overview Page

A neo-brutalist dashboard overview page featuring a stat cards grid and an activity panel. Suitable for a dashboard homepage displaying key metrics and recent activity.

## Demo

<ComponentPreview>
  <OverviewPageDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="overview-page" />

## Usage

```vue
<script setup>
import OverviewPage from '@/components/ui/overview-page/OverviewPage.vue'

const stats = [
    {
        title: 'Revenue',
        value: '$12,500',
        change: '+12.5%',
        trend: 'up',
    },
    {
        title: 'Users',
        value: '1,234',
        change: '+8.2%',
        trend: 'up',
    },
    {
        title: 'Bounce Rate',
        value: '24.3%',
        change: '-2.1%',
        trend: 'down',
    },
    {
        title: 'Sessions',
        value: '5,678',
        change: '+0.5%',
        trend: 'neutral',
    },
]

function handleStatClick(index: number) {
    console.log('Stat clicked:', index)
}
</script>

<template>
    <OverviewPage
        :stats="stats"
        @stat-click="handleStatClick"
    >
        <!-- Recent Activity slot content -->
        <div class="space-y-2">
            <div class="text-sm font-medium">New user signed up</div>
            <div class="text-sm font-medium">Payment received</div>
        </div>
    </OverviewPage>
</template>
```

## Data Types

```ts
interface OverviewStat {
    title: string
    value: string
    change: string
    trend: 'up' | 'down' | 'neutral'
}
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | locale: `overviewPage.defaultTitle` | Page title |
| `stats` | `OverviewStat[]` | `[]` | Stat item data |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
|------|------|------|
| `stat-click` | `[index: number]` | Triggered when a stat card is clicked, payload is the card index |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `header` | — | Custom page title area |
| `default` | — | Recent Activity card content area |
| `footer` | — | Page bottom content |

## Accessibility

- **Keyboard**: Stat cards support `Tab` focusing, `Enter` / `Space` to trigger click
- **ARIA attributes**: Stat cards automatically add `role="button"` and `aria-label`
- **Focus management**: Supports keyboard navigation to move focus between stat cards
