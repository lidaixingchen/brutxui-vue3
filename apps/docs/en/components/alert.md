---
title: Alert
description: Neo-brutalist alert component supporting multiple variants, status colors, and custom icons.
translated: true
---

# Alert

A neo-brutalist style alert component for displaying status messages, supporting 7 color variants.

## Demo

<ComponentPreview>
  <AlertDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="alert" />

## Usage

```vue
<script setup>
import { Alert, AlertTitle, AlertDescription } from 'brutx-ui-vue'
</script>

<template>
    <Alert variant="default">
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
    </Alert>
</template>
```

## Variants

| Variant | Description |
|------|------|
| `default` | Standard background with foreground text |
| `primary` | Primary (coral) background |
| `secondary` | Secondary (mint) background |
| `success` | Success (green) background |
| `warning` | Warning (yellow) background |
| `danger` | Destructive (red) background |
| `info` | Info (blue) background |

```vue
<script setup>
import { Alert } from 'brutx-ui-vue'
</script>

<template>
    <Alert variant="success">Operation completed successfully.</Alert>
    <Alert variant="danger">Failed to save changes.</Alert>
    <Alert variant="info">A new version is available.</Alert>
</template>
```

## With Icon

Alert supports placing icons via SVG child elements. The icon is absolutely positioned on the left side:

```vue
<script setup>
import { Alert, AlertTitle, AlertDescription } from 'brutx-ui-vue'
import { Terminal } from '@lucide/vue'
</script>

<template>
    <Alert variant="default">
        <Terminal class="h-5 w-5" />
        <AlertTitle>Terminal</AlertTitle>
        <AlertDescription>Run commands in your terminal.</AlertDescription>
    </Alert>
</template>
```

## Closable Alert

Use the `closable` prop to render a close button in the top-right corner of the alert (using the Button component with `variant="ghost" size="icon"`). Clicking the button triggers the `close` event. When `closable` is enabled, the alert automatically adds right padding (`pr-12`) to prevent content from overlapping with the button.

```vue
<script setup>
import { ref } from 'vue'
import { Alert, AlertTitle, AlertDescription } from 'brutx-ui-vue'

const visible = ref(true)

function handleClose() {
    visible.value = false
}
</script>

<template>
    <Alert v-if="visible" variant="info" closable @close="handleClose">
        <AlertTitle>Closable Alert</AlertTitle>
        <AlertDescription>Click the x button in the top-right corner to close this alert.</AlertDescription>
    </Alert>
</template>
```

## Action Buttons

Use the `actions` named slot to add an action button area below the alert content. The slot content is rendered in a flex container with spacing (`mt-3 flex items-center gap-2`).

```vue
<script setup>
import { Alert, AlertTitle, AlertDescription, Button } from 'brutx-ui-vue'
</script>

<template>
    <Alert variant="warning">
        <AlertTitle>Storage Space Low</AlertTitle>
        <AlertDescription>Your storage is 90% full. Please clean up or upgrade soon.</AlertDescription>
        <template #actions>
            <Button variant="primary" size="sm">Upgrade Now</Button>
            <Button variant="outline" size="sm">Remind Later</Button>
        </template>
    </Alert>
</template>
```

## Props

### Alert

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | Alert variant type |
| `closable` | `boolean` | `false` | Whether to show the close button |
| `class` | `string` | — | Custom CSS class |

### AlertTitle

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `'h5'` | The rendered HTML element or component |
| `asChild` | `boolean` | — | Whether to pass props to the child element |
| `class` | `string` | — | Custom CSS class |

### AlertDescription

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `class` | `string` | — | Custom CSS class |

## Events

### Alert

| Event | Payload | Description |
|------|------|------|
| `close` | `[]` | Emitted when the close button is clicked |

## Slots

### Alert

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Main content of the alert |
| `actions` | — | Action button area, rendered below the content |

### AlertTitle

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Title content |

### AlertDescription

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Description content |

## Accessibility

- **ARIA Role**: The component automatically sets `role="alert"` to ensure screen readers can identify and announce alert content
- **Keyboard Interaction**: The close button of a closable alert supports Tab focus, Enter/Space to trigger close
- **Focus Management**: The close button has a visible focus indicator, meeting keyboard navigation standards
- **Semantic Structure**: `AlertTitle` renders as an `h5` heading element by default, providing a clear content hierarchy
