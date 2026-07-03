---
title: Rate
description: A rate component with high-contrast borders, custom HSL themed yellow stars, and micro-hover transitions.
---

# Rate

A rating component built on Lucide Star vector icons. Active stars feature high-saturation HSL-themed golden fills, heavy black borders, and springy hover-scaling micro-interactions.

## Preview

<ComponentPreview>
  <RateDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="rate" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Rate } from 'brutx-ui-vue'

const value = ref(3)
</script>

<template>
    <Rate v-model="value" />
</template>
```

## Half Star Support

Allow decimal ratings (half stars) using the `allow-half` property.

```vue
<script setup>
import { ref } from 'vue'
import { Rate } from 'brutx-ui-vue'

const value = ref(3.5)
</script>

<template>
    <Rate v-model="value" allow-half />
</template>
```

## Max Stars Count

Change the upper limit of the rating scale (default is `5`) using the `max` property.

```vue
<template>
    <Rate v-model="value" :max="10" />
</template>
```

## Readonly Mode

Add the `readonly` attribute to make the rating static, removing hover states, transitions, and click handlers.

```vue
<template>
    <Rate v-model="value" readonly allow-half />
</template>
```

## Sizes

The component supports `sm`, `md`, and `lg` sizes:

```vue
<template>
    <Rate v-model="value" size="sm" />
    <Rate v-model="value" size="md" />
    <Rate v-model="value" size="lg" />
</template>
```

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `modelValue` | `number` | `0` | Bound rating value, supports `v-model` |
| `max` | `number` | `5` | Maximum rating value (total stars) |
| `allowHalf` | `boolean` | `false` | Whether to allow half-star selection |
| `readonly` | `boolean` | `false` | Read-only mode |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Component size |

## Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:modelValue` | `number` | Triggers when the score changes, supporting v-model |
| `change` | `number` | Triggers when value is changed on selection |
