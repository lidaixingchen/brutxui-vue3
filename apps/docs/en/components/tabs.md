---
title: Tabs
description: Tab component with press-switch animation and highly distinctive active state borders.
translated: true
---

# Tabs

A neo-brutalist style tab navigation component built on top of reka-ui's Tabs primitive. Supports horizontal/vertical layouts, controlled mode, and multiple active state color variants.

## Demo

<ComponentPreview>
  <TabsDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="tabs" />

## Usage

```vue
<script setup>
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'brutx-ui-vue/tabs'
</script>

<template>
    <Tabs default-value="account">
        <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
            <p class="text-sm">Manage your account settings.</p>
        </TabsContent>
        <TabsContent value="password">
            <p class="text-sm">Change your password here.</p>
        </TabsContent>
    </Tabs>
</template>
```

### Vertical Layout

Set the `orientation` prop on `Tabs` to `vertical` for a vertical layout. In vertical mode, `TabsList` automatically switches to a vertical arrangement (`flex-col`), making it suitable for sidebar navigation and similar scenarios.

The `orientation` prop is passed to child components via dependency injection, so `TabsList` automatically adapts to the direction without needing to be set individually. If you need to override the direction on a single `TabsList`, you can set its `orientation` prop directly.

```vue
<script setup>
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'brutx-ui-vue/tabs'
</script>

<template>
    <Tabs default-value="general" orientation="vertical" class="flex gap-4">
        <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
            <p class="text-sm">General settings options.</p>
        </TabsContent>
        <TabsContent value="security">
            <p class="text-sm">Security settings options.</p>
        </TabsContent>
        <TabsContent value="notifications">
            <p class="text-sm">Notification settings options.</p>
        </TabsContent>
    </Tabs>
</template>
```

### Controlled Mode

Use `v-model` for controlled tab switching:

```vue
<script setup>
import { ref } from 'vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'brutx-ui-vue/tabs'

const currentTab = ref('account')
</script>

<template>
    <Tabs v-model="currentTab">
        <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
            <p class="text-sm">Manage your account settings.</p>
        </TabsContent>
        <TabsContent value="password">
            <p class="text-sm">Change your password here.</p>
        </TabsContent>
    </Tabs>
</template>
```

## Variants

`TabsTrigger` supports the following active state color variants:

| Variant | Description |
|------|------|
| `default` | Default active state style |
| `primary` | Primary (coral) background |
| `secondary` | Secondary background |
| `success` | Success (green) background |

```vue
<template>
    <TabsTrigger value="tab" variant="primary">Primary variant</TabsTrigger>
</template>
```

## Sizes

`TabsList` supports the following container sizes:

| Size | Description |
|------|------|
| `sm` | Small |
| `default` | Default |
| `lg` | Large |

## Sub-components

| Component | Description |
|------|------|
| `Tabs` | Root component (wraps reka-ui's `TabsRoot`) |
| `TabsList` | Tab trigger container |
| `TabsTrigger` | Clickable tab button |
| `TabsContent` | Content panel for each tab |

## Exported Types

Import from the `brutx-ui-vue/tabs` sub-path:

```ts
import {
    Tabs,
    TabsRoot, // reka-ui raw component
    TabsList,
    TabsTrigger,
    TabsContent,
    tabsListVariants,
    tabsTriggerVariants,
    tabsContentVariants,
} from 'brutx-ui-vue/tabs'
```

## Composables

The component exports the following variant utility functions for custom style extensions:

```ts
import {
    tabsListVariants,
    tabsTriggerVariants,
    tabsContentVariants,
} from 'brutx-ui-vue/tabs'
```

| Function | Variant Parameters | Description |
|------|----------|------|
| `tabsListVariants` | `size`: `'sm' \| 'default' \| 'lg'`, `orientation`: `'horizontal' \| 'vertical'` | Container style variants |
| `tabsTriggerVariants` | `variant`: `'default' \| 'primary' \| 'secondary' \| 'success'` | Trigger style variants |
| `tabsContentVariants` | — | Content panel base style |

## Props

### Tabs

| Prop | Type | Default | Description |
|------|------|--------|------|
| `modelValue` | `string` | — | Value of the currently active tab (controlled mode) |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Tab arrangement direction |
| `class` | `string` | — | Custom CSS class name |

### TabsList

| Prop | Type | Default | Description |
|------|------|--------|------|
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Container size |
| `orientation` | `'horizontal' \| 'vertical'` | Inherited from `Tabs`, defaults to `'horizontal'` | Arrangement direction, can override parent setting |
| `class` | `string` | — | Custom CSS class name |

### TabsTrigger

| Prop | Type | Default | Description |
|------|------|--------|------|
| `value` | `string` | — (required) | Unique identifier for the tab |
| `disabled` | `boolean` | `false` | Whether the tab is disabled |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success'` | `'default'` | Active state color variant |
| `class` | `string` | — | Custom CSS class name |

### TabsContent

| Prop | Type | Default | Description |
|------|------|--------|------|
| `value` | `string` | — (required) | Corresponding tab value |
| `class` | `string` | — | Custom CSS class name |

## Events

| Event | Payload | Description |
|------|------|------|
| `update:modelValue` | `string` | Triggered when the active tab changes |

## Accessibility

- **Keyboard**: Arrow keys navigate between tab triggers
- **ARIA Attributes**: Tab content is associated with its trigger via ARIA attributes; the active tab has `aria-selected="true"`
