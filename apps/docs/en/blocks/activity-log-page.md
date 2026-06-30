---
title: Activity Log Page
description: Activity log page section with table, type badges, and pagination.
translated: true
---

# Activity Log Page

A neo-brutalist activity log page featuring a table view, type badges, and pagination component. Suitable for displaying system operation records, audit logs, and similar scenarios.

## Demo

<ComponentPreview>
  <ActivityLogPageDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="activity-log-page" />

## Usage

```vue
<script setup>
import ActivityLogPage from '@/components/ui/activity-log-page/ActivityLogPage.vue'

const activities = [
    {
        id: '1',
        action: 'User Login',
        user: 'admin',
        timestamp: '2024-01-15 10:00',
        type: 'info',
    },
    {
        id: '2',
        action: 'Config Update',
        user: 'system',
        timestamp: '2024-01-15 09:30',
        details: 'Rate limit changed',
        type: 'warning',
    },
    {
        id: '3',
        action: 'Deploy Failed',
        user: 'ci-bot',
        timestamp: '2024-01-15 09:00',
        details: 'Build timeout',
        type: 'error',
    },
]

function handleEntryClick(id: string) {
    console.log('Entry clicked:', id)
}
</script>

<template>
    <ActivityLogPage
        :activities="activities"
        @entry-click="handleEntryClick"
    />
</template>
```

## Data Types

```ts
interface ActivityEntry {
    id: string
    action: string
    user: string
    timestamp: string
    details?: string
    type: 'info' | 'warning' | 'error' | 'success'
}
```

## Props

### ActivityLogPage

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | locale: `activityLogPage.defaultTitle` | Page title |
| `activities` | `ActivityEntry[]` | `[]` | Activity log data |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
|------|------|------|
| `entry-click` | `[id: string]` | Triggered when a log entry is clicked |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `header` | — | Custom page title area |
| `default` | — | Custom main content area (replaces table and pagination) |
| `footer` | — | Page bottom content |

## Accessibility

- **Keyboard**: Supports `Space` / `Enter` to trigger entry click
- **ARIA attributes**: Table uses semantic `<table>` markup, pagination controls use `aria-label` for identification
- **Focus management**: Interactive elements support Tab key navigation
- **Motion reduction**: Respects `prefers-reduced-motion` system setting, automatically disables or simplifies animations (where applicable)
