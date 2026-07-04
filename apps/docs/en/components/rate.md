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

### Basic Usage

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

### Half Star Support

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

### Max Stars Count

Change the upper limit of the rating scale (default is `5`) using the `max` property.

```vue
<template>
    <Rate v-model="value" :max="10" />
</template>
```

### Readonly Mode

Add the `readonly` attribute to make the rating static, removing hover states, transitions, and click handlers.

```vue
<template>
    <Rate v-model="value" readonly allow-half />
</template>
```

## Sizes

| Size | Description |
|------|-------------|
| `sm` | Small size (20px / 5/4 gap) |
| `md` | Default size (28px / 6 gap) |
| `lg` | Large size (36px / 8 gap) |

## Props

### Rate

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `number` | `0` | Bound rating value, supports dual-binding |
| `max` | `number` | `5` | Maximum rating value (total stars) |
| `allowHalf` | `boolean` | `false` | Whether to allow half-star selection |
| `readonly` | `boolean` | `false` | Read-only mode |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Component size |

## Events

### Rate

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:modelValue` | `number` | Triggers when the score changes, supporting v-model |
| `change` | `number` | Triggers when value is changed on selection |

## Accessibility

- **Keyboard Interaction**: The component currently interacts mainly via mouse hover and clicks
- **ARIA Attributes**: The root element has `role="slider"`, `aria-valuenow` representing the current rating score, `aria-valuemin="0"`, `aria-valuemax` mapped to `max`, and `aria-readonly` indicating readonly state
- **Reduced Motion**: Springy scale animation on hover honors `prefers-reduced-motion` settings and automatically downgrades (if applicable)

