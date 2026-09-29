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

### Data-driven Mode (tabs Prop)

Pass a `tabs` array to render `TabsList`, `TabsTrigger`, and default `TabsContent` panels automatically. Omit `tabs` to compose the complete structure through the default slot.

```vue
<script setup lang="ts">
import { Tabs } from 'brutx-ui-vue/tabs'
import type { TabItem } from 'brutx-ui-vue/tabs'

const tabs: TabItem[] = [
    { label: 'Overview', value: 'overview' },
    { label: 'Analytics', value: 'analytics' },
    { label: 'Settings', value: 'settings' },
]
</script>

<template>
    <Tabs :tabs="tabs" default-value="overview" />
</template>
```

#### Custom Content Panels

The default slot replaces the generated Card panels while `TabsList` continues to be generated from `tabs`:

```vue
<script setup lang="ts">
import { Tabs, TabsContent } from 'brutx-ui-vue/tabs'
import type { TabItem } from 'brutx-ui-vue/tabs'

const tabs: TabItem[] = [
    { label: 'Tab A', value: 'a' },
    { label: 'Tab B', value: 'b' },
]
</script>

<template>
    <Tabs :tabs="tabs">
        <template #default>
            <TabsContent value="a">
                <p class="text-sm">Custom content for A</p>
            </TabsContent>
            <TabsContent value="b">
                <p class="text-sm">Custom content for B</p>
            </TabsContent>
        </template>
    </Tabs>
</template>
```

#### header / footer Slots

In data-driven mode, the `header` and `footer` slots add content above and below the tab region. An empty `tabs` array displays a localized Result empty state while retaining these slots.

#### Controlled and Uncontrolled State

- Providing `modelValue` or using `v-model` makes the parent control the active value.
- Omitting `modelValue` lets the component maintain its active value internally.
- The initial selection uses `defaultValue`, then the first item value. If the selected item is removed, the same fallback order applies.

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
    TabsList,
    TabsTrigger,
    TabsContent,
    tabsListVariants,
    tabsTriggerVariants,
    tabsContentVariants,
} from 'brutx-ui-vue/tabs'
import type { TabItem } from 'brutx-ui-vue/tabs'
import { TabsRoot } from 'reka-ui'
```

### TabItem

The data item accepted by the `tabs` prop:

```ts
interface TabItem {
    label: string
    value: string
    disabled?: boolean
}
```

| Field | Type | Description |
| --- | --- | --- |
| `label` | `string` | Visible tab label |
| `value` | `string` | Unique tab identifier |
| `disabled` | `boolean` | Whether this tab is disabled (optional) |

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

## API Reference

<span id="tabs-1"></span>
<span id="tabslist"></span>
<span id="tabstrigger"></span>
<span id="tabscontent"></span>

<ComponentApi name="tabs" />

## Accessibility

- **Keyboard**: Arrow keys navigate between tab triggers
- **ARIA Attributes**: Tab content is associated with its trigger via ARIA attributes; the active tab has `aria-selected="true"`
