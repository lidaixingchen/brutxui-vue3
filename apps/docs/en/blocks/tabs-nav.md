---
title: Tabs Nav
description: Tab navigation block with tab triggers and content panels.
translated: true
---

# Tabs Nav

A Neo-Brutalist tab navigation block featuring tab triggers and corresponding content panels, built on reka-ui Tabs primitives.

## Demo

<ComponentPreview>
  <TabsNavDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="tabs-nav" />

## Usage

Basic usage -- pass a `tabs` array to render the tab navigation:

```vue
<script setup>
import TabsNav from '@/components/ui/tabs-nav/TabsNav.vue'

const tabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'Features', value: 'features' },
    { label: 'Pricing', value: 'pricing' },
]
</script>

<template>
    <TabsNav :tabs="tabs" model-value="overview">
        <template #default>
            <!-- Custom content panels -->
        </template>
    </TabsNav>
</template>
```

### Custom Content Panels

Use the `#default` slot to customize the content panel for each tab, replacing the default Card display:

```vue
<script setup>
import TabsNav from '@/components/ui/tabs-nav/TabsNav.vue'
import Card from '@/components/ui/card/Card.vue'

const tabs = [
    { label: 'Tab A', value: 'a' },
    { label: 'Tab B', value: 'b' },
]
</script>

<template>
    <TabsNav :tabs="tabs">
        <template #default>
            <!-- Use TabsContent to customize each panel -->
        </template>
    </TabsNav>
</template>
```

## Data Types

### TabItem

```ts
interface TabItem {
    label: string
    value: string
}
```

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `string` | Tab display text |
| `value` | `string` | Unique tab identifier |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tabs` | `TabItem[]` | `[]` | Tab data array |
| `modelValue` | `string` | First tab's value | Currently active tab value; supports `v-model` two-way binding |
| `class` | `string` | — | Custom root element CSS class |

## Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `header` | — | Replace/extend the block header |
| `default` | — | Replace the tab content panel area; by default renders a Card display for each tab |
| `footer` | — | Replace/extend the block footer |

## Accessibility

- Tab triggers are based on the reka-ui `TabsRoot` primitive and automatically follow the WAI-ARIA Tabs pattern
- Each tab trigger has `role="tab"`, and the tab list has `role="tablist"`
- Content panels have `role="tabpanel"` and are associated with their corresponding tab via `aria-labelledby`
- Keyboard navigation is supported: `Arrow Left`/`Arrow Right` to switch between tabs, `Home`/`End` to jump to the first/last tab
- When `tabs` is empty, an `EmptyState` component is displayed to indicate no content
