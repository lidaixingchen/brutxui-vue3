---
title: Loading
description: Loading component and custom directive to provide clear Neo-Brutalist loader masks during data fetching or heavy computations.
---

# Loading

Provides a wrapper `Loading` component and a convenient `v-loading` custom directive to lock interactions during heavy tasks, displaying a bold bordered loading indicator and themed text.

## Preview

<ComponentPreview>
  <LoadingDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="loading" />

## Usage

### Declarative Wrapper Usage

Wrap around the block element that needs a loading overlay. Control the active state via the `loading` prop, and customize the description via the `text` prop.

```vue
<script setup>
import { ref } from 'vue'
import { Loading } from 'brutx-ui-vue'

const loading = ref(true)
</script>

<template>
    <Loading :loading="loading" text="Fetching core data...">
        <div class="card">
            <h4>Account Details</h4>
            <p>Withdrawable Balance: $ 1500.00</p>
        </div>
    </Loading>
</template>
```

### Directive Usage

Mount the `v-loading` directive directly onto standard HTML elements. Customize the text by applying the `v-loading-text` attribute.

```vue
<script setup>
import { ref } from 'vue'

const isDataLoading = ref(true)
</script>

<template>
    <div v-loading="isDataLoading" v-loading-text="'Parsing database...'">
        <p>Today's orders: 1,250</p>
        <p>Delivery rate: 98.5%</p>
    </div>
</template>
```

## Props

### Loading Component

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `loading` | `boolean` | `false` | Whether to display the loading overlay |
| `text` | `string` | `''` | Custom loading description text |

## Accessibility

- **Pointer Events**: The overlay has `pointer-events-none` on the loader spinner itself but locks inputs to child items to prevent double-submits.
- **Position Hijack**: Safely upgrades host positioning to `relative` during loading (reverting back on unmount) to prevent leakage of absolute loaders.
