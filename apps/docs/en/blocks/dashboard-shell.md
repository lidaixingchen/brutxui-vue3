---
title: Dashboard Shell
description: Neo-Brutalist dashboard layout with a collapsible sidebar, top bar, and main content area.
translated: true
---

# Dashboard Shell

A Neo-Brutalist dashboard layout featuring a collapsible sidebar, top bar, and main content area. Provides a left sidebar, top navigation, and a responsive content area.

## Demo

<ComponentPreview>
  <DashboardShellDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="dashboard-shell" />

## Usage

```vue
<script setup>
import DashboardShell from '@/components/ui/dashboard-shell/DashboardShell.vue'

function handleSignOut() {
    console.log('Sign out clicked')
}
</script>

<template>
    <DashboardShell
        user-email="user@example.com"
        @sign-out="handleSignOut"
    >
        <template #sidebar>
            <a class="block px-2 py-1.5 text-sm font-bold bg-brutal-muted border-3 border-brutal shadow-brutal-sm" href="#">Dashboard</a>
            <a class="block px-2 py-1.5 text-sm font-bold text-brutal-muted-foreground" href="#">Analytics</a>
            <a class="block px-2 py-1.5 text-sm font-bold text-brutal-muted-foreground" href="#">Settings</a>
        </template>

        <template #header>
            <span class="font-bold">Dashboard</span>
        </template>

        <p>Main content goes here.</p>
    </DashboardShell>
</template>
```

## Props

### DashboardShell

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `userEmail` | `string` | locale: `dashboardShell.defaultEmail` | User email |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
| ---- | ---- | ---- |
| `signOut` | — | Emitted when the sign out button is clicked |

## Slots

| Slot | Scope | Description |
| ---- | ---- | ---- |
| `sidebar` | — | Navigation items in the sidebar |
| `header` | — | Content in the top bar |
| `default` | — | Main content area |

## Accessibility

- **Keyboard**: Supports `Tab` to navigate between navigation items, `Escape` to close the mobile menu
- **ARIA**: Hamburger menu button uses `aria-expanded` to indicate menu state
- **Focus Management**: When the mobile menu is open, focus is locked within the sidebar
