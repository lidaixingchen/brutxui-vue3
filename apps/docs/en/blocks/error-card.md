---
title: Error Card
description: Error state card block with a warning alert, retry and dismiss buttons.
translated: true
---

# Error Card

A Neo-Brutalist error card featuring an Alert danger message, title, description, and retry/dismiss action buttons.

## Demo

<ComponentPreview>
  <ErrorCardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="error-card" />

## Usage

```vue
<script setup>
import ErrorCard from '@/components/ui/error-card/ErrorCard.vue'

function handleRetry() {
    console.log('Retry clicked')
}

function handleDismiss() {
    console.log('Dismiss clicked')
}
</script>

<template>
    <ErrorCard
        title="Something went wrong"
        description="An unexpected error occurred. Please try again."
        retry-text="Retry"
        @retry="handleRetry"
        @close="handleDismiss"
    />
</template>
```

### Custom Text

```vue
<script setup>
import ErrorCard from '@/components/ui/error-card/ErrorCard.vue'
</script>

<template>
    <ErrorCard
        title="Upload Failed"
        description="Your file could not be uploaded. Check the format and try again."
        retry-text="Re-upload"
        @retry="retryUpload"
        @close="cancelUpload"
    />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `title` | `string` | locale: `errorCard.defaultTitle` | Error title |
| `description` | `string` | locale: `errorCard.defaultDescription` | Error description |
| `retryText` | `string` | locale: `errorCard.defaultRetryText` | Retry button text |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Parameters | Description |
|------|------|------|
| `retry` | — | Emitted when the retry button is clicked |
| `close` | — | Emitted when the dismiss button is clicked |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `actions` | — | Extra action button area |

## Accessibility

- **Keyboard**: Supports `Tab` to navigate between buttons, `Enter` / `Space` to trigger button actions
- **ARIA**: Alert component uses `role="alert"` to indicate error state
- **Focus Management**: Focus order follows the document flow; buttons display a visible focus indicator when focused
