---
title: Result
description: Feedbacks and results page component using colored high-contrast status icons.
---

# Result

Used to inform the user about operational results (such as success, warning, system info, or failures). Features a distinct bold bordered square status box, robust header/description text, and action slot layouts.

## Preview

<ComponentPreview>
  <ResultDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="result" />

## Usage

### Basic Success Receipt

Show basic success receipts.

```vue
<script setup>
import { Result } from 'brutx-ui-vue'
</script>

<template>
    <Result
        status="success"
        title="Payment Succeeded"
        sub-title="Your payment has been cleared. Shipment will dispatch shortly."
    />
</template>
```

### Action Controls

Inject buttons inside the `#extra` slot layout to allow further navigation or retries.

```vue
<template>
    <Result
        status="error"
        title="Submission Failed"
        sub-title="Gateway timeout occurred. Please modify settings and try submitting again."
    >
        <template #extra>
            <button class="btn btn-primary" @click="retry">Retry Now</button>
        </template>
    </Result>
</template>
```

### Empty State

`Result` supports `status="empty"` and is the recommended entry for empty states.

```vue
<template>
    <Result
        status="empty"
        title="No data yet"
        sub-title="Create your first record and it will appear here."
    />
</template>
```

## Props

### Result

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `status` | `'success' \| 'error' \| 'info' \| 'warning' \| 'empty'` | `'info'` | Action feedback status, controlling the color and graphic of the status emblem |
| `title` | `string` | `''` | Result title text |
| `subTitle` | `string` | `''` | Secondary description text |
| `variant` | `'plain' \| 'card'` | `'card'` | Whether to render card chrome with border and hard shadow |
| `iconSize` | `IconSize` | — | Status icon size |

## Slots

### Result

| Slot | Description |
|------|-------------|
| `icon` | Customize/override the status emblem icon box |
| `title` | Customize/override the result title content |
| `subTitle` | Customize/override the secondary description content |
| `extra` | Custom footer action area layout |

## Accessibility

- **Semantic structure**: The heading level is set via `titleAs` (`h2`/`h3`); the subtitle is rendered as a `<p>` description.
- **Decorative icons**: The status icon is marked `aria-hidden` so assistive technology does not announce meaningless icon names.
- **Color is not the only signal**: Status colors (`--brutal-status-*`) are decorative; the copy (title/subtitle) carries the meaning. Foreground follows the `*-foreground` token for contrast (success/info black-on-color 8.6:1 / 5.8:1, passing WCAG AA).
- **Reduced motion**: Respects `prefers-reduced-motion`; no motion-critical behavior.
