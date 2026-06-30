---
title: Empty State
description: Empty data placeholder block with a large icon, subtitle, and primary action button.
translated: true
---

# Empty State

A Neo-Brutalist empty state placeholder featuring a decorative icon, title, description, and action button.

## Demo

<ComponentPreview>
  <EmptyStateDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="empty-state" />

## Usage

```vue
<script setup>
import EmptyState from '@/components/ui/empty-state/EmptyState.vue'
import { Server } from '@lucide/vue'

function handleAction() {
    console.log('Action clicked')
}
</script>

<template>
    <EmptyState
        title="No active deployments found"
        description="Get started by deploying your first application to the cloud."
        action-text="Deploy New App"
        :icon="Server"
        @action="handleAction"
    />
</template>
```

## Variants

### Custom Icon

```vue
<script setup>
import EmptyState from '@/components/ui/empty-state/EmptyState.vue'
import { Inbox } from '@lucide/vue'
</script>

<template>
    <EmptyState
        title="No messages yet"
        description="Your inbox is empty. Start a conversation."
        action-text="New Message"
        :icon="Inbox"
    />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | locale: `emptyState.defaultTitle` | Title text |
| `description` | `string` | — | Description text |
| `actionText` | `string` | locale: `emptyState.defaultActionText` | Action button text |
| `icon` | `Component` | `FolderOpen` (from @lucide/vue) | Decorative icon |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
|------|------|------|
| `action` | — | Emitted when the action button is clicked |

## Accessibility

- **Keyboard**: Action button supports `Tab` focus, `Enter` / `Space` to trigger click
- **ARIA**: Icon is hidden via `aria-hidden`; action button provides a clear text label
- **Focus Management**: Focus can naturally flow to the action button after page load
