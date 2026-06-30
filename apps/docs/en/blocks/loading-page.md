---
title: Loading Page
description: Full-page loading state section with spinner, skeleton decorations, and optional progress bar.
translated: true
---

# Loading Page

A neo-brutalist full-page loading state featuring a Spinner indicator, Skeleton decorative elements, and an optional Progress bar.

## Demo

<ComponentPreview>
  <LoadingPageDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="loading-page" />

## Usage

```vue
<script setup>
import LoadingPage from '@/components/ui/loading-page/LoadingPage.vue'
</script>

<template>
    <LoadingPage
        title="Loading"
        description="Please wait, content is loading..."
    />
</template>
```

### With Progress Bar

```vue
<script setup>
import LoadingPage from '@/components/ui/loading-page/LoadingPage.vue'
import { ref } from 'vue'

const progress = ref(65)
</script>

<template>
    <LoadingPage
        :progress="progress"
    />
</template>
```

## Props

| Prop | Type | Default | Description |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `loadingPage.defaultTitle` | Loading page title text |
| `description` | `string` | locale: `loadingPage.defaultDescription` | Loading page description text |
| `progress` | `number` | — | Progress percentage (0-100), shows a progress bar when provided |
| `class` | `string` | — | Custom style class |

## Slots

| Slot | Scope | Description |
| ---- | ---- | ---- |
| `header` | — | Replace/extend the section header |
| `default` | — | Replace the section body content |
| `footer` | — | Replace/extend the section footer |

## Accessibility

- **Semantic structure**: Uses semantic HTML elements to ensure screen readers correctly identify the loading state
- **ARIA attributes**: Notifies assistive technologies of the current loading state via `aria-live` and `aria-busy` attributes
- **Progress feedback**: When `progress` is provided, the progress bar conveys progress information through attributes like `aria-valuenow`
