---
title: Quick Actions
description: Quick actions panel with an icon button grid and title badge.
translated: true
---

# Quick Actions

A Neo-Brutalist quick actions panel featuring a title badge and an icon button grid.

## Demo

<ComponentPreview>
  <QuickActionsDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="quick-actions" />

## Usage

```vue
<script setup>
import QuickActions from '@/components/ui/quick-actions/QuickActions.vue'
import { Plus, Upload, Search, Settings } from '@lucide/vue'

const actions = [
    { label: 'New Post', icon: Plus, variant: 'primary' },
    { label: 'Upload', icon: Upload, variant: 'secondary' },
    { label: 'Search', icon: Search, variant: 'outline' },
    { label: 'Settings', icon: Settings, variant: 'outline' },
]

function handleAction(index: number) {
    console.log('Action clicked:', actions[index].label)
}
</script>

<template>
    <QuickActions
        title="Quick Actions"
        :actions="actions"
        @action-click="handleAction"
    />
</template>
```

## Data Types

```ts
interface ActionItem {
    label: string
    icon: Component
    variant?: 'primary' | 'secondary' | 'outline' | 'danger'
}
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | locale: `quickActions.defaultTitle` | Panel title |
| `actions` | `ActionItem[]` | `[]` | Action item data |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
|------|------|------|
| `action-click` | `[index: number]` | Emitted when an action button is clicked; parameter is the button index |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `actions` | — | Action area below the action grid |

## Accessibility

- **Keyboard**: Action buttons support `Tab` focus, `Enter` / `Space` to trigger click
- **ARIA**: Buttons automatically add `aria-label`; icons are hidden via `aria-hidden`
- **Focus Management**: Supports keyboard navigation to switch focus between action buttons
